<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raidId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$raidId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing raid id']);
    exit;
}

// Fetch raid
$stmt = $db->prepare("SELECT * FROM raids WHERE id = :id");
$stmt->execute([':id' => $raidId]);
$raid = $stmt->fetch();

if (!$raid) {
    http_response_code(404);
    echo json_encode(['error' => 'Raid not found']);
    exit;
}

// Cast numeric fields
$raid['id'] = (int)$raid['id'];
$raid['max_players'] = (int)$raid['max_players'];
$raid['min_tanks'] = (int)$raid['min_tanks'];
$raid['min_healers'] = (int)$raid['min_healers'];
$raid['min_dps'] = (int)$raid['min_dps'];

// Fetch signups
$stmt = $db->prepare("
    SELECT * FROM raid_signups
    WHERE raid_id = :raid_id
    ORDER BY
        FIELD(role, 'tank', 'healer', 'dps'),
        signed_up_at ASC
");
$stmt->execute([':raid_id' => $raidId]);
$signups = $stmt->fetchAll();

foreach ($signups as &$signup) {
    $signup['id'] = (int)$signup['id'];
    $signup['raid_id'] = (int)$signup['raid_id'];
    $signup['bnet_user_id'] = (int)$signup['bnet_user_id'];
    $signup['character_class_id'] = (int)$signup['character_class_id'];
    $signup['character_level'] = (int)$signup['character_level'];
    $signup['character_ilvl'] = (int)$signup['character_ilvl'];
}

$raid['signups'] = $signups;

echo json_encode(['raid' => $raid]);

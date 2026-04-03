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

$sessionId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$sessionId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing session id']);
    exit;
}

// Fetch session
$stmt = $db->prepare("SELECT * FROM mplus_sessions WHERE id = :id");
$stmt->execute([':id' => $sessionId]);
$session = $stmt->fetch();

if (!$session) {
    http_response_code(404);
    echo json_encode(['error' => 'Session not found']);
    exit;
}

$session['id'] = (int)$session['id'];
$session['owner_bnet_id'] = $session['owner_bnet_id'] ? (int)$session['owner_bnet_id'] : null;

// Fetch signups
$stmt = $db->prepare("SELECT * FROM mplus_signups WHERE session_id = :id ORDER BY signed_up_at ASC");
$stmt->execute([':id' => $sessionId]);
$signups = $stmt->fetchAll();

foreach ($signups as &$signup) {
    $signup['id'] = (int)$signup['id'];
    $signup['session_id'] = (int)$signup['session_id'];
    $signup['bnet_user_id'] = (int)$signup['bnet_user_id'];
    $signup['character_class_id'] = (int)$signup['character_class_id'];
    $signup['character_level'] = (int)$signup['character_level'];
    $signup['character_ilvl'] = (int)$signup['character_ilvl'];
    $signup['mplus_rating'] = (int)$signup['mplus_rating'];
}

$session['signups'] = $signups;

echo json_encode(['session' => $session]);

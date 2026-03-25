<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = verifyBnetToken();

if ($method === 'POST') {
    // Sign up for a raid
    $data = getRequestBody();

    $required = ['raid_id', 'character_name', 'character_realm', 'character_class_id', 'role'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }

    $raidId = (int)$data['raid_id'];

    // Check raid exists and is open
    $stmt = $db->prepare("SELECT * FROM raids WHERE id = :id");
    $stmt->execute([':id' => $raidId]);
    $raid = $stmt->fetch();

    if (!$raid) {
        http_response_code(404);
        echo json_encode(['error' => 'Raid not found']);
        exit;
    }

    if ($raid['status'] !== 'open') {
        http_response_code(400);
        echo json_encode(['error' => 'Raid is not accepting signups']);
        exit;
    }

    // Insert or update signup
    $stmt = $db->prepare("
        INSERT INTO raid_signups (raid_id, battletag, bnet_user_id, character_name, character_realm, character_class_id, character_spec, character_level, character_ilvl, role, status, note)
        VALUES (:raid_id, :battletag, :bnet_user_id, :character_name, :character_realm, :character_class_id, :character_spec, :character_level, :character_ilvl, :role, :status, :note)
        ON DUPLICATE KEY UPDATE
            character_name = VALUES(character_name),
            character_realm = VALUES(character_realm),
            character_class_id = VALUES(character_class_id),
            character_spec = VALUES(character_spec),
            character_level = VALUES(character_level),
            character_ilvl = VALUES(character_ilvl),
            role = VALUES(role),
            status = VALUES(status),
            note = VALUES(note),
            updated_at = CURRENT_TIMESTAMP
    ");

    $stmt->execute([
        ':raid_id' => $raidId,
        ':battletag' => $user['battletag'],
        ':bnet_user_id' => (int)$user['id'],
        ':character_name' => $data['character_name'],
        ':character_realm' => $data['character_realm'],
        ':character_class_id' => (int)$data['character_class_id'],
        ':character_spec' => $data['character_spec'] ?? null,
        ':character_level' => (int)($data['character_level'] ?? 80),
        ':character_ilvl' => (int)($data['character_ilvl'] ?? 0),
        ':role' => $data['role'],
        ':status' => $data['status'] ?? 'confirmed',
        ':note' => $data['note'] ?? null
    ]);

    // Check if raid is now full
    $stmt = $db->prepare("
        SELECT COUNT(*) as count FROM raid_signups
        WHERE raid_id = :raid_id AND status != 'declined'
    ");
    $stmt->execute([':raid_id' => $raidId]);
    $result = $stmt->fetch();

    if ((int)$result['count'] >= (int)$raid['max_players']) {
        $stmt = $db->prepare("UPDATE raids SET status = 'full' WHERE id = :id AND status = 'open'");
        $stmt->execute([':id' => $raidId]);
    }

    echo json_encode(['success' => true]);

} elseif ($method === 'PUT') {
    // Update own signup
    $data = getRequestBody();
    $raidId = (int)($data['raid_id'] ?? 0);

    if (!$raidId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing raid_id']);
        exit;
    }

    // Verify signup belongs to this user
    $stmt = $db->prepare("SELECT id FROM raid_signups WHERE raid_id = :raid_id AND bnet_user_id = :uid");
    $stmt->execute([':raid_id' => $raidId, ':uid' => (int)$user['id']]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Signup not found']);
        exit;
    }

    $updates = [];
    $params = [':raid_id' => $raidId, ':uid' => (int)$user['id']];

    $allowedFields = [
        'character_name', 'character_realm', 'character_class_id',
        'character_spec', 'character_level', 'character_ilvl',
        'role', 'status', 'note'
    ];

    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }

    $sql = "UPDATE raid_signups SET " . implode(', ', $updates) . " WHERE raid_id = :raid_id AND bnet_user_id = :uid";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    // Withdraw from a raid
    $raidId = isset($_GET['raid_id']) ? (int)$_GET['raid_id'] : 0;

    if (!$raidId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing raid_id']);
        exit;
    }

    $stmt = $db->prepare("DELETE FROM raid_signups WHERE raid_id = :raid_id AND bnet_user_id = :uid");
    $stmt->execute([':raid_id' => $raidId, ':uid' => (int)$user['id']]);

    // Check if raid should reopen (was full, now has space)
    $stmt = $db->prepare("SELECT max_players, status FROM raids WHERE id = :id");
    $stmt->execute([':id' => $raidId]);
    $raid = $stmt->fetch();

    if ($raid && $raid['status'] === 'full') {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM raid_signups WHERE raid_id = :id AND status != 'declined'");
        $stmt->execute([':id' => $raidId]);
        $result = $stmt->fetch();

        if ((int)$result['count'] < (int)$raid['max_players']) {
            $stmt = $db->prepare("UPDATE raids SET status = 'open' WHERE id = :id");
            $stmt->execute([':id' => $raidId]);
        }
    }

    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

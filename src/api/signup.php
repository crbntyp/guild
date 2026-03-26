<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = verifyBnetToken();

/**
 * Determine if a signup should be a reserve based on current roster state
 */
function shouldBeReserve($db, $raidId, $role) {
    // Get raid limits
    $stmt = $db->prepare("SELECT max_players, max_tanks, max_healers, max_dps FROM raids WHERE id = :id");
    $stmt->execute([':id' => $raidId]);
    $raid = $stmt->fetch();
    if (!$raid) return false;

    // Count active (non-reserve, non-declined) signups
    $stmt = $db->prepare("
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN role = 'tank' THEN 1 ELSE 0 END) as tanks,
            SUM(CASE WHEN role = 'healer' THEN 1 ELSE 0 END) as healers,
            SUM(CASE WHEN role = 'dps' THEN 1 ELSE 0 END) as dps
        FROM raid_signups
        WHERE raid_id = :raid_id AND is_reserve = 0 AND status != 'declined'
    ");
    $stmt->execute([':raid_id' => $raidId]);
    $counts = $stmt->fetch();

    $total = (int)$counts['total'];
    $roleCounts = [
        'tank' => (int)$counts['tanks'],
        'healer' => (int)$counts['healers'],
        'dps' => (int)$counts['dps']
    ];
    $roleLimits = [
        'tank' => (int)$raid['max_tanks'],
        'healer' => (int)$raid['max_healers'],
        'dps' => (int)$raid['max_dps']
    ];

    // Reserve if raid is full OR role slots are full
    if ($total >= (int)$raid['max_players']) return true;
    if ($roleCounts[$role] >= $roleLimits[$role]) return true;

    return false;
}

/**
 * Try to promote the first reserve of a given role to active
 */
function promoteReserve($db, $raidId, $role) {
    // Find earliest reserve with matching role
    $stmt = $db->prepare("
        SELECT id FROM raid_signups
        WHERE raid_id = :raid_id AND role = :role AND is_reserve = 1 AND status != 'declined'
        ORDER BY signed_up_at ASC
        LIMIT 1
    ");
    $stmt->execute([':raid_id' => $raidId, ':role' => $role]);
    $reserve = $stmt->fetch();

    if ($reserve) {
        $stmt = $db->prepare("UPDATE raid_signups SET is_reserve = 0 WHERE id = :id");
        $stmt->execute([':id' => $reserve['id']]);
        return true;
    }
    return false;
}

if ($method === 'POST') {
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
    $role = $data['role'];

    // Check raid exists and is not cancelled/completed
    $stmt = $db->prepare("SELECT * FROM raids WHERE id = :id");
    $stmt->execute([':id' => $raidId]);
    $raid = $stmt->fetch();

    if (!$raid) {
        http_response_code(404);
        echo json_encode(['error' => 'Raid not found']);
        exit;
    }

    if (in_array($raid['status'], ['cancelled', 'completed'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Raid is not accepting signups']);
        exit;
    }

    // Determine if this should be a reserve
    // First check if user already has a signup (update case)
    $stmt = $db->prepare("SELECT id, is_reserve FROM raid_signups WHERE raid_id = :raid_id AND bnet_user_id = :uid");
    $stmt->execute([':raid_id' => $raidId, ':uid' => (int)$user['id']]);
    $existing = $stmt->fetch();

    $isReserve = $existing ? (int)$existing['is_reserve'] : (shouldBeReserve($db, $raidId, $role) ? 1 : 0);

    // Insert or update signup
    $stmt = $db->prepare("
        INSERT INTO raid_signups (raid_id, battletag, bnet_user_id, character_name, character_realm, character_class_id, character_spec, character_level, character_ilvl, role, status, is_reserve, note)
        VALUES (:raid_id, :battletag, :bnet_user_id, :character_name, :character_realm, :character_class_id, :character_spec, :character_level, :character_ilvl, :role, :status, :is_reserve, :note)
        ON DUPLICATE KEY UPDATE
            character_name = VALUES(character_name),
            character_realm = VALUES(character_realm),
            character_class_id = VALUES(character_class_id),
            character_spec = VALUES(character_spec),
            character_level = VALUES(character_level),
            character_ilvl = VALUES(character_ilvl),
            role = VALUES(role),
            status = VALUES(status),
            is_reserve = VALUES(is_reserve),
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
        ':role' => $role,
        ':status' => $data['status'] ?? 'confirmed',
        ':is_reserve' => $isReserve,
        ':note' => $data['note'] ?? null
    ]);

    // Update raid status
    $stmt = $db->prepare("
        SELECT COUNT(*) as count FROM raid_signups
        WHERE raid_id = :raid_id AND is_reserve = 0 AND status != 'declined'
    ");
    $stmt->execute([':raid_id' => $raidId]);
    $result = $stmt->fetch();

    if ((int)$result['count'] >= (int)$raid['max_players']) {
        $db->prepare("UPDATE raids SET status = 'full' WHERE id = :id")->execute([':id' => $raidId]);
    } else {
        $db->prepare("UPDATE raids SET status = 'open' WHERE id = :id AND status = 'full'")->execute([':id' => $raidId]);
    }

    echo json_encode(['success' => true, 'is_reserve' => (bool)$isReserve]);

} elseif ($method === 'PUT') {
    $data = getRequestBody();
    $raidId = (int)($data['raid_id'] ?? 0);

    if (!$raidId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing raid_id']);
        exit;
    }

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
    $raidId = isset($_GET['raid_id']) ? (int)$_GET['raid_id'] : 0;

    if (!$raidId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing raid_id']);
        exit;
    }

    // Get the withdrawing player's role before deleting
    $stmt = $db->prepare("SELECT role, is_reserve FROM raid_signups WHERE raid_id = :raid_id AND bnet_user_id = :uid");
    $stmt->execute([':raid_id' => $raidId, ':uid' => (int)$user['id']]);
    $withdrawing = $stmt->fetch();

    if (!$withdrawing) {
        echo json_encode(['success' => true]);
        exit;
    }

    // Delete the signup
    $stmt = $db->prepare("DELETE FROM raid_signups WHERE raid_id = :raid_id AND bnet_user_id = :uid");
    $stmt->execute([':raid_id' => $raidId, ':uid' => (int)$user['id']]);

    // If they were NOT a reserve, try to promote a reserve of the same role
    if (!(int)$withdrawing['is_reserve']) {
        promoteReserve($db, $raidId, $withdrawing['role']);
    }

    // Update raid status
    $stmt = $db->prepare("SELECT max_players FROM raids WHERE id = :id");
    $stmt->execute([':id' => $raidId]);
    $raid = $stmt->fetch();

    if ($raid) {
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM raid_signups WHERE raid_id = :id AND is_reserve = 0 AND status != 'declined'");
        $stmt->execute([':id' => $raidId]);
        $result = $stmt->fetch();

        if ((int)$result['count'] < (int)$raid['max_players']) {
            $db->prepare("UPDATE raids SET status = 'open' WHERE id = :id AND status = 'full'")->execute([':id' => $raidId]);
        }
    }

    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

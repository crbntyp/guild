<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get snapshots for a user's current reset week
    $user = verifyBnetToken();
    $userId = (int)$user['id'];

    // Calculate current reset week (Wednesday 05:00 UTC for EU)
    $now = new DateTime('now', new DateTimeZone('UTC'));
    $resetDate = clone $now;
    $resetDate->setTime(5, 0, 0);
    // If today is before Wednesday 05:00, go back to last Wednesday
    if ($now->format('N') < 3 || ($now->format('N') == 3 && (int)$now->format('H') < 5)) {
        $resetDate->modify('last wednesday');
    } elseif ($now->format('N') > 3) {
        $resetDate->modify('last wednesday');
    }
    // else it's Wednesday after 05:00, resetDate is today
    $resetWeek = $resetDate->format('Y-m-d');

    $stmt = $db->prepare("
        SELECT character_name, realm_slug, delve_count, dungeon_count, raid_boss_count
        FROM vault_snapshots
        WHERE bnet_user_id = :uid AND reset_week = :week AND character_name != '__reward_count'
    ");
    $stmt->execute([':uid' => $userId, ':week' => $resetWeek]);
    $snapshots = $stmt->fetchAll();

    // Get reward count
    $rcStmt = $db->prepare("
        SELECT delve_count FROM vault_snapshots
        WHERE bnet_user_id = :uid AND reset_week = :week AND character_name = '__reward_count'
    ");
    $rcStmt->execute([':uid' => $userId, ':week' => $resetWeek]);
    $rc = $rcStmt->fetch();

    echo json_encode([
        'reset_week' => $resetWeek,
        'snapshots' => $snapshots,
        'reward_count' => $rc ? (int)$rc['delve_count'] : null
    ]);

} elseif ($method === 'POST') {
    // Save/update snapshots for current characters
    $user = verifyBnetToken();
    $userId = (int)$user['id'];
    $data = getRequestBody();

    if (empty($data['characters'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing characters data']);
        exit;
    }

    // Calculate current reset week (Wednesday 05:00 UTC for EU)
    $now = new DateTime('now', new DateTimeZone('UTC'));
    $resetDate = clone $now;
    $resetDate->setTime(5, 0, 0);
    if ($now->format('N') < 3 || ($now->format('N') == 3 && (int)$now->format('H') < 5)) {
        $resetDate->modify('last wednesday');
    } elseif ($now->format('N') > 3) {
        $resetDate->modify('last wednesday');
    }
    $resetWeek = $resetDate->format('Y-m-d');

    $stmt = $db->prepare("
        INSERT IGNORE INTO vault_snapshots (bnet_user_id, character_name, realm_slug, delve_count, dungeon_count, raid_boss_count, reset_week)
        VALUES (:uid, :name, :realm, :delves, :dungeons, :raids, :week)
    ");

    foreach ($data['characters'] as $char) {
        $stmt->execute([
            ':uid' => $userId,
            ':name' => $char['name'],
            ':realm' => $char['realm'],
            ':delves' => (int)($char['delve_count'] ?? 0),
            ':dungeons' => (int)($char['dungeon_count'] ?? 0),
            ':raids' => (int)($char['raid_boss_count'] ?? 0),
            ':week' => $resetWeek
        ]);
    }

    // Store reward count if provided
    if (isset($data['reward_count'])) {
        $rcStmt = $db->prepare("
            INSERT INTO vault_snapshots (bnet_user_id, character_name, realm_slug, delve_count, dungeon_count, raid_boss_count, reset_week)
            VALUES (:uid, '__reward_count', '', :count, 0, 0, :week)
            ON DUPLICATE KEY UPDATE delve_count = VALUES(delve_count)
        ");
        $rcStmt->execute([':uid' => $userId, ':count' => (int)$data['reward_count'], ':week' => $resetWeek]);
    }

    echo json_encode(['success' => true, 'reset_week' => $resetWeek]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

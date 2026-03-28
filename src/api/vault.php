<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get snapshots for a user's current reset week
    $user = verifyBnetToken();
    $userId = (int)$user['id'];

    // Calculate current reset week (Monday for EU)
    $now = new DateTime('now', new DateTimeZone('UTC'));
    $dayOfWeek = (int)$now->format('N'); // 1=Mon, 7=Sun
    if ($dayOfWeek >= 1) {
        $resetDate = clone $now;
        $resetDate->modify('last monday');
        if ($dayOfWeek === 1 && $now->format('H') < 7) {
            $resetDate->modify('-7 days');
        }
    }
    $resetWeek = $resetDate->format('Y-m-d');

    $stmt = $db->prepare("
        SELECT character_name, realm_slug, delve_count, dungeon_count, raid_boss_count
        FROM vault_snapshots
        WHERE bnet_user_id = :uid AND reset_week = :week
    ");
    $stmt->execute([':uid' => $userId, ':week' => $resetWeek]);
    $snapshots = $stmt->fetchAll();

    echo json_encode([
        'reset_week' => $resetWeek,
        'snapshots' => $snapshots
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

    // Calculate current reset week
    $now = new DateTime('now', new DateTimeZone('UTC'));
    $dayOfWeek = (int)$now->format('N');
    $resetDate = clone $now;
    $resetDate->modify('last monday');
    if ($dayOfWeek === 1 && $now->format('H') < 7) {
        $resetDate->modify('-7 days');
    }
    $resetWeek = $resetDate->format('Y-m-d');

    $stmt = $db->prepare("
        INSERT INTO vault_snapshots (bnet_user_id, character_name, realm_slug, delve_count, dungeon_count, raid_boss_count, reset_week)
        VALUES (:uid, :name, :realm, :delves, :dungeons, :raids, :week)
        ON DUPLICATE KEY UPDATE
            delve_count = VALUES(delve_count),
            dungeon_count = VALUES(dungeon_count),
            raid_boss_count = VALUES(raid_boss_count)
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

    echo json_encode(['success' => true, 'reset_week' => $resetWeek]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

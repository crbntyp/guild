<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$MAX_CHANNELS = 20;

if ($method === 'GET') {
    $user = verifyBnetToken();
    $userId = (int)$user['id'];

    // Get channels
    $stmt = $db->prepare("SELECT id, name, url, tags, created_at as createdAt FROM youtube_channels WHERE bnet_user_id = :uid ORDER BY created_at DESC");
    $stmt->execute([':uid' => $userId]);
    $channels = $stmt->fetchAll();

    // Get videos for each channel (last 30 days only)
    $videoStmt = $db->prepare("
        SELECT video_id as id, title, thumbnail, url, published_at as publishedAt, added_at as addedAt
        FROM youtube_videos
        WHERE channel_id = :cid AND added_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY published_at DESC
    ");

    foreach ($channels as &$channel) {
        $videoStmt->execute([':cid' => $channel['id']]);
        $channel['videos'] = $videoStmt->fetchAll();
    }

    echo json_encode($channels);

} elseif ($method === 'POST') {
    $user = verifyBnetToken();
    $userId = (int)$user['id'];
    $data = getRequestBody();

    if (!isset($data['action'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing action']);
        exit;
    }

    if ($data['action'] === 'add') {
        // Check channel limit
        $countStmt = $db->prepare("SELECT COUNT(*) FROM youtube_channels WHERE bnet_user_id = :uid");
        $countStmt->execute([':uid' => $userId]);
        if ((int)$countStmt->fetchColumn() >= $MAX_CHANNELS) {
            http_response_code(400);
            echo json_encode(['error' => "Maximum of {$MAX_CHANNELS} channels allowed"]);
            exit;
        }

        $stmt = $db->prepare("INSERT INTO youtube_channels (bnet_user_id, name, url, tags) VALUES (:uid, :name, :url, :tags)");
        $stmt->execute([
            ':uid' => $userId,
            ':name' => $data['name'] ?? '',
            ':url' => $data['url'] ?? '',
            ':tags' => $data['tags'] ?? null
        ]);
        $id = $db->lastInsertId();
        echo json_encode(['success' => true, 'id' => (int)$id]);

    } elseif ($data['action'] === 'update') {
        $stmt = $db->prepare("UPDATE youtube_channels SET name = :name, url = :url, tags = :tags WHERE id = :id AND bnet_user_id = :uid");
        $stmt->execute([
            ':id' => (int)$data['id'],
            ':uid' => $userId,
            ':name' => $data['name'] ?? '',
            ':url' => $data['url'] ?? '',
            ':tags' => $data['tags'] ?? null
        ]);
        echo json_encode(['success' => true]);

    } elseif ($data['action'] === 'delete') {
        // Videos cascade-deleted automatically
        $stmt = $db->prepare("DELETE FROM youtube_channels WHERE id = :id AND bnet_user_id = :uid");
        $stmt->execute([':id' => (int)$data['id'], ':uid' => $userId]);
        echo json_encode(['success' => true]);

    } elseif ($data['action'] === 'save_videos') {
        // Save fetched videos for a channel
        $channelId = (int)($data['channel_id'] ?? 0);
        $videos = $data['videos'] ?? [];

        // Verify channel belongs to user
        $checkStmt = $db->prepare("SELECT id FROM youtube_channels WHERE id = :cid AND bnet_user_id = :uid");
        $checkStmt->execute([':cid' => $channelId, ':uid' => $userId]);
        if (!$checkStmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Channel not found']);
            exit;
        }

        // Clean old videos (30 days)
        $db->prepare("DELETE FROM youtube_videos WHERE channel_id = :cid AND added_at < DATE_SUB(NOW(), INTERVAL 30 DAY)")
           ->execute([':cid' => $channelId]);

        // Insert new videos (ignore duplicates)
        $insertStmt = $db->prepare("
            INSERT IGNORE INTO youtube_videos (channel_id, video_id, title, thumbnail, url, published_at)
            VALUES (:cid, :vid, :title, :thumb, :url, :pub)
        ");

        foreach ($videos as $v) {
            $insertStmt->execute([
                ':cid' => $channelId,
                ':vid' => $v['id'] ?? '',
                ':title' => $v['title'] ?? '',
                ':thumb' => $v['thumbnail'] ?? '',
                ':url' => $v['url'] ?? '',
                ':pub' => isset($v['publishedAt']) ? date('Y-m-d H:i:s', strtotime($v['publishedAt'])) : null
            ]);
        }

        echo json_encode(['success' => true]);

    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

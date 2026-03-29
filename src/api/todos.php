<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user = verifyBnetToken();
    $userId = (int)$user['id'];

    // Auto-cleanup: delete todos older than 90 days
    $db->prepare("DELETE FROM todos WHERE bnet_user_id = :uid AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)")
       ->execute([':uid' => $userId]);

    $stmt = $db->prepare("SELECT id, title, description, url, image, created_at as createdAt FROM todos WHERE bnet_user_id = :uid ORDER BY created_at DESC");
    $stmt->execute([':uid' => $userId]);
    echo json_encode($stmt->fetchAll());

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
        $stmt = $db->prepare("INSERT INTO todos (bnet_user_id, title, description, url, image) VALUES (:uid, :title, :desc, :url, :image)");
        $stmt->execute([
            ':uid' => $userId,
            ':title' => $data['title'] ?? '',
            ':desc' => $data['description'] ?? '',
            ':url' => $data['url'] ?? null,
            ':image' => $data['image'] ?? null
        ]);
        $id = $db->lastInsertId();
        echo json_encode(['success' => true, 'id' => (int)$id]);

    } elseif ($data['action'] === 'update') {
        $stmt = $db->prepare("UPDATE todos SET title = :title, description = :desc, url = :url, image = :image WHERE id = :id AND bnet_user_id = :uid");
        $stmt->execute([
            ':id' => (int)$data['id'],
            ':uid' => $userId,
            ':title' => $data['title'] ?? '',
            ':desc' => $data['description'] ?? '',
            ':url' => $data['url'] ?? null,
            ':image' => $data['image'] ?? null
        ]);
        echo json_encode(['success' => true]);

    } elseif ($data['action'] === 'delete') {
        $stmt = $db->prepare("DELETE FROM todos WHERE id = :id AND bnet_user_id = :uid");
        $stmt->execute([':id' => (int)$data['id'], ':uid' => $userId]);
        echo json_encode(['success' => true]);

    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

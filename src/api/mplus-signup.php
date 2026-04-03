<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = verifyBnetToken();

if ($method === 'POST') {
    $data = getRequestBody();

    $required = ['session_id', 'character_name', 'character_realm', 'character_class_id', 'role'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }

    $sessionId = (int)$data['session_id'];

    // Check session exists and is open
    $stmt = $db->prepare("SELECT * FROM mplus_sessions WHERE id = :id");
    $stmt->execute([':id' => $sessionId]);
    $session = $stmt->fetch();

    if (!$session) {
        http_response_code(404);
        echo json_encode(['error' => 'Session not found']);
        exit;
    }

    if (!in_array($session['status'], ['open'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Session is not accepting signups']);
        exit;
    }

    // Insert or update signup
    $stmt = $db->prepare("
        INSERT INTO mplus_signups (session_id, battletag, bnet_user_id, character_name, character_realm, character_class_id, character_spec, character_level, character_ilvl, mplus_rating, role, status, note)
        VALUES (:session_id, :battletag, :bnet_user_id, :character_name, :character_realm, :character_class_id, :character_spec, :character_level, :character_ilvl, :mplus_rating, :role, :status, :note)
        ON DUPLICATE KEY UPDATE
            character_name = VALUES(character_name),
            character_realm = VALUES(character_realm),
            character_class_id = VALUES(character_class_id),
            character_spec = VALUES(character_spec),
            character_level = VALUES(character_level),
            character_ilvl = VALUES(character_ilvl),
            mplus_rating = VALUES(mplus_rating),
            role = VALUES(role),
            status = VALUES(status),
            note = VALUES(note),
            updated_at = CURRENT_TIMESTAMP
    ");

    $stmt->execute([
        ':session_id' => $sessionId,
        ':battletag' => $user['battletag'],
        ':bnet_user_id' => (int)$user['id'],
        ':character_name' => $data['character_name'],
        ':character_realm' => $data['character_realm'],
        ':character_class_id' => (int)$data['character_class_id'],
        ':character_spec' => $data['character_spec'] ?? null,
        ':character_level' => (int)($data['character_level'] ?? 80),
        ':character_ilvl' => (int)($data['character_ilvl'] ?? 0),
        ':mplus_rating' => (int)($data['mplus_rating'] ?? 0),
        ':role' => $data['role'],
        ':status' => $data['status'] ?? 'confirmed',
        ':note' => $data['note'] ?? null
    ]);

    // Notify Discord
    notifyDiscord([
        'event' => 'mplus_signup',
        'session_id' => $sessionId,
        'character_name' => $data['character_name'],
        'role' => $data['role']
    ]);

    echo json_encode(['success' => true]);

} elseif ($method === 'PUT') {
    $data = getRequestBody();
    $sessionId = (int)($data['session_id'] ?? 0);

    if (!$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing session_id']);
        exit;
    }

    $stmt = $db->prepare("SELECT id FROM mplus_signups WHERE session_id = :session_id AND bnet_user_id = :uid");
    $stmt->execute([':session_id' => $sessionId, ':uid' => (int)$user['id']]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Signup not found']);
        exit;
    }

    $updates = [];
    $params = [':session_id' => $sessionId, ':uid' => (int)$user['id']];

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

    $sql = "UPDATE mplus_signups SET " . implode(', ', $updates) . " WHERE session_id = :session_id AND bnet_user_id = :uid";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true]);

} elseif ($method === 'DELETE') {
    $sessionId = isset($_GET['session_id']) ? (int)$_GET['session_id'] : 0;

    if (!$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing session_id']);
        exit;
    }

    // Get character name before deleting
    $stmt = $db->prepare("SELECT character_name, role FROM mplus_signups WHERE session_id = :session_id AND bnet_user_id = :uid");
    $stmt->execute([':session_id' => $sessionId, ':uid' => (int)$user['id']]);
    $withdrawing = $stmt->fetch();

    $stmt = $db->prepare("DELETE FROM mplus_signups WHERE session_id = :session_id AND bnet_user_id = :uid");
    $stmt->execute([':session_id' => $sessionId, ':uid' => (int)$user['id']]);

    if ($withdrawing) {
        notifyDiscord([
            'event' => 'mplus_withdraw',
            'session_id' => $sessionId,
            'character_name' => $withdrawing['character_name'],
            'role' => $withdrawing['role']
        ]);
    }

    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

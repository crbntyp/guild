<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$user = verifyBnetToken();
$data = getRequestBody();

$sessionId = (int)($data['session_id'] ?? 0);
$token = $data['token'] ?? '';

if (!$sessionId || !$token) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing session_id or token']);
    exit;
}

// Verify token matches
$stmt = $db->prepare("SELECT id, claim_token, owner_bnet_id FROM mplus_sessions WHERE id = :id");
$stmt->execute([':id' => $sessionId]);
$session = $stmt->fetch();

if (!$session) {
    http_response_code(404);
    echo json_encode(['error' => 'Session not found']);
    exit;
}

if ($session['claim_token'] !== $token) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid claim token']);
    exit;
}

// Already claimed by someone else
if ($session['owner_bnet_id'] && (int)$session['owner_bnet_id'] !== (int)$user['id']) {
    http_response_code(403);
    echo json_encode(['error' => 'Session already claimed by another user']);
    exit;
}

// Claim it — link BNet user ID to this session
$stmt = $db->prepare("UPDATE mplus_sessions SET owner_bnet_id = :bnet_id WHERE id = :id");
$stmt->execute([':bnet_id' => (int)$user['id'], ':id' => $sessionId]);

echo json_encode(['success' => true, 'session_id' => $sessionId]);

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

$discordId = $data['discord_id'] ?? '';
$linkToken = $data['token'] ?? '';

if (!$discordId || !$linkToken) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing discord_id or token']);
    exit;
}

// Verify the link token matches what we stored
$stmt = $db->prepare("SELECT discord_id FROM pending_discord_links WHERE discord_id = :did AND token = :token AND expires_at > NOW()");
$stmt->execute([':did' => $discordId, ':token' => $linkToken]);
$pending = $stmt->fetch();

if (!$pending) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid or expired link token']);
    exit;
}

// Create the permanent link
$stmt = $db->prepare("
    INSERT INTO discord_bnet_links (discord_id, bnet_user_id, battletag)
    VALUES (:did, :bnet_id, :battletag)
    ON DUPLICATE KEY UPDATE bnet_user_id = VALUES(bnet_user_id), battletag = VALUES(battletag)
");
$stmt->execute([
    ':did' => $discordId,
    ':bnet_id' => (int)$user['id'],
    ':battletag' => $user['battletag']
]);

// Clean up pending link
$stmt = $db->prepare("DELETE FROM pending_discord_links WHERE discord_id = :did");
$stmt->execute([':did' => $discordId]);

// Update ownership on any sessions created by this Discord user that don't have an owner yet
$stmt = $db->prepare("UPDATE mplus_sessions SET owner_bnet_id = :bnet_id WHERE created_by_discord_id = :did AND owner_bnet_id IS NULL");
$stmt->execute([':bnet_id' => (int)$user['id'], ':did' => $discordId]);

// Same for raids
$stmt = $db->prepare("UPDATE raids SET owner_bnet_id = :bnet_id WHERE created_by_discord_id = :did AND owner_bnet_id IS NULL");
$stmt->execute([':bnet_id' => (int)$user['id'], ':did' => $discordId]);

echo json_encode(['success' => true]);

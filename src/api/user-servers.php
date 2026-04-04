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

$user = verifyBnetToken();
$bnetId = (int)$user['id'];

// Get Discord ID linked to this BNet account
$stmt = $db->prepare("SELECT discord_id FROM discord_bnet_links WHERE bnet_user_id = :bnet_id");
$stmt->execute([':bnet_id' => $bnetId]);
$link = $stmt->fetch();

$servers = [];

if ($link) {
    $discordId = $link['discord_id'];

    // Get unique servers from sessions and raids created by this Discord user
    $stmt = $db->prepare("
        SELECT DISTINCT discord_guild_id, discord_guild_name
        FROM mplus_sessions
        WHERE created_by_discord_id = :did AND discord_guild_id IS NOT NULL
        UNION
        SELECT DISTINCT discord_guild_id, discord_guild_name
        FROM raids
        WHERE created_by_discord_id = :did2 AND discord_guild_id IS NOT NULL
    ");
    $stmt->execute([':did' => $discordId, ':did2' => $discordId]);
    $servers = $stmt->fetchAll();
}

// Also include servers where the user has signed up
$stmt = $db->prepare("
    SELECT DISTINCT s.discord_guild_id, s.discord_guild_name
    FROM mplus_sessions s
    JOIN mplus_signups su ON s.id = su.session_id
    WHERE su.bnet_user_id = :bnet_id AND s.discord_guild_id IS NOT NULL
    UNION
    SELECT DISTINCT r.discord_guild_id, r.discord_guild_name
    FROM raids r
    JOIN raid_signups rs ON r.id = rs.raid_id
    WHERE rs.bnet_user_id = :bnet_id2 AND r.discord_guild_id IS NOT NULL
");
$stmt->execute([':bnet_id' => $bnetId, ':bnet_id2' => $bnetId]);
$signupServers = $stmt->fetchAll();

// Also include any servers with settings (bot has been used there)
$stmt = $db->query("SELECT guild_id as discord_guild_id, COALESCE(guild_name, 'Unknown Server') as discord_guild_name FROM server_settings WHERE guild_id IS NOT NULL");
$settingsServers = $stmt->fetchAll();

// Merge and deduplicate
$merged = [];
foreach (array_merge($servers, $signupServers, $settingsServers) as $s) {
    if ($s['discord_guild_id']) {
        $merged[$s['discord_guild_id']] = [
            'guild_id' => $s['discord_guild_id'],
            'guild_name' => $s['discord_guild_name'] ?: 'Unknown Server'
        ];
    }
}

echo json_encode(['servers' => array_values($merged)]);

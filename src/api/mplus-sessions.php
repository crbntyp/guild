<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $past = isset($_GET['past']);
    $guildId = $_GET['guild'] ?? null;

    $guildFilter = '';
    $params = [];
    if ($guildId) {
        $guildFilter = 'AND s.discord_guild_id = :guild_id';
        $params[':guild_id'] = $guildId;
    }

    if ($past) {
        $stmt = $db->prepare("
            SELECT s.*,
                   COUNT(su.id) as signup_count,
                   SUM(CASE WHEN su.role = 'tank' THEN 1 ELSE 0 END) as tank_count,
                   SUM(CASE WHEN su.role = 'healer' THEN 1 ELSE 0 END) as healer_count,
                   SUM(CASE WHEN su.role = 'dps' THEN 1 ELSE 0 END) as dps_count
            FROM mplus_sessions s
            LEFT JOIN mplus_signups su ON s.id = su.session_id
            WHERE s.status IN ('completed', 'cancelled') $guildFilter
            GROUP BY s.id
            ORDER BY s.session_date DESC
            LIMIT 20
        ");
        $stmt->execute($params);
    } else {
        $stmt = $db->prepare("
            SELECT s.*,
                   COUNT(su.id) as signup_count,
                   SUM(CASE WHEN su.role = 'tank' THEN 1 ELSE 0 END) as tank_count,
                   SUM(CASE WHEN su.role = 'healer' THEN 1 ELSE 0 END) as healer_count,
                   SUM(CASE WHEN su.role = 'dps' THEN 1 ELSE 0 END) as dps_count
            FROM mplus_sessions s
            LEFT JOIN mplus_signups su ON s.id = su.session_id
            WHERE s.status IN ('open', 'closed') $guildFilter
            GROUP BY s.id
            ORDER BY s.session_date ASC
        ");
        $stmt->execute($params);
    }

    $sessions = $stmt->fetchAll();

    foreach ($sessions as &$session) {
        $session['id'] = (int)$session['id'];
        $session['signup_count'] = (int)$session['signup_count'];
        $session['tank_count'] = (int)$session['tank_count'];
        $session['healer_count'] = (int)$session['healer_count'];
        $session['dps_count'] = (int)$session['dps_count'];
    }

    echo json_encode(['sessions' => $sessions]);

} elseif ($method === 'POST') {
    $user = verifyBnetToken();
    $data = getRequestBody();

    $required = ['title', 'session_date'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }

    $stmt = $db->prepare("
        INSERT INTO mplus_sessions (title, description, session_date, created_by_battletag)
        VALUES (:title, :description, :session_date, :battletag)
    ");

    $stmt->execute([
        ':title' => $data['title'],
        ':description' => $data['description'] ?? null,
        ':session_date' => $data['session_date'],
        ':battletag' => $user['battletag']
    ]);

    $sessionId = (int)$db->lastInsertId();
    echo json_encode(['success' => true, 'session_id' => $sessionId]);

} elseif ($method === 'DELETE') {
    $user = verifyBnetToken();
    $adminTags = ['crbntyp#2543'];

    if (!in_array($user['battletag'], $adminTags)) {
        http_response_code(403);
        echo json_encode(['error' => 'Not authorized']);
        exit;
    }

    $sessionId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if (!$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing session id']);
        exit;
    }

    $stmt = $db->prepare("DELETE FROM mplus_sessions WHERE id = :id");
    $stmt->execute([':id' => $sessionId]);

    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

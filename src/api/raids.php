<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // List raids with signup counts
    $status = $_GET['status'] ?? 'open';
    $past = isset($_GET['past']);
    $guildId = $_GET['guild'] ?? null;

    $guildFilter = '';
    $params = [];
    if ($guildId) {
        $guildFilter = 'AND r.discord_guild_id = :guild_id';
        $params[':guild_id'] = $guildId;
    }

    if ($past) {
        $stmt = $db->prepare("
            SELECT r.*,
                   SUM(CASE WHEN s.is_reserve = 0 AND s.status != 'declined' THEN 1 ELSE 0 END) as signup_count,
                   SUM(CASE WHEN s.role = 'tank' AND s.is_reserve = 0 AND s.status != 'declined' THEN 1 ELSE 0 END) as tank_count,
                   SUM(CASE WHEN s.role = 'healer' AND s.is_reserve = 0 AND s.status != 'declined' THEN 1 ELSE 0 END) as healer_count,
                   SUM(CASE WHEN s.role = 'dps' AND s.is_reserve = 0 AND s.status != 'declined' THEN 1 ELSE 0 END) as dps_count,
                   SUM(CASE WHEN s.is_reserve = 1 AND s.status != 'declined' THEN 1 ELSE 0 END) as reserve_count
            FROM raids r
            LEFT JOIN raid_signups s ON r.id = s.raid_id
            WHERE r.status IN ('completed', 'cancelled') $guildFilter
            GROUP BY r.id
            ORDER BY r.raid_date DESC
            LIMIT 20
        ");
        $stmt->execute($params);
    } else {
        $stmt = $db->prepare("
            SELECT r.*,
                   SUM(CASE WHEN s.is_reserve = 0 AND s.status != 'declined' THEN 1 ELSE 0 END) as signup_count,
                   SUM(CASE WHEN s.role = 'tank' AND s.is_reserve = 0 AND s.status != 'declined' THEN 1 ELSE 0 END) as tank_count,
                   SUM(CASE WHEN s.role = 'healer' AND s.is_reserve = 0 AND s.status != 'declined' THEN 1 ELSE 0 END) as healer_count,
                   SUM(CASE WHEN s.role = 'dps' AND s.is_reserve = 0 AND s.status != 'declined' THEN 1 ELSE 0 END) as dps_count,
                   SUM(CASE WHEN s.is_reserve = 1 AND s.status != 'declined' THEN 1 ELSE 0 END) as reserve_count
            FROM raids r
            LEFT JOIN raid_signups s ON r.id = s.raid_id
            WHERE r.status IN ('open', 'full') $guildFilter
            GROUP BY r.id
            ORDER BY r.raid_date ASC
        ");
        $stmt->execute($params);
    }

    $raids = $stmt->fetchAll();

    // Cast numeric fields
    foreach ($raids as &$raid) {
        $raid['id'] = (int)$raid['id'];
        $raid['max_players'] = (int)$raid['max_players'];
        $raid['max_tanks'] = (int)$raid['max_tanks'];
        $raid['max_healers'] = (int)$raid['max_healers'];
        $raid['max_dps'] = (int)$raid['max_dps'];
        $raid['signup_count'] = (int)$raid['signup_count'];
        $raid['tank_count'] = (int)$raid['tank_count'];
        $raid['healer_count'] = (int)$raid['healer_count'];
        $raid['dps_count'] = (int)$raid['dps_count'];
        $raid['reserve_count'] = (int)$raid['reserve_count'];
    }

    echo json_encode(['raids' => $raids]);

} elseif ($method === 'POST') {
    // Create a raid (auth required)
    $user = verifyBnetToken();
    $data = getRequestBody();

    $required = ['title', 'raid_date'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }

    $stmt = $db->prepare("
        INSERT INTO raids (title, description, raid_date, max_players, max_tanks, max_healers, max_dps, difficulty, created_by_battletag)
        VALUES (:title, :description, :raid_date, :max_players, :max_tanks, :max_healers, :max_dps, :difficulty, :battletag)
    ");

    $stmt->execute([
        ':title' => $data['title'],
        ':description' => $data['description'] ?? null,
        ':raid_date' => $data['raid_date'],
        ':max_players' => $data['max_players'] ?? 20,
        ':max_tanks' => $data['max_tanks'] ?? 2,
        ':max_healers' => $data['max_healers'] ?? 4,
        ':max_dps' => $data['max_dps'] ?? 14,
        ':difficulty' => $data['difficulty'] ?? 'heroic',
        ':battletag' => $user['battletag']
    ]);

    $raidId = (int)$db->lastInsertId();

    echo json_encode(['success' => true, 'raid_id' => $raidId]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // List raids with signup counts
    $status = $_GET['status'] ?? 'open';
    $past = isset($_GET['past']);

    if ($past) {
        $stmt = $db->prepare("
            SELECT r.*,
                   COUNT(s.id) as signup_count,
                   SUM(CASE WHEN s.role = 'tank' AND s.status != 'declined' THEN 1 ELSE 0 END) as tank_count,
                   SUM(CASE WHEN s.role = 'healer' AND s.status != 'declined' THEN 1 ELSE 0 END) as healer_count,
                   SUM(CASE WHEN s.role = 'dps' AND s.status != 'declined' THEN 1 ELSE 0 END) as dps_count
            FROM raids r
            LEFT JOIN raid_signups s ON r.id = s.raid_id
            WHERE r.status IN ('completed', 'cancelled')
            GROUP BY r.id
            ORDER BY r.raid_date DESC
            LIMIT 20
        ");
        $stmt->execute();
    } else {
        $stmt = $db->prepare("
            SELECT r.*,
                   COUNT(s.id) as signup_count,
                   SUM(CASE WHEN s.role = 'tank' AND s.status != 'declined' THEN 1 ELSE 0 END) as tank_count,
                   SUM(CASE WHEN s.role = 'healer' AND s.status != 'declined' THEN 1 ELSE 0 END) as healer_count,
                   SUM(CASE WHEN s.role = 'dps' AND s.status != 'declined' THEN 1 ELSE 0 END) as dps_count
            FROM raids r
            LEFT JOIN raid_signups s ON r.id = s.raid_id
            WHERE r.status IN ('open', 'full')
            GROUP BY r.id
            ORDER BY r.raid_date ASC
        ");
        $stmt->execute();
    }

    $raids = $stmt->fetchAll();

    // Cast numeric fields
    foreach ($raids as &$raid) {
        $raid['id'] = (int)$raid['id'];
        $raid['max_players'] = (int)$raid['max_players'];
        $raid['min_tanks'] = (int)$raid['min_tanks'];
        $raid['min_healers'] = (int)$raid['min_healers'];
        $raid['min_dps'] = (int)$raid['min_dps'];
        $raid['signup_count'] = (int)$raid['signup_count'];
        $raid['tank_count'] = (int)$raid['tank_count'];
        $raid['healer_count'] = (int)$raid['healer_count'];
        $raid['dps_count'] = (int)$raid['dps_count'];
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
        INSERT INTO raids (title, description, raid_date, max_players, min_tanks, min_healers, min_dps, difficulty, created_by_battletag)
        VALUES (:title, :description, :raid_date, :max_players, :min_tanks, :min_healers, :min_dps, :difficulty, :battletag)
    ");

    $stmt->execute([
        ':title' => $data['title'],
        ':description' => $data['description'] ?? null,
        ':raid_date' => $data['raid_date'],
        ':max_players' => $data['max_players'] ?? 20,
        ':min_tanks' => $data['min_tanks'] ?? 2,
        ':min_healers' => $data['min_healers'] ?? 4,
        ':min_dps' => $data['min_dps'] ?? 14,
        ':difficulty' => $data['difficulty'] ?? 'heroic',
        ':battletag' => $user['battletag']
    ]);

    $raidId = (int)$db->lastInsertId();

    echo json_encode(['success' => true, 'raid_id' => $raidId]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

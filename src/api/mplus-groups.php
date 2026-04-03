<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = verifyBnetToken();

// Admin or session owner check
$adminTags = ['crbntyp#2543'];
$isAdmin = in_array($user['battletag'], $adminTags);

function isSessionOwner($db, $sessionId, $userId) {
    $stmt = $db->prepare("SELECT owner_bnet_id FROM mplus_sessions WHERE id = :id");
    $stmt->execute([':id' => $sessionId]);
    $session = $stmt->fetch();
    return $session && (int)$session['owner_bnet_id'] === (int)$userId;
}

if ($method === 'GET') {
    $sessionId = isset($_GET['session_id']) ? (int)$_GET['session_id'] : 0;
    if (!$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing session_id']);
        exit;
    }

    // Fetch groups with members
    $stmt = $db->prepare("
        SELECT g.id, g.team_name, g.group_index,
               gm.signup_id,
               s.character_name, s.character_realm, s.character_class_id,
               s.character_spec, s.character_ilvl, s.mplus_rating, s.role, s.battletag
        FROM mplus_groups g
        LEFT JOIN mplus_group_members gm ON g.id = gm.group_id
        LEFT JOIN mplus_signups s ON gm.signup_id = s.id
        WHERE g.session_id = :session_id
        ORDER BY g.group_index ASC, s.role ASC
    ");
    $stmt->execute([':session_id' => $sessionId]);
    $rows = $stmt->fetchAll();

    // Group by group ID
    $groups = [];
    foreach ($rows as $row) {
        $gid = (int)$row['id'];
        if (!isset($groups[$gid])) {
            $groups[$gid] = [
                'id' => $gid,
                'team_name' => $row['team_name'],
                'group_index' => (int)$row['group_index'],
                'members' => []
            ];
        }
        if ($row['signup_id']) {
            $groups[$gid]['members'][] = [
                'signup_id' => (int)$row['signup_id'],
                'character_name' => $row['character_name'],
                'character_realm' => $row['character_realm'],
                'character_class_id' => (int)$row['character_class_id'],
                'character_spec' => $row['character_spec'],
                'character_ilvl' => (int)$row['character_ilvl'],
                'mplus_rating' => (int)$row['mplus_rating'],
                'role' => $row['role'],
                'battletag' => $row['battletag']
            ];
        }
    }

    echo json_encode(['groups' => array_values($groups)]);

} elseif ($method === 'POST') {
    $data = getRequestBody();
    $sessionId = (int)($data['session_id'] ?? 0);

    if (!$isAdmin && !isSessionOwner($db, $sessionId, $user['id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Not authorized']);
        exit;
    }
    $groupsData = $data['groups'] ?? [];

    if (!$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing session_id']);
        exit;
    }

    // Transaction: delete existing groups and re-insert
    $db->beginTransaction();
    try {
        // Delete existing groups (cascade deletes members)
        $stmt = $db->prepare("DELETE FROM mplus_groups WHERE session_id = :session_id");
        $stmt->execute([':session_id' => $sessionId]);

        // Insert new groups
        $groupStmt = $db->prepare("
            INSERT INTO mplus_groups (session_id, team_name, group_index)
            VALUES (:session_id, :team_name, :group_index)
        ");
        $memberStmt = $db->prepare("
            INSERT INTO mplus_group_members (group_id, signup_id)
            VALUES (:group_id, :signup_id)
        ");

        foreach ($groupsData as $index => $group) {
            $groupStmt->execute([
                ':session_id' => $sessionId,
                ':team_name' => $group['team_name'] ?? "Group " . ($index + 1),
                ':group_index' => $index
            ]);
            $groupId = (int)$db->lastInsertId();

            foreach (($group['members'] ?? []) as $signupId) {
                $memberStmt->execute([
                    ':group_id' => $groupId,
                    ':signup_id' => (int)$signupId
                ]);
            }
        }

        $db->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save groups']);
    }

} elseif ($method === 'DELETE') {
    $sessionId = isset($_GET['session_id']) ? (int)$_GET['session_id'] : 0;

    if (!$isAdmin && !isSessionOwner($db, $sessionId, $user['id'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Not authorized']);
        exit;
    }
    if (!$sessionId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing session_id']);
        exit;
    }

    $stmt = $db->prepare("DELETE FROM mplus_groups WHERE session_id = :session_id");
    $stmt->execute([':session_id' => $sessionId]);

    echo json_encode(['success' => true]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

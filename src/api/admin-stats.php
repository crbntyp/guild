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

// Admin only
$user = verifyBnetToken();
$ADMIN_ID = 126947934;
if ((int)$user['id'] !== $ADMIN_ID) {
    http_response_code(403);
    echo json_encode(['error' => 'Not authorized']);
    exit;
}

// Total logins
$stmt = $db->query("SELECT COUNT(*) as total FROM login_log");
$totalLogins = (int)$stmt->fetch()['total'];

// Unique users
$stmt = $db->query("SELECT COUNT(DISTINCT bnet_user_id) as total FROM login_log");
$uniqueUsers = (int)$stmt->fetch()['total'];

// Recent logins (last 7 days)
$stmt = $db->query("SELECT COUNT(*) as total FROM login_log WHERE logged_in_at > DATE_SUB(NOW(), INTERVAL 7 DAY)");
$recentLogins = (int)$stmt->fetch()['total'];

echo json_encode([
    'total_logins' => $totalLogins,
    'unique_users' => $uniqueUsers,
    'recent_logins' => $recentLogins
]);

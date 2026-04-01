<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// BNet OAuth credentials
$envFile = __DIR__ . '/.env.php';
if (file_exists($envFile)) {
    require_once $envFile;
}
$clientId = defined('BNET_CLIENT_ID') ? BNET_CLIENT_ID : '';
$clientSecret = defined('BNET_CLIENT_SECRET') ? BNET_CLIENT_SECRET : '';

if (empty($clientId) || empty($clientSecret)) {
    http_response_code(500);
    echo json_encode(['error' => 'OAuth credentials not configured']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$code = $input['code'] ?? '';
$redirectUri = $input['redirectUri'] ?? '';

if (empty($code) || empty($redirectUri)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing code or redirectUri']);
    exit;
}

// Exchange code for token with Battle.net
$ch = curl_init('https://oauth.battle.net/token');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'grant_type' => 'authorization_code',
        'code' => $code,
        'redirect_uri' => $redirectUri,
        'client_id' => $clientId,
        'client_secret' => $clientSecret
    ]),
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
    CURLOPT_TIMEOUT => 10
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || !$response) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to exchange token with Battle.net']);
    exit;
}

$tokenData = json_decode($response, true);
if (!isset($tokenData['access_token'])) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid response from Battle.net']);
    exit;
}

// Log successful login
try {
    require_once __DIR__ . '/config.php';
    $token = $tokenData['access_token'];
    $userRes = file_get_contents('https://oauth.battle.net/userinfo', false, stream_context_create([
        'http' => ['header' => "Authorization: Bearer $token"]
    ]));
    if ($userRes) {
        $user = json_decode($userRes, true);
        $stmt = $db->prepare("INSERT INTO login_log (bnet_user_id, battletag) VALUES (:uid, :tag)");
        $stmt->execute([':uid' => $user['id'] ?? 0, ':tag' => $user['battletag'] ?? '']);
    }
} catch (Exception $e) {}

echo json_encode([
    'access_token' => $tokenData['access_token'],
    'expires_in' => $tokenData['expires_in'] ?? 86400
]);

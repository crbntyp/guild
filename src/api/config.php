<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $db = new PDO(
        'mysql:host=localhost;dbname=gld;charset=utf8mb4',
        'gld_user',
        'GldPass123!',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

function verifyBnetToken() {
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    }
    // Normalize header keys to lowercase
    $headers = array_change_key_case($headers, CASE_LOWER);
    $auth = $headers['authorization'] ?? '';

    if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Missing authorization']);
        exit;
    }

    $token = $matches[1];
    $ch = curl_init('https://oauth.battle.net/userinfo');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer $token"],
        CURLOPT_TIMEOUT => 10
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        exit;
    }

    $user = json_decode($response, true);
    if (!$user || !isset($user['battletag'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid user data']);
        exit;
    }

    return $user;
}

function getRequestBody() {
    return json_decode(file_get_contents('php://input'), true) ?: [];
}

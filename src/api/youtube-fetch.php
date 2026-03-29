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

// YouTube API key — stored in /var/www/crbntyp/gld/api/.env.php
$envFile = __DIR__ . '/.env.php';
if (file_exists($envFile)) {
    require_once $envFile;
}
$YOUTUBE_API_KEY = defined('YOUTUBE_API_KEY') ? YOUTUBE_API_KEY : '';

if (empty($YOUTUBE_API_KEY)) {
    http_response_code(500);
    echo json_encode(['error' => 'YouTube API key not configured']);
    exit;
}

$data = getRequestBody();
$channelUrl = $data['channelUrl'] ?? '';
$tags = $data['tags'] ?? '';

if (empty($channelUrl)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing channelUrl']);
    exit;
}

// Extract channel ID from URL
function extractChannelId($url) {
    $path = parse_url($url, PHP_URL_PATH);
    if (!$path) return null;

    if (strpos($path, '/@') !== false) {
        $parts = explode('/@', $path);
        return explode('/', $parts[1])[0];
    }
    if (strpos($path, '/c/') !== false) {
        $parts = explode('/c/', $path);
        return explode('/', $parts[1])[0];
    }
    if (strpos($path, '/channel/') !== false) {
        $parts = explode('/channel/', $path);
        return explode('/', $parts[1])[0];
    }
    if (strpos($path, '/user/') !== false) {
        $parts = explode('/user/', $path);
        return explode('/', $parts[1])[0];
    }
    return null;
}

$channelId = extractChannelId($channelUrl);
if (!$channelId) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid YouTube channel URL']);
    exit;
}

// Resolve handle to channel ID if needed
$actualChannelId = $channelId;
if (substr($channelId, 0, 2) !== 'UC') {
    $searchUrl = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=" . urlencode($channelId) . "&key={$YOUTUBE_API_KEY}&maxResults=1";
    $searchResult = json_decode(file_get_contents($searchUrl), true);
    if (!empty($searchResult['items'][0]['snippet']['channelId'])) {
        $actualChannelId = $searchResult['items'][0]['snippet']['channelId'];
    }
}

// Fetch videos
if (!empty(trim($tags))) {
    $searchQuery = implode(' ', array_map('trim', explode(',', $tags)));
    $videosUrl = "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId={$actualChannelId}&q=" . urlencode($searchQuery) . "&type=video&order=date&maxResults=10&key={$YOUTUBE_API_KEY}";
} else {
    $videosUrl = "https://www.googleapis.com/youtube/v3/search?part=snippet&channelId={$actualChannelId}&type=video&order=date&maxResults=10&key={$YOUTUBE_API_KEY}";
}

$response = file_get_contents($videosUrl);
if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to fetch YouTube videos']);
    exit;
}

$data = json_decode($response, true);
$videos = [];

foreach (($data['items'] ?? []) as $item) {
    $videoId = $item['id']['videoId'] ?? '';
    if (empty($videoId)) continue;

    $videos[] = [
        'id' => $videoId,
        'title' => $item['snippet']['title'] ?? '',
        'thumbnail' => $item['snippet']['thumbnails']['medium']['url'] ?? '',
        'url' => "https://www.youtube.com/watch?v={$videoId}",
        'publishedAt' => $item['snippet']['publishedAt'] ?? ''
    ];
}

echo json_encode($videos);

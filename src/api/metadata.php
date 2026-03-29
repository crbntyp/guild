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

$data = getRequestBody();
$url = $data['url'] ?? '';

if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing URL']);
    exit;
}

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
]);

$html = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || !$html) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to fetch URL']);
    exit;
}

// Extract Open Graph / meta tags
function getMetaTag($html, $property) {
    // Try property attribute (og:, twitter:)
    if (preg_match('/<meta[^>]*property=["\']' . preg_quote($property, '/') . '["\'][^>]*content=["\']([^"\']*)["\']/', $html, $m)) return $m[1];
    if (preg_match('/<meta[^>]*content=["\']([^"\']*)["\'][^>]*property=["\']' . preg_quote($property, '/') . '["\']/', $html, $m)) return $m[1];
    // Try name attribute
    if (preg_match('/<meta[^>]*name=["\']' . preg_quote($property, '/') . '["\'][^>]*content=["\']([^"\']*)["\']/', $html, $m)) return $m[1];
    if (preg_match('/<meta[^>]*content=["\']([^"\']*)["\'][^>]*name=["\']' . preg_quote($property, '/') . '["\']/', $html, $m)) return $m[1];
    return null;
}

// Title fallback
$title = getMetaTag($html, 'og:title') ?? getMetaTag($html, 'twitter:title');
if (!$title && preg_match('/<title[^>]*>([^<]*)<\/title>/i', $html, $m)) {
    $title = $m[1];
}

echo json_encode([
    'title' => $title ?? 'Untitled',
    'description' => getMetaTag($html, 'og:description') ?? getMetaTag($html, 'twitter:description') ?? getMetaTag($html, 'description') ?? '',
    'image' => getMetaTag($html, 'og:image') ?? getMetaTag($html, 'twitter:image'),
    'url' => $url
]);

<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once __DIR__ . '/config.php';

$user = verifyBnetToken();

$adminTags = ['crbntyp#2543'];
$isAdmin = in_array($user['battletag'], $adminTags);

echo json_encode(['isAdmin' => $isAdmin]);

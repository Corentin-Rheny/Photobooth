<?php
header('Content-Type: application/json; charset=utf-8');
$logFile = __DIR__ . '/posttest.log';
$raw = file_get_contents('php://input');
$entry = date('c') . "\n" .
  'METHOD=' . ($_SERVER['REQUEST_METHOD'] ?? '') . "\n" .
  'CONTENT_TYPE=' . ($_SERVER['CONTENT_TYPE'] ?? '') . "\n" .
  'RAW_LENGTH=' . strlen($raw) . "\n" .
  'POST=' . json_encode($_POST, JSON_UNESCAPED_UNICODE) . "\n" .
  "----\n";
file_put_contents($logFile, $entry, FILE_APPEND);
echo json_encode([
  'ok' => true,
  'method' => $_SERVER['REQUEST_METHOD'] ?? '',
  'contentType' => $_SERVER['CONTENT_TYPE'] ?? '',
  'rawLength' => strlen($raw),
  'post' => $_POST,
  'log' => 'api/posttest.log'
], JSON_UNESCAPED_UNICODE);

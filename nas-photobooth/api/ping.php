<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
  'ok' => true,
  'time' => date('c'),
  'method' => $_SERVER['REQUEST_METHOD'] ?? '',
  'php' => PHP_VERSION,
]);

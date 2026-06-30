<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json; charset=utf-8');

$photoDir = __DIR__ . '/../photos';
if (!is_dir($photoDir)) {
    mkdir($photoDir, 0755, true);
}

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Aucune photo reçue']);
    exit;
}

$mime = $_FILES['photo']['type'] ?? '';
$ext = 'jpg';
if ($mime === 'image/png') {
    $ext = 'png';
} elseif ($mime === 'image/jpeg' || $mime === 'image/jpg') {
    $ext = 'jpg';
}

$stamp = date('Ymd-His');
$rand = substr(bin2hex(random_bytes(4)), 0, 6);
$filename = 'GC-' . $stamp . '-' . $rand . '.' . $ext;
$target = $photoDir . '/' . $filename;

if (!move_uploaded_file($_FILES['photo']['tmp_name'], $target)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Impossible d’enregistrer la photo']);
    exit;
}

@chmod($target, 0644);
$url = PUBLIC_BASE_URL . '/photo.php?f=' . rawurlencode($filename);
echo json_encode(['ok' => true, 'filename' => $filename, 'url' => $url, 'size' => filesize($target), 'mime' => $mime]);

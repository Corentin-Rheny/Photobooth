<?php
require_once __DIR__ . '/config.php';
$f = isset($_GET['f']) ? basename($_GET['f']) : '';
$path = __DIR__ . '/photos/' . $f;
if ($f === '' || strpos($f, '..') !== false || !is_file($path)) {
  http_response_code(404);
  echo 'Photo introuvable';
  exit;
}
$photoUrl = 'photos/' . rawurlencode($f);
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Votre photo - Gabrielle & Corentin</title>
  <link rel="stylesheet" href="styles.css?v=nas-pro-01">
  <style>
    body{overflow:auto}.photo-page{min-height:100vh;display:grid;place-items:center;padding:28px;background:#FEF2EB;color:#E04043}.photo-card{width:min(920px,100%);text-align:center}.photo-card h1{font-family:var(--display);font-weight:400;font-size:clamp(58px,10vw,112px);line-height:.86;margin:0 0 18px}.photo-card p{color:#8a6258;font-size:20px}.photo-card img{width:100%;border-radius:28px;background:#000;box-shadow:0 24px 80px rgba(65,38,31,.22)}.download-button{display:inline-flex;align-items:center;justify-content:center;margin-top:24px;min-height:70px;border-radius:999px;background:#E04043;color:#FEF2EB;text-decoration:none;font-family:var(--display);font-size:42px;padding:14px 34px 20px}
  </style>
</head>
<body>
  <main class="photo-page">
    <section class="photo-card">
      <h1>Votre photo</h1>
      <p>Gabrielle & Corentin - 22.08.2026</p>
      <img src="<?php echo htmlspecialchars($photoUrl, ENT_QUOTES); ?>" alt="Votre photo">
      <a class="download-button" href="<?php echo htmlspecialchars($photoUrl, ENT_QUOTES); ?>" download>Télécharger</a>
    </section>
  </main>
</body>
</html>

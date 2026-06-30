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
  <link rel="stylesheet" href="styles.css?v=nas-pro-02">
  <style>
    body{overflow:auto}.photo-page{min-height:100vh;display:grid;place-items:center;padding:28px;background:#FEF2EB;color:#E04043}.photo-card{width:min(920px,100%);text-align:center}.photo-card h1{font-family:var(--display);font-weight:400;font-size:clamp(58px,10vw,112px);line-height:.86;margin:0 0 18px}.photo-card p{color:#8a6258;font-size:20px}.photo-card img{width:100%;border-radius:28px;background:#000;box-shadow:0 24px 80px rgba(65,38,31,.22)}.button-row{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-top:24px}.download-button,.gallery-button{display:inline-flex;align-items:center;justify-content:center;min-height:66px;border-radius:999px;text-decoration:none;font-family:var(--display);font-size:clamp(30px,5vw,42px);padding:12px 32px 18px}.download-button{background:#E04043;color:#FEF2EB}.gallery-button{background:transparent;color:#E04043;border:2px solid #E04043}.top-link{position:fixed;left:22px;top:18px;color:#E04043;text-decoration:none;font-family:var(--display);font-size:30px;z-index:2}@media(max-width:700px){.top-link{position:static;display:inline-block;margin-bottom:18px}.photo-page{display:block}.photo-card{margin:0 auto}.button-row{display:grid}}
  </style>
</head>
<body>
  <main class="photo-page">
    <section class="photo-card">
      <a class="top-link" href="gallery.php">← Galerie</a>
      <h1>Votre photo</h1>
      <p>Gabrielle & Corentin - 22.08.2026</p>
      <img src="<?php echo htmlspecialchars($photoUrl, ENT_QUOTES); ?>" alt="Votre photo">
      <div class="button-row">
        <a class="download-button" href="<?php echo htmlspecialchars($photoUrl, ENT_QUOTES); ?>" download>Télécharger</a>
        <a class="gallery-button" href="gallery.php">Retour galerie</a>
      </div>
    </section>
  </main>
</body>
</html>

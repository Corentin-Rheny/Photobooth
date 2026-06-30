<?php
require_once __DIR__ . '/config.php';
$dir = __DIR__ . '/photos';
$files = is_dir($dir) ? glob($dir . '/GC-*.png') : [];
rsort($files);
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Galerie Photobooth - Gabrielle & Corentin</title>
  <link rel="stylesheet" href="styles.css?v=nas-pro-01">
  <style>
    body{overflow:auto}.gallery-page{min-height:100vh;padding:34px;background:#FEF2EB;color:#E04043}.gallery-head{text-align:center;margin:20px auto 34px}.gallery-head h1{font-family:var(--display);font-weight:400;font-size:clamp(62px,10vw,126px);line-height:.84;margin:0}.gallery-head p{color:#8a6258;font-size:20px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px;max-width:1380px;margin:0 auto}.tile{display:block;background:#000;border-radius:20px;overflow:hidden;aspect-ratio:148/100}.tile img{width:100%;height:100%;object-fit:cover;display:block}.empty{text-align:center;color:#8a6258;font-size:22px;margin-top:70px}
  </style>
</head>
<body>
  <main class="gallery-page">
    <header class="gallery-head">
      <h1>Photobooth</h1>
      <p>Gabrielle & Corentin - 22.08.2026</p>
    </header>
    <?php if (!$files): ?>
      <p class="empty">Aucune photo pour le moment.</p>
    <?php else: ?>
      <section class="grid">
        <?php foreach ($files as $file): $name = basename($file); ?>
          <a class="tile" href="photo.php?f=<?php echo rawurlencode($name); ?>">
            <img loading="lazy" src="photos/<?php echo rawurlencode($name); ?>" alt="Photo photobooth">
          </a>
        <?php endforeach; ?>
      </section>
    <?php endif; ?>
  </main>
</body>
</html>

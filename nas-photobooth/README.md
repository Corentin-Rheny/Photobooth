# Version NAS du Photobooth

Cette version est prévue pour Synology Web Station avec PHP 8.0.

## Structure

```text
nas-photobooth/
  index.html
  styles.css
  app.js
  photo.php
  gallery.php
  api/upload.php
  photos/
```

## Installation

1. Copier le dossier `nas-photobooth` dans le dossier web du NAS.
2. Le renommer en `photobooth`.
3. Vérifier que PHP 8.0 est activé dans Web Station.
4. Vérifier que le dossier `photos` est accessible en écriture par Web Station.
5. Ouvrir : `https://gab-coco.synology.me/photobooth/`.

## Liens

- Photobooth : `https://gab-coco.synology.me/photobooth/`
- Galerie globale : `https://gab-coco.synology.me/photobooth/gallery.php`

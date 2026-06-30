# Photobooth professionnel - version Synology NAS

Cette version remplace la publication GitHub Pages pour le jour du mariage. Elle doit être hébergée directement dans Synology Web Station.

## Structure

```text
nas-photobooth/
  index.html        Interface photobooth iPad
  styles.css        Direction artistique Gabrielle & Corentin
  app.js            Capture camera, compte a rebours, upload, QR, impression
  photo.php         Page individuelle Votre photo
  gallery.php       Galerie globale de toutes les photos
  config.php        URL publique de base
  api/upload.php    Endpoint qui recoit les photos
  photos/           Dossier de stockage des photos
  assets/logo.svg   Icone provisoire
```

## Installation sur le NAS

1. Dans File Station, ouvrir le dossier Web Station, souvent `/web`.
2. Copier le dossier `nas-photobooth` dedans.
3. Renommer le dossier en `photobooth`.
4. Verifier que PHP 8.0 est disponible dans Web Station.
5. Verifier que le dossier `photobooth/photos` est modifiable par le serveur web.
6. Ouvrir : `https://gab-coco.synology.me/photobooth/`.

## Liens utiles

- Application photobooth : `https://gab-coco.synology.me/photobooth/`
- Galerie globale : `https://gab-coco.synology.me/photobooth/gallery.php`
- Test upload : `https://gab-coco.synology.me/photobooth/api/upload.php`

## Fonctionnement

1. L'iPad ouvre la web app depuis le NAS.
2. La camera externe HDMI/UVC est detectee par Safari.
3. Une photo est capturee apres le compte a rebours.
4. Le fichier final 148 x 100 mm est genere.
5. La photo est envoyee a `api/upload.php`.
6. Le NAS sauvegarde le fichier dans `photos/`.
7. La web app affiche un QR code pointant vers `photo.php?f=...`.
8. Le QR code global a coller sur la boite peut pointer vers `gallery.php`.

## Notes

Le QR code individuel utilise actuellement un service de generation de QR en ligne. Une version 100% locale pourra etre ajoutee ensuite pour fonctionner sans acces Internet.

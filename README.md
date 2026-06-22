# PhotoBooth iPad

Web app gratuite pour photobooth sur iPadOS 18, avec caméra externe via carte capture HDMI USB-C, montage 10x15 et impression AirPrint vers Canon SELPHY CP1500.

## Acces application

GitHub Pages :

https://corentin-rheny.github.io/Photobooth/

Repository :

https://github.com/Corentin-Rheny/Photobooth

## Fonctionnalites

- Camera iPad ou camera externe USB / HDMI capture UVC.
- Compte a rebours.
- Capture de 1 a 4 photos.
- Montage automatique 10x15 cm.
- Mode 2 bandes photobooth sur une feuille 10x15.
- Titre et bas de page personnalisables.
- Impression AirPrint vers Canon SELPHY CP1500.
- Partage et enregistrement du tirage.
- Sans abonnement et sans watermark.

## Cablage recommande

```text
Lumix S1
  -> HDMI
  -> carte capture HDMI vers USB-C compatible UVC
  -> hub USB-C Power Delivery
  -> iPad Air 2020

Canon SELPHY CP1500
  -> meme Wi-Fi que l'iPad
  -> AirPrint
```

## Installation sur iPad

1. Ouvrir https://corentin-rheny.github.io/Photobooth/ dans Safari.
2. Appuyer sur Partager.
3. Choisir Ajouter a l'ecran d'accueil.
4. Activer Ouvrir comme app web si propose.
5. Lancer PhotoBooth depuis l'ecran d'accueil.
6. Autoriser la camera.
7. Dans Reglages, choisir la camera USB/capture.

## Hebergement NAS

Les memes fichiers peuvent etre copies sur ton NAS dans le dossier partage `Webapp photobooth`. Le NAS doit servir le dossier comme un site web HTTP/HTTPS. Pour utiliser la camera sur iPad, HTTPS est fortement conseille.

# Photobooth Gabrielle & Corentin

Web app gratuite pour iPadOS 18, pensée pour le mariage Gabrielle & Corentin.

## Accès application

GitHub Pages :

https://corentin-rheny.github.io/Photobooth/

Repository :

https://github.com/Corentin-Rheny/Photobooth

## Fonctionnalités

- Interface graphique aux couleurs du document de présentation : fond crème `#FEF2EB` et rouge principal `#E04043`.
- Logo CG utilisé comme favicon et icône d'application.
- Accueil avec vue caméra en direct, recadrée en `object-fit: cover` et non étirée.
- Un seul bouton utilisateur : `Prendre une photo`.
- Compte à rebours fixe de 5 secondes.
- Une seule photo finale, sans mode bandes ni multi-photo.
- Mise en forme finale 10x15 cm / 4x6 pouces.
- AirPrint ouvre directement la fenêtre d'impression.
- Partage via l'API de partage iPadOS, avec AirDrop proposé par iPadOS lorsque disponible.
- Après impression ou partage, l'interface reste sur l'écran de résultat.
- Retour à l'accueil par le bouton `Continuer` ou après 30 secondes d'inactivité.
- Panneau réglages protégé par le code `22082026`.
- Stockage local automatique de chaque capture dans IndexedDB sur l'iPad.
- Zoom et dézoom désactivés au maximum possible côté web app.

## Câblage recommandé

```text
Lumix S1
  -> HDMI
  -> carte capture HDMI vers USB-C compatible UVC
  -> hub USB-C Power Delivery
  -> iPad Air 2020

Canon SELPHY CP1500
  -> même Wi-Fi que l'iPad
  -> AirPrint
```

## Installation sur iPad

1. Ouvrir https://corentin-rheny.github.io/Photobooth/ dans Safari.
2. Appuyer sur Partager.
3. Choisir Ajouter à l'écran d'accueil.
4. Activer Ouvrir comme app web si proposé.
5. Lancer PhotoBooth depuis l'écran d'accueil.
6. Autoriser la caméra au premier lancement.
7. Réglages -> code `22082026` -> choisir la caméra USB/capture si nécessaire.

## À propos des polices

Les CSS appellent les familles locales `Braven` et `Against` lorsqu'elles sont disponibles sur l'appareil. Les fichiers de police fournis ne sont pas publiés dans le repository public.

## Hébergement NAS

Les mêmes fichiers peuvent être copiés sur ton NAS dans le dossier partagé `Webapp photobooth`. Le NAS doit servir le dossier comme un site web HTTP/HTTPS. Pour utiliser la caméra sur iPad, HTTPS est fortement conseillé.

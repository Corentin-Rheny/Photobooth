# Installation iPad - Photobooth GC

## Lien de l'application

https://corentin-rheny.github.io/Photobooth/

## Installation sur iPadOS 18

1. Ouvrir le lien dans Safari.
2. Appuyer sur Partager.
3. Choisir Ajouter à l'écran d'accueil.
4. Activer Ouvrir comme app web si l'option est proposée.
5. Lancer PhotoBooth GC depuis l'écran d'accueil.
6. Autoriser la caméra au premier lancement.
7. Pour accéder aux réglages, toucher Réglages puis entrer le code `22082026`.

## Utilisation invité

1. L'invité appuie sur Prendre une photo.
2. Le compte à rebours de 5 secondes démarre.
3. Une seule photo est capturée.
4. L'écran de résultat propose AirPrint, Partager et Continuer.
5. Après impression ou partage, l'écran reste affiché.
6. Retour automatique à l'accueil après 30 secondes d'inactivité.

## Câblage caméra externe

```text
Lumix S1 -> HDMI -> carte capture HDMI USB-C UVC -> hub USB-C Power Delivery -> iPad
```

Réglages conseillés du Lumix S1 : HDMI 1080p, mode manuel, 1/100 ou 1/125, f/5.6, ISO 800 à 1600, balance des blancs fixe.

## Canon SELPHY CP1500

1. Connecter l'iPad et la SELPHY CP1500 au même Wi-Fi.
2. Dans PhotoBooth, faire une session test.
3. Appuyer sur AirPrint.
4. Choisir Canon SELPHY CP1500.
5. Choisir papier 10x15 / 4x6 si proposé.

## Stockage local

Chaque photo est stockée automatiquement dans l'IndexedDB de la web app sur l'iPad. Ce stockage ne demande normalement pas d'autorisation iOS supplémentaire. Il peut être effacé depuis le panneau de configuration.

## Hébergement NAS

Les fichiers du repository peuvent être copiés dans le dossier partagé `Webapp photobooth` de ton NAS. Pour la caméra sur iPad, utilise de préférence une URL HTTPS servie par le NAS.

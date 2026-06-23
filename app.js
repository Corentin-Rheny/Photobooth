(() => {
  'use strict';

  const CONFIG_CODE = '22082026';
  const COUNTDOWN_SECONDS = 5;
  const RESULT_IDLE_MS = 30000;
  const DB_NAME = 'gc-photobooth';
  const STORE_NAME = 'captures';
  const $ = (id) => document.getElementById(id);

  const els = {
    homeScreen: $('homeScreen'),
    countdownScreen: $('countdownScreen'),
    resultScreen: $('resultScreen'),
    liveVideo: $('liveVideo'),
    countVideo: $('countVideo'),
    cameraPlaceholder: $('cameraPlaceholder'),
    settingsButton: $('settingsButton'),
    takePhotoButton: $('takePhotoButton'),
    statusText: $('statusText'),
    countNumber: $('countNumber'),
    resultPreview: $('resultPreview'),
    printImage: $('printImage'),
    printButton: $('printButton'),
    shareButton: $('shareButton'),
    continueButton: $('continueButton'),
    resultStatus: $('resultStatus'),
    pinPanel: $('pinPanel'),
    pinInput: $('pinInput'),
    pinError: $('pinError'),
    validatePinButton: $('validatePinButton'),
    closePinButton: $('closePinButton'),
    settingsPanel: $('settingsPanel'),
    closeSettingsButton: $('closeSettingsButton'),
    cameraSelect: $('cameraSelect'),
    resolutionSelect: $('resolutionSelect'),
    mirrorSelect: $('mirrorSelect'),
    eventTitleInput: $('eventTitleInput'),
    eventDateInput: $('eventDateInput'),
    storageInfo: $('storageInfo'),
    refreshCamerasButton: $('refreshCamerasButton'),
    restartCameraButton: $('restartCameraButton'),
    clearStorageButton: $('clearStorageButton'),
    saveSettingsButton: $('saveSettingsButton')
  };

  let stream = null;
  let selectedDeviceId = '';
  let rawPhotoCanvas = null;
  let finalBlob = null;
  let finalUrl = '';
  let idleTimer = null;
  let busy = false;

  const defaultSettings = {
    resolution: '1920x1080',
    mirror: 'preview',
    title: 'Gabrielle & Corentin',
    date: '22 août 2026'
  };

  function setStatus(message) {
    els.statusText.textContent = message;
  }

  function setScreen(name) {
    [els.homeScreen, els.countdownScreen, els.resultScreen].forEach((screen) => {
      screen.classList.remove('is-active');
    });
    if (name === 'countdown') els.countdownScreen.classList.add('is-active');
    else if (name === 'result') els.resultScreen.classList.add('is-active');
    else els.homeScreen.classList.add('is-active');
  }

  function openModal(panel) {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
  }

  function closeModal(panel) {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
  }

  function loadSettings() {
    let settings = { ...defaultSettings };
    try {
      settings = { ...settings, ...JSON.parse(localStorage.getItem('gc-photobooth-settings') || '{}') };
    } catch (_) {}

    els.resolutionSelect.value = settings.resolution;
    els.mirrorSelect.value = settings.mirror;
    els.eventTitleInput.value = settings.title;
    els.eventDateInput.value = settings.date;
    applyVisualSettings();
  }

  function saveSettings() {
    const settings = {
      resolution: els.resolutionSelect.value,
      mirror: els.mirrorSelect.value,
      title: els.eventTitleInput.value,
      date: els.eventDateInput.value
    };
    localStorage.setItem('gc-photobooth-settings', JSON.stringify(settings));
    applyVisualSettings();
  }

  function applyVisualSettings() {
    const mirror = els.mirrorSelect.value;
    document.body.classList.toggle('mirror-preview', mirror === 'preview' || mirror === 'output');
  }

  function parseResolution() {
    const [width, height] = els.resolutionSelect.value.split('x').map(Number);
    return { width, height };
  }

  async function listCameras() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === 'videoinput');
    els.cameraSelect.innerHTML = '';

    cameras.forEach((camera, index) => {
      const option = document.createElement('option');
      option.value = camera.deviceId;
      const label = camera.label || `Caméra ${index + 1}`;
      option.textContent = /usb|capture|hdmi|uvc|elgato|cam link/i.test(label)
        ? `⭐ ${label} - caméra externe`
        : label;
      els.cameraSelect.appendChild(option);
    });

    if (selectedDeviceId && cameras.some((camera) => camera.deviceId === selectedDeviceId)) {
      els.cameraSelect.value = selectedDeviceId;
    } else {
      const external = cameras.find((camera) => /usb|capture|hdmi|uvc|elgato|cam link/i.test(camera.label || ''));
      if (external) els.cameraSelect.value = external.deviceId;
    }

    return cameras;
  }

  function attachStreamToVideos() {
    els.liveVideo.srcObject = stream;
    els.countVideo.srcObject = stream;
  }

  function stopCamera() {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
    attachStreamToVideos();
  }

  async function startCamera(deviceId = '') {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Caméra indisponible. Ouvre la page en HTTPS dans Safari.');
    }

    stopCamera();
    setStatus('Ouverture de la caméra...');

    const { width, height } = parseResolution();
    const videoConstraints = {
      width: { ideal: width },
      height: { ideal: height },
      frameRate: { ideal: 30, max: 30 }
    };

    if (deviceId) videoConstraints.deviceId = { exact: deviceId };
    else videoConstraints.facingMode = { ideal: 'environment' };

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints });
    } catch (error) {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: deviceId ? { deviceId: { exact: deviceId } } : true });
    }

    attachStreamToVideos();
    await els.liveVideo.play();
    await els.countVideo.play();

    const track = stream.getVideoTracks()[0];
    selectedDeviceId = track?.getSettings?.().deviceId || deviceId || '';
    localStorage.setItem('gc-camera-was-accepted', '1');
    els.cameraPlaceholder.classList.add('is-hidden');
    await listCameras();
    setStatus('Caméra prête');
  }

  async function ensureCamera() {
    const activeTrack = stream?.getVideoTracks?.()[0];
    if (activeTrack && activeTrack.readyState === 'live') return;
    await startCamera(els.cameraSelect.value || selectedDeviceId || '');
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function runCountdown() {
    setScreen('countdown');
    for (let i = COUNTDOWN_SECONDS; i >= 1; i -= 1) {
      els.countNumber.textContent = String(i);
      await sleep(1000);
    }
  }

  function captureFrame() {
    const video = els.liveVideo;
    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1080;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });

    if (els.mirrorSelect.value === 'output') {
      context.translate(width, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, 0, 0, width, height);
    return canvas;
  }

  function roundedRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }

  function drawImageCover(context, source, target) {
    const scale = Math.max(target.width / source.width, target.height / source.height);
    const cropWidth = target.width / scale;
    const cropHeight = target.height / scale;
    const cropX = (source.width - cropWidth) / 2;
    const cropY = (source.height - cropHeight) / 2;
    context.drawImage(source, cropX, cropY, cropWidth, cropHeight, target.x, target.y, target.width, target.height);
  }

  async function createFinalPrint(canvas) {
    const output = document.createElement('canvas');
    output.width = 1800;
    output.height = 1200;
    const context = output.getContext('2d', { alpha: false });

    context.fillStyle = '#FEF2EB';
    context.fillRect(0, 0, output.width, output.height);

    context.fillStyle = '#E04043';
    context.font = '400 78px Braven, Didot, Georgia, serif';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText(els.eventTitleInput.value.trim() || 'Gabrielle & Corentin', output.width / 2, 72);

    const photoRect = { x: 150, y: 190, width: 1500, height: 825 };
    context.fillStyle = '#050505';
    context.fillRect(photoRect.x - 18, photoRect.y - 18, photoRect.width + 36, photoRect.height + 36);
    drawImageCover(context, canvas, photoRect);

    context.fillStyle = '#E04043';
    context.font = '400 42px Against, Helvetica, Arial, sans-serif';
    context.fillText(els.eventDateInput.value.trim() || '22 août 2026', output.width / 2, 1048);

    context.font = '400 34px Braven, Didot, Georgia, serif';
    context.fillText('CG', 92, 1090);
    context.fillText('Gabrielle et Corentin', output.width / 2, 1120);

    return new Promise((resolve) => output.toBlob(resolve, 'image/png', 1));
  }

  function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.94) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveCaptureLocally(rawCanvas, printBlob) {
    const rawBlob = await canvasToBlob(rawCanvas);
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).add({
      createdAt: new Date().toISOString(),
      raw: rawBlob,
      print: printBlob
    });
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function clearLocalStorageHistory() {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).clear();
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  function showResultScreen(blob) {
    if (finalUrl) URL.revokeObjectURL(finalUrl);
    finalBlob = blob;
    finalUrl = URL.createObjectURL(blob);
    els.resultPreview.src = finalUrl;
    els.printImage.src = finalUrl;
    els.resultStatus.textContent = 'Photo enregistrée sur cet iPad. Retour automatique après 30 secondes.';
    setScreen('result');
    startResultIdleTimer();
  }

  function startResultIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => resetToHome(), RESULT_IDLE_MS);
  }

  function resetToHome() {
    clearTimeout(idleTimer);
    setScreen('home');
    setStatus('Prêt');
  }

  async function takePhoto() {
    if (busy) return;
    busy = true;
    els.takePhotoButton.disabled = true;

    try {
      await ensureCamera();
      await runCountdown();
      rawPhotoCanvas = captureFrame();
      const printBlob = await createFinalPrint(rawPhotoCanvas);
      await saveCaptureLocally(rawPhotoCanvas, printBlob);
      showResultScreen(printBlob);
    } catch (error) {
      console.error(error);
      setScreen('home');
      setStatus('Erreur caméra');
      alert(error.message || String(error));
    } finally {
      busy = false;
      els.takePhotoButton.disabled = false;
    }
  }

  function printPhoto() {
    if (!finalBlob) return;
    startResultIdleTimer();
    window.print();
  }

  async function sharePhoto() {
    if (!finalBlob) return;
    startResultIdleTimer();
    const file = new File([finalBlob], 'photobooth-gabrielle-corentin.png', { type: 'image/png' });

    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Photobooth Gabrielle & Corentin' });
      } else if (navigator.share) {
        await navigator.share({ title: 'Photobooth Gabrielle & Corentin', url: finalUrl });
      } else {
        window.open(finalUrl, '_blank');
      }
    } catch (error) {
      if (error.name !== 'AbortError') window.open(finalUrl, '_blank');
    }
  }

  function openPinPanel() {
    els.pinInput.value = '';
    els.pinError.textContent = '';
    openModal(els.pinPanel);
    setTimeout(() => els.pinInput.focus(), 80);
  }

  function validatePin() {
    if (els.pinInput.value === CONFIG_CODE) {
      closeModal(els.pinPanel);
      openModal(els.settingsPanel);
      listCameras().catch(() => {});
    } else {
      els.pinError.textContent = 'Code incorrect.';
      els.pinInput.select();
    }
  }

  async function restartCamera() {
    saveSettings();
    await startCamera(els.cameraSelect.value || selectedDeviceId || '');
  }

  function preventZoom() {
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => {
      document.addEventListener(eventName, (event) => event.preventDefault(), { passive: false });
    });
    document.addEventListener('touchmove', (event) => {
      if (event.touches && event.touches.length > 1) event.preventDefault();
    }, { passive: false });
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) event.preventDefault();
      lastTouchEnd = now;
    }, false);
  }

  function bindEvents() {
    els.takePhotoButton.addEventListener('click', takePhoto);
    els.settingsButton.addEventListener('click', openPinPanel);
    els.closePinButton.addEventListener('click', () => closeModal(els.pinPanel));
    els.validatePinButton.addEventListener('click', validatePin);
    els.pinInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') validatePin();
    });
    els.closeSettingsButton.addEventListener('click', () => closeModal(els.settingsPanel));
    els.refreshCamerasButton.addEventListener('click', () => listCameras().catch(() => {}));
    els.restartCameraButton.addEventListener('click', () => restartCamera().catch((error) => alert(error.message)));
    els.saveSettingsButton.addEventListener('click', () => {
      saveSettings();
      closeModal(els.settingsPanel);
    });
    els.clearStorageButton.addEventListener('click', async () => {
      await clearLocalStorageHistory();
      els.storageInfo.value = 'Historique effacé';
    });
    els.cameraSelect.addEventListener('change', () => {
      selectedDeviceId = els.cameraSelect.value;
      if (stream) restartCamera().catch((error) => alert(error.message));
    });
    els.mirrorSelect.addEventListener('change', saveSettings);
    els.printButton.addEventListener('click', printPhoto);
    els.shareButton.addEventListener('click', sharePhoto);
    els.continueButton.addEventListener('click', resetToHome);
    els.resultScreen.addEventListener('pointerdown', startResultIdleTimer);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && els.resultScreen.classList.contains('is-active')) {
        startResultIdleTimer();
      }
    });
  }

  async function init() {
    loadSettings();
    bindEvents();
    preventZoom();
    await listCameras().catch(() => {});

    if (localStorage.getItem('gc-camera-was-accepted') === '1') {
      startCamera('').catch(() => setStatus('Touchez Prendre une photo'));
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js?v=gc-2026-03').catch(() => {});
    }
  }

  init();
})();
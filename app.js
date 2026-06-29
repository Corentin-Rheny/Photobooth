(() => {
  'use strict';

  const CONFIG_CODE = '22082026';
  const COUNTDOWN_SECONDS = 5;
  const RESULT_IDLE_MS = 30000;
  const THEME_RED = '#E04043';
  const THEME_CREAM = '#FEF2EB';
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
    recoverButton: $('recoverButton'),
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
  let finalBlob = null;
  let finalUrl = '';
  let previewUrl = '';
  let idleTimer = null;
  let busy = false;

  const defaultSettings = {
    resolution: '1920x1080',
    mirror: 'preview',
    title: 'Gabrielle & Corentin',
    date: '22.08.2026'
  };

  function setStatus(message) {
    if (els.statusText) els.statusText.textContent = message;
  }

  function setScreen(name) {
    [els.homeScreen, els.countdownScreen, els.resultScreen].forEach((screen) => screen.classList.remove('is-active'));
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
      option.textContent = /usb|capture|hdmi|uvc|elgato|cam link|ugreen/i.test(label)
        ? `⭐ ${label} - caméra externe`
        : label;
      els.cameraSelect.appendChild(option);
    });

    if (selectedDeviceId && cameras.some((camera) => camera.deviceId === selectedDeviceId)) {
      els.cameraSelect.value = selectedDeviceId;
    } else {
      const external = cameras.find((camera) => /usb|capture|hdmi|uvc|elgato|cam link|ugreen/i.test(camera.label || ''));
      if (external) els.cameraSelect.value = external.deviceId;
    }
    return cameras;
  }

  function attachStream() {
    els.liveVideo.srcObject = stream;
    els.countVideo.srcObject = stream;
  }

  function stopCamera() {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
    attachStream();
  }

  async function startCamera(deviceId = '') {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Caméra indisponible. Ouvre la page en HTTPS dans Safari.');
    }

    stopCamera();
    setStatus('Ouverture caméra...');

    const { width, height } = parseResolution();
    const videoConstraints = {
      width: { ideal: width },
      height: { ideal: height },
      frameRate: { ideal: 30, max: 60 }
    };

    if (deviceId) videoConstraints.deviceId = { exact: deviceId };
    else videoConstraints.facingMode = { ideal: 'environment' };

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints });
    } catch (_) {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: deviceId ? { deviceId: { exact: deviceId } } : true });
    }

    attachStream();
    await els.liveVideo.play();
    await els.countVideo.play();

    const track = stream.getVideoTracks()[0];
    selectedDeviceId = track?.getSettings?.().deviceId || deviceId || '';
    localStorage.setItem('gc-camera-was-accepted', '1');
    els.cameraPlaceholder.classList.add('is-hidden');
    await listCameras();
    setStatus('Prêt');
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

  function drawImageCover(context, source, target) {
    const scale = Math.max(target.width / source.width, target.height / source.height);
    const cropWidth = target.width / scale;
    const cropHeight = target.height / scale;
    const cropX = (source.width - cropWidth) / 2;
    const cropY = (source.height - cropHeight) / 2;
    context.drawImage(source, cropX, cropY, cropWidth, cropHeight, target.x, target.y, target.width, target.height);
  }

  function canvasToBlob(canvas, type = 'image/png', quality = 1) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  async function createFinalPrint(rawCanvas) {
    const output = document.createElement('canvas');
    output.width = 1748;
    output.height = 1181;
    const context = output.getContext('2d', { alpha: false });
    const footerHeight = Math.round(output.height * 0.102);
    const photoHeight = output.height - footerHeight;

    context.fillStyle = '#000000';
    context.fillRect(0, 0, output.width, photoHeight);
    drawImageCover(context, rawCanvas, { x: 0, y: 0, width: output.width, height: photoHeight });

    context.fillStyle = THEME_CREAM;
    context.fillRect(0, photoHeight, output.width, footerHeight);

    context.fillStyle = THEME_RED;
    context.textBaseline = 'middle';
    context.font = '400 56px BravenGC, Didot, Georgia, serif';
    context.textAlign = 'left';
    context.fillText(els.eventTitleInput.value.trim() || 'Gabrielle & Corentin', 96, photoHeight + footerHeight / 2 + 4);
    context.textAlign = 'right';
    context.fillText(els.eventDateInput.value.trim() || '22.08.2026', output.width - 96, photoHeight + footerHeight / 2 + 4);

    return canvasToBlob(output, 'image/png', 1);
  }

  function revokeOldUrls() {
    if (finalUrl) URL.revokeObjectURL(finalUrl);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    finalUrl = '';
    previewUrl = '';
  }

  function filename() {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `photobooth-gabrielle-corentin-${stamp}.png`;
  }

  function downloadBlob(blob) {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename();
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function showResultScreen(rawCanvas, printBlob) {
    revokeOldUrls();
    finalBlob = printBlob;
    const previewBlob = await canvasToBlob(rawCanvas, 'image/jpeg', 0.94);
    finalUrl = URL.createObjectURL(printBlob);
    previewUrl = URL.createObjectURL(previewBlob);
    els.resultPreview.src = previewUrl;
    els.printImage.src = finalUrl;
    els.resultStatus.textContent = 'Photo téléchargée sur l’iPad. Retour automatique après 30 secondes.';
    setScreen('result');
    startResultIdleTimer();
    setTimeout(() => downloadBlob(printBlob), 250);
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
      const rawCanvas = captureFrame();
      const printBlob = await createFinalPrint(rawCanvas);
      await showResultScreen(rawCanvas, printBlob);
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

  function recoverPhoto() {
    if (!finalBlob) return;
    startResultIdleTimer();
    downloadBlob(finalBlob);
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
    els.clearStorageButton.addEventListener('click', () => {
      localStorage.removeItem('gc-photobooth-settings');
      loadSettings();
      els.storageInfo.value = 'Réglages réinitialisés';
    });
    els.cameraSelect.addEventListener('change', () => {
      selectedDeviceId = els.cameraSelect.value;
      if (stream) restartCamera().catch((error) => alert(error.message));
    });
    els.mirrorSelect.addEventListener('change', saveSettings);
    els.printButton.addEventListener('click', printPhoto);
    els.recoverButton.addEventListener('click', recoverPhoto);
    els.continueButton.addEventListener('click', resetToHome);
    els.resultScreen.addEventListener('pointerdown', startResultIdleTimer);
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
      navigator.serviceWorker.register('./sw.js?v=gc-2026-04').catch(() => {});
    }
  }

  init();
})();
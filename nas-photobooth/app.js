(() => {
  'use strict';

  const CONFIG_CODE = '22082026';
  const EVENT_TITLE = 'Gabrielle & Corentin';
  const EVENT_DATE = '22.08.2026';
  const QR_BASE = 'https://api.qrserver.com/v1/create-qr-code/';
  const $ = (id) => document.getElementById(id);

  const els = {
    homeScreen: $('homeScreen'), countdownScreen: $('countdownScreen'), resultScreen: $('resultScreen'),
    liveVideo: $('liveVideo'), countVideo: $('countVideo'), cameraPlaceholder: $('cameraPlaceholder'),
    settingsButton: $('settingsButton'), takePhotoButton: $('takePhotoButton'), statusText: $('statusText'), countNumber: $('countNumber'),
    resultPreview: $('resultPreview'), printImage: $('printImage'), printButton: $('printButton'), continueButton: $('continueButton'), resultStatus: $('resultStatus'),
    qrImage: $('qrImage'), qrHelp: $('qrHelp'), photoLink: $('photoLink'),
    pinPanel: $('pinPanel'), pinInput: $('pinInput'), pinError: $('pinError'), validatePinButton: $('validatePinButton'), closePinButton: $('closePinButton'),
    settingsPanel: $('settingsPanel'), closeSettingsButton: $('closeSettingsButton'), cameraSelect: $('cameraSelect'), resolutionSelect: $('resolutionSelect'), countdownSelect: $('countdownSelect'), mirrorSelect: $('mirrorSelect'), printModeSelect: $('printModeSelect'), idleSelect: $('idleSelect'),
    refreshCamerasButton: $('refreshCamerasButton'), restartCameraButton: $('restartCameraButton'), saveSettingsButton: $('saveSettingsButton')
  };

  let stream = null;
  let selectedDeviceId = '';
  let finalBlob = null;
  let finalUrl = '';
  let previewUrl = '';
  let publicPhotoUrl = '';
  let idleTimer = null;
  let busy = false;

  const defaults = { resolution: '1920x1080', countdown: '5', mirror: 'preview', printMode: 'manual', idle: '30' };

  function loadSettings() {
    let s = { ...defaults };
    try { s = { ...s, ...JSON.parse(localStorage.getItem('gc-booth-settings') || '{}') }; } catch (_) {}
    els.resolutionSelect.value = s.resolution;
    els.countdownSelect.value = s.countdown;
    els.mirrorSelect.value = s.mirror;
    els.printModeSelect.value = s.printMode;
    els.idleSelect.value = s.idle;
    applyVisualSettings();
  }

  function saveSettings() {
    localStorage.setItem('gc-booth-settings', JSON.stringify({
      resolution: els.resolutionSelect.value,
      countdown: els.countdownSelect.value,
      mirror: els.mirrorSelect.value,
      printMode: els.printModeSelect.value,
      idle: els.idleSelect.value
    }));
    applyVisualSettings();
  }

  function applyVisualSettings() {
    document.body.classList.toggle('mirror-preview', els.mirrorSelect.value === 'preview' || els.mirrorSelect.value === 'output');
  }

  function status(message) { els.statusText.textContent = message; }
  function setScreen(name) {
    [els.homeScreen, els.countdownScreen, els.resultScreen].forEach((screen) => screen.classList.remove('is-active'));
    (name === 'countdown' ? els.countdownScreen : name === 'result' ? els.resultScreen : els.homeScreen).classList.add('is-active');
  }
  function openModal(panel) { panel.classList.add('is-open'); panel.setAttribute('aria-hidden', 'false'); }
  function closeModal(panel) { panel.classList.remove('is-open'); panel.setAttribute('aria-hidden', 'true'); }
  function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  async function listCameras() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
    const cameras = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'videoinput');
    els.cameraSelect.innerHTML = '';
    cameras.forEach((camera, index) => {
      const option = document.createElement('option');
      const label = camera.label || `Caméra ${index + 1}`;
      option.value = camera.deviceId;
      option.textContent = /usb|capture|hdmi|uvc|elgato|cam link|ugreen/i.test(label) ? `⭐ ${label}` : label;
      els.cameraSelect.appendChild(option);
    });
    if (selectedDeviceId && cameras.some((camera) => camera.deviceId === selectedDeviceId)) els.cameraSelect.value = selectedDeviceId;
    else {
      const external = cameras.find((camera) => /usb|capture|hdmi|uvc|elgato|cam link|ugreen/i.test(camera.label || ''));
      if (external) els.cameraSelect.value = external.deviceId;
    }
    return cameras;
  }

  function parseResolution() {
    const [width, height] = els.resolutionSelect.value.split('x').map(Number);
    return { width, height };
  }

  function attachStream() {
    els.liveVideo.srcObject = stream;
    if (els.countVideo) els.countVideo.srcObject = null;
  }

  function stopCamera() {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
    attachStream();
  }

  async function startCamera(deviceId = '') {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Caméra indisponible. Ouvre cette page en HTTPS dans Safari.');
    stopCamera();
    status('Ouverture caméra...');
    const { width, height } = parseResolution();
    const video = { width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: 30, max: 60 } };
    if (deviceId) video.deviceId = { exact: deviceId }; else video.facingMode = { ideal: 'environment' };
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: false, video }); }
    catch (_) { stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: deviceId ? { deviceId: { exact: deviceId } } : true }); }
    attachStream();
    await els.liveVideo.play();
    selectedDeviceId = stream.getVideoTracks()[0]?.getSettings?.().deviceId || deviceId || '';
    localStorage.setItem('gc-camera-ok', '1');
    els.cameraPlaceholder.classList.add('is-hidden');
    await listCameras();
    status('Prêt');
  }

  async function ensureCamera() {
    const track = stream?.getVideoTracks?.()[0];
    if (track && track.readyState === 'live') return;
    await startCamera(els.cameraSelect.value || selectedDeviceId || '');
  }

  async function runCountdown() {
    setScreen('countdown');
    await els.liveVideo.play().catch(() => {});
    const seconds = Number(els.countdownSelect.value || 5);
    for (let i = seconds; i >= 1; i -= 1) {
      els.countNumber.textContent = String(i);
      await sleep(1000);
    }
  }

  async function waitForVideoFrame(video) {
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) return;
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('La caméra n’est pas encore prête.')), 2500);
      const done = () => { clearTimeout(timeout); resolve(); };
      video.addEventListener('loadeddata', done, { once: true });
      video.addEventListener('playing', done, { once: true });
    });
  }

  async function captureFrame() {
    const video = els.liveVideo;
    await video.play().catch(() => {});
    await waitForVideoFrame(video);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (els.mirrorSelect.value === 'output') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function drawCover(ctx, source, target) {
    const scale = Math.max(target.width / source.width, target.height / source.height);
    const cropWidth = target.width / scale;
    const cropHeight = target.height / scale;
    ctx.drawImage(source, (source.width - cropWidth) / 2, (source.height - cropHeight) / 2, cropWidth, cropHeight, target.x, target.y, target.width, target.height);
  }

  function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Impossible de générer la photo.')), type, quality));
  }

  async function createFinalPrint(rawCanvas) {
    if (document.fonts) {
      try { await Promise.race([document.fonts.ready, sleep(700)]); } catch (_) {}
    }
    const out = document.createElement('canvas');
    out.width = 1748;
    out.height = 1181;
    const ctx = out.getContext('2d', { alpha: false });
    const footer = Math.round(out.height * 0.102);
    const photoHeight = out.height - footer;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, out.width, photoHeight);
    drawCover(ctx, rawCanvas, { x: 0, y: 0, width: out.width, height: photoHeight });
    ctx.fillStyle = '#FEF2EB';
    ctx.fillRect(0, photoHeight, out.width, footer);
    ctx.fillStyle = '#E04043';
    ctx.font = '400 56px BravenGC, Didot, Georgia, serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(EVENT_TITLE, 96, photoHeight + footer / 2 + 4);
    ctx.textAlign = 'right';
    ctx.fillText(EVENT_DATE, out.width - 96, photoHeight + footer / 2 + 4);
    return canvasToBlob(out, 'image/jpeg', 0.92);
  }

  function cleanupUrls() {
    if (finalUrl) URL.revokeObjectURL(finalUrl);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    finalUrl = '';
    previewUrl = '';
  }

  async function uploadPhoto(blob) {
    const form = new FormData();
    form.append('photo', blob, 'photobooth.jpg');
    const response = await fetch('api/upload.php', { method: 'POST', body: form });
    const json = await response.json();
    if (!response.ok || !json.ok) throw new Error(json.error || 'Upload impossible');
    return json;
  }

  function setQr(url) {
    publicPhotoUrl = url;
    els.qrImage.src = `${QR_BASE}?size=320x320&margin=12&data=${encodeURIComponent(url)}`;
    if (els.photoLink) els.photoLink.href = url;
    els.qrHelp.textContent = 'Scannez ce QR code pour récupérer votre photo.';
  }

  async function showResult(rawCanvas, printBlob) {
    cleanupUrls();
    finalBlob = printBlob;
    publicPhotoUrl = '';
    const previewBlob = await canvasToBlob(rawCanvas, 'image/jpeg', 0.86);
    previewUrl = URL.createObjectURL(previewBlob);
    finalUrl = URL.createObjectURL(printBlob);
    els.resultPreview.src = previewUrl;
    els.printImage.src = finalUrl;
    els.qrImage.removeAttribute('src');
    if (els.photoLink) els.photoLink.removeAttribute('href');
    els.qrHelp.textContent = 'Envoi de votre photo...';
    els.resultStatus.textContent = 'Upload vers le NAS en cours...';
    setScreen('result');
    resetIdleTimer();
    try {
      const uploaded = await uploadPhoto(printBlob);
      setQr(uploaded.url);
      els.resultStatus.textContent = 'Photo disponible.';
      if (els.printModeSelect.value === 'auto') setTimeout(printPhoto, 500);
    } catch (error) {
      els.qrHelp.textContent = 'La photo est prête, mais l’envoi NAS a échoué.';
      els.resultStatus.textContent = error.message;
    }
  }

  async function takePhoto() {
    if (busy) return;
    busy = true;
    els.takePhotoButton.disabled = true;
    try {
      await ensureCamera();
      await runCountdown();
      const raw = await captureFrame();
      const printBlob = await createFinalPrint(raw);
      await showResult(raw, printBlob);
    } catch (error) {
      console.error(error);
      setScreen('home');
      status('Erreur caméra');
      alert(error.message || String(error));
    } finally {
      busy = false;
      els.takePhotoButton.disabled = false;
    }
  }

  function printPhoto() {
    if (!finalBlob || !finalUrl) return;
    clearTimeout(idleTimer);
    els.resultStatus.textContent = 'Ouverture de l’impression...';
    setTimeout(resetToHome, 1800);
    setTimeout(resetToHome, 8000);
    try {
      window.print();
    } catch (error) {
      els.resultStatus.textContent = 'Impression indisponible sur cet appareil.';
      setTimeout(resetToHome, 1200);
    }
  }

  function resetIdleTimer() { clearTimeout(idleTimer); idleTimer = setTimeout(resetToHome, Number(els.idleSelect.value || 30) * 1000); }
  function resetToHome() { clearTimeout(idleTimer); setScreen('home'); status('Prêt'); }

  function openPin() { els.pinInput.value = ''; els.pinError.textContent = ''; openModal(els.pinPanel); setTimeout(() => els.pinInput.focus(), 80); }
  function validatePin() { if (els.pinInput.value === CONFIG_CODE) { closeModal(els.pinPanel); openModal(els.settingsPanel); listCameras().catch(() => {}); } else { els.pinError.textContent = 'Code incorrect.'; els.pinInput.select(); } }
  async function restartCamera() { saveSettings(); await startCamera(els.cameraSelect.value || selectedDeviceId || ''); }

  function preventZoom() {
    ['gesturestart','gesturechange','gestureend'].forEach((name) => document.addEventListener(name, (event) => event.preventDefault(), { passive: false }));
    document.addEventListener('touchmove', (event) => { if (event.touches && event.touches.length > 1) event.preventDefault(); }, { passive: false });
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => { const now = Date.now(); if (now - lastTouchEnd <= 300) event.preventDefault(); lastTouchEnd = now; }, false);
  }

  function bind() {
    els.takePhotoButton.addEventListener('click', takePhoto);
    els.settingsButton.addEventListener('click', openPin);
    els.closePinButton.addEventListener('click', () => closeModal(els.pinPanel));
    els.validatePinButton.addEventListener('click', validatePin);
    els.pinInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') validatePin(); });
    els.closeSettingsButton.addEventListener('click', () => closeModal(els.settingsPanel));
    els.refreshCamerasButton.addEventListener('click', () => listCameras().catch(() => {}));
    els.restartCameraButton.addEventListener('click', () => restartCamera().catch((error) => alert(error.message)));
    els.saveSettingsButton.addEventListener('click', () => { saveSettings(); closeModal(els.settingsPanel); });
    els.cameraSelect.addEventListener('change', () => { selectedDeviceId = els.cameraSelect.value; if (stream) restartCamera().catch((error) => alert(error.message)); });
    [els.countdownSelect, els.mirrorSelect, els.printModeSelect, els.idleSelect].forEach((el) => el.addEventListener('change', saveSettings));
    els.printButton.addEventListener('click', printPhoto);
    els.continueButton.addEventListener('click', resetToHome);
    els.resultScreen.addEventListener('pointerdown', resetIdleTimer);
  }

  async function init() {
    loadSettings();
    bind();
    preventZoom();
    await listCameras().catch(() => {});
    if (localStorage.getItem('gc-camera-ok') === '1') startCamera('').catch(() => status('Touchez Prendre une photo'));
  }

  init();
})();
(() => {
  'use strict';

  const CONFIG_CODE = '22082026';
  const RESULT_IDLE_MS = 30000;
  const THEME_RED = '#E04043';
  const THEME_CREAM = '#FEF2EB';
  const $ = (id) => document.getElementById(id);

  const els = {
    homeScreen: $('homeScreen'), countdownScreen: $('countdownScreen'), resultScreen: $('resultScreen'),
    liveVideo: $('liveVideo'), countVideo: $('countVideo'), cameraPlaceholder: $('cameraPlaceholder'),
    settingsButton: $('settingsButton'), takePhotoButton: $('takePhotoButton'), statusText: $('statusText'), countNumber: $('countNumber'),
    resultPreview: $('resultPreview'), printImage: $('printImage'), printButton: $('printButton'), recoverButton: $('recoverButton'), continueButton: $('continueButton'), resultStatus: $('resultStatus'),
    qrPanel: $('qrPanel'), closeQrButton: $('closeQrButton'), qrImage: $('qrImage'), qrLink: $('qrLink'), qrStatus: $('qrStatus'),
    pinPanel: $('pinPanel'), pinInput: $('pinInput'), pinError: $('pinError'), validatePinButton: $('validatePinButton'), closePinButton: $('closePinButton'),
    settingsPanel: $('settingsPanel'), closeSettingsButton: $('closeSettingsButton'), cameraSelect: $('cameraSelect'), resolutionSelect: $('resolutionSelect'), countdownSelect: $('countdownSelect'), mirrorSelect: $('mirrorSelect'),
    eventTitleInput: $('eventTitleInput'), eventDateInput: $('eventDateInput'), storageInfo: $('storageInfo'), nasUploadUrlInput: $('nasUploadUrlInput'), nasPublicUrlInput: $('nasPublicUrlInput'),
    refreshCamerasButton: $('refreshCamerasButton'), restartCameraButton: $('restartCameraButton'), clearStorageButton: $('clearStorageButton'), saveSettingsButton: $('saveSettingsButton')
  };

  let stream = null, selectedDeviceId = '', finalBlob = null, finalUrl = '', previewUrl = '', idleTimer = null, busy = false;
  const defaults = { resolution: '1920x1080', countdown: '5', mirror: 'preview', title: 'Gabrielle & Corentin', date: '22.08.2026', nasUploadUrl: '', nasPublicUrl: '' };

  function setStatus(message) { if (els.statusText) els.statusText.textContent = message; }
  function setScreen(name) { [els.homeScreen, els.countdownScreen, els.resultScreen].forEach((s) => s.classList.remove('is-active')); (name === 'countdown' ? els.countdownScreen : name === 'result' ? els.resultScreen : els.homeScreen).classList.add('is-active'); }
  function openModal(panel) { if (!panel) return; panel.classList.add('is-open'); panel.setAttribute('aria-hidden', 'false'); }
  function closeModal(panel) { if (!panel) return; panel.classList.remove('is-open'); panel.setAttribute('aria-hidden', 'true'); }

  function loadSettings() {
    let s = { ...defaults };
    try { s = { ...s, ...JSON.parse(localStorage.getItem('gc-photobooth-settings') || '{}') }; } catch (_) {}
    els.resolutionSelect.value = s.resolution;
    if (els.countdownSelect) els.countdownSelect.value = s.countdown;
    els.mirrorSelect.value = s.mirror;
    els.eventTitleInput.value = s.title;
    els.eventDateInput.value = s.date;
    if (els.nasUploadUrlInput) els.nasUploadUrlInput.value = s.nasUploadUrl || '';
    if (els.nasPublicUrlInput) els.nasPublicUrlInput.value = s.nasPublicUrl || '';
    applyVisualSettings();
  }

  function readSettings() {
    return {
      resolution: els.resolutionSelect.value,
      countdown: els.countdownSelect ? els.countdownSelect.value : '5',
      mirror: els.mirrorSelect.value,
      title: els.eventTitleInput.value,
      date: els.eventDateInput.value,
      nasUploadUrl: els.nasUploadUrlInput ? els.nasUploadUrlInput.value.trim() : '',
      nasPublicUrl: els.nasPublicUrlInput ? els.nasPublicUrlInput.value.trim() : ''
    };
  }

  function saveSettings() { localStorage.setItem('gc-photobooth-settings', JSON.stringify(readSettings())); applyVisualSettings(); }
  function applyVisualSettings() { document.body.classList.toggle('mirror-preview', els.mirrorSelect.value === 'preview' || els.mirrorSelect.value === 'output'); }
  function parseResolution() { const [width, height] = els.resolutionSelect.value.split('x').map(Number); return { width, height }; }

  async function listCameras() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
    const cameras = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
    els.cameraSelect.innerHTML = '';
    cameras.forEach((camera, index) => {
      const option = document.createElement('option');
      const label = camera.label || `Caméra ${index + 1}`;
      option.value = camera.deviceId;
      option.textContent = /usb|capture|hdmi|uvc|elgato|cam link|ugreen/i.test(label) ? `⭐ ${label} - caméra externe` : label;
      els.cameraSelect.appendChild(option);
    });
    if (selectedDeviceId && cameras.some((c) => c.deviceId === selectedDeviceId)) els.cameraSelect.value = selectedDeviceId;
    else { const ext = cameras.find((c) => /usb|capture|hdmi|uvc|elgato|cam link|ugreen/i.test(c.label || '')); if (ext) els.cameraSelect.value = ext.deviceId; }
    return cameras;
  }

  function attachStream() { els.liveVideo.srcObject = stream; els.countVideo.srcObject = stream; }
  function stopCamera() { if (!stream) return; stream.getTracks().forEach((t) => t.stop()); stream = null; attachStream(); }

  async function startCamera(deviceId = '') {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Caméra indisponible. Ouvre la page en HTTPS dans Safari.');
    stopCamera(); setStatus('Ouverture caméra...');
    const { width, height } = parseResolution();
    const video = { width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: 30, max: 60 } };
    if (deviceId) video.deviceId = { exact: deviceId }; else video.facingMode = { ideal: 'environment' };
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: false, video }); }
    catch (_) { stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: deviceId ? { deviceId: { exact: deviceId } } : true }); }
    attachStream(); await els.liveVideo.play(); await els.countVideo.play();
    selectedDeviceId = stream.getVideoTracks()[0]?.getSettings?.().deviceId || deviceId || '';
    localStorage.setItem('gc-camera-was-accepted', '1'); els.cameraPlaceholder.classList.add('is-hidden'); await listCameras(); setStatus('Prêt');
  }

  async function ensureCamera() { const t = stream?.getVideoTracks?.()[0]; if (t && t.readyState === 'live') return; await startCamera(els.cameraSelect.value || selectedDeviceId || ''); }
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function runCountdown() {
    setScreen('countdown');
    const seconds = Number((els.countdownSelect && els.countdownSelect.value) || 5);
    for (let i = seconds; i >= 1; i -= 1) { els.countNumber.textContent = String(i); await sleep(1000); }
  }

  function captureFrame() {
    const video = els.liveVideo;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920; canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (els.mirrorSelect.value === 'output') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function drawImageCover(ctx, source, target) {
    const scale = Math.max(target.width / source.width, target.height / source.height);
    const cropW = target.width / scale, cropH = target.height / scale;
    ctx.drawImage(source, (source.width - cropW) / 2, (source.height - cropH) / 2, cropW, cropH, target.x, target.y, target.width, target.height);
  }
  const canvasToBlob = (canvas, type = 'image/png', quality = 1) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

  async function createFinalPrint(rawCanvas) {
    if (document.fonts) { await document.fonts.ready; await document.fonts.load('56px BravenGC'); }
    const output = document.createElement('canvas'); output.width = 1748; output.height = 1181;
    const ctx = output.getContext('2d', { alpha: false });
    const footerHeight = Math.round(output.height * 0.102), photoHeight = output.height - footerHeight;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, output.width, photoHeight); drawImageCover(ctx, rawCanvas, { x: 0, y: 0, width: output.width, height: photoHeight });
    ctx.fillStyle = THEME_CREAM; ctx.fillRect(0, photoHeight, output.width, footerHeight);
    ctx.fillStyle = THEME_RED; ctx.textBaseline = 'middle'; ctx.font = '400 56px BravenGC, Didot, Georgia, serif';
    ctx.textAlign = 'left'; ctx.fillText(els.eventTitleInput.value.trim() || 'Gabrielle & Corentin', 96, photoHeight + footerHeight / 2 + 4);
    ctx.textAlign = 'right'; ctx.fillText(els.eventDateInput.value.trim() || '22.08.2026', output.width - 96, photoHeight + footerHeight / 2 + 4);
    return canvasToBlob(output, 'image/png', 1);
  }

  function revokeUrls() { if (finalUrl) URL.revokeObjectURL(finalUrl); if (previewUrl) URL.revokeObjectURL(previewUrl); finalUrl = ''; previewUrl = ''; }

  async function showResultScreen(rawCanvas, printBlob) {
    revokeUrls(); finalBlob = printBlob;
    const previewBlob = await canvasToBlob(rawCanvas, 'image/jpeg', 0.94);
    finalUrl = URL.createObjectURL(printBlob); previewUrl = URL.createObjectURL(previewBlob);
    els.resultPreview.src = previewUrl; els.printImage.src = finalUrl;
    els.resultStatus.textContent = 'Photo prête. Envoi NAS à configurer.';
    setScreen('result'); startResultIdleTimer();
  }

  function startResultIdleTimer() { clearTimeout(idleTimer); idleTimer = setTimeout(resetToHome, RESULT_IDLE_MS); }
  function resetToHome() { clearTimeout(idleTimer); closeModal(els.qrPanel); setScreen('home'); setStatus('Prêt'); }

  async function takePhoto() {
    if (busy) return; busy = true; els.takePhotoButton.disabled = true;
    try { await ensureCamera(); await runCountdown(); const raw = captureFrame(); const print = await createFinalPrint(raw); await showResultScreen(raw, print); }
    catch (error) { console.error(error); setScreen('home'); setStatus('Erreur caméra'); alert(error.message || String(error)); }
    finally { busy = false; els.takePhotoButton.disabled = false; }
  }

  function printPhoto() { if (!finalBlob) return; startResultIdleTimer(); window.print(); }
  function recoverPhoto() { startResultIdleTimer(); els.qrStatus.textContent = 'L’envoi automatique NAS sera activé dès que le lien d’accès Synology sera configuré.'; els.qrImage.removeAttribute('src'); els.qrLink.removeAttribute('href'); els.qrLink.textContent = 'Lien NAS à configurer'; openModal(els.qrPanel); }
  function openPinPanel() { els.pinInput.value = ''; els.pinError.textContent = ''; openModal(els.pinPanel); setTimeout(() => els.pinInput.focus(), 80); }
  function validatePin() { if (els.pinInput.value === CONFIG_CODE) { closeModal(els.pinPanel); openModal(els.settingsPanel); listCameras().catch(() => {}); } else { els.pinError.textContent = 'Code incorrect.'; els.pinInput.select(); } }
  async function restartCamera() { saveSettings(); await startCamera(els.cameraSelect.value || selectedDeviceId || ''); }

  function preventZoom() {
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => document.addEventListener(eventName, (event) => event.preventDefault(), { passive: false }));
    document.addEventListener('touchmove', (event) => { if (event.touches && event.touches.length > 1) event.preventDefault(); }, { passive: false });
    let lastTouchEnd = 0; document.addEventListener('touchend', (event) => { const now = Date.now(); if (now - lastTouchEnd <= 300) event.preventDefault(); lastTouchEnd = now; }, false);
  }

  function bindEvents() {
    els.takePhotoButton.addEventListener('click', takePhoto); els.settingsButton.addEventListener('click', openPinPanel); if (els.closeQrButton) els.closeQrButton.addEventListener('click', () => closeModal(els.qrPanel));
    els.closePinButton.addEventListener('click', () => closeModal(els.pinPanel)); els.validatePinButton.addEventListener('click', validatePin); els.pinInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') validatePin(); });
    els.closeSettingsButton.addEventListener('click', () => closeModal(els.settingsPanel)); els.refreshCamerasButton.addEventListener('click', () => listCameras().catch(() => {})); els.restartCameraButton.addEventListener('click', () => restartCamera().catch((error) => alert(error.message)));
    els.saveSettingsButton.addEventListener('click', () => { saveSettings(); closeModal(els.settingsPanel); });
    els.clearStorageButton.addEventListener('click', () => { if (els.nasUploadUrlInput) els.nasUploadUrlInput.value = ''; if (els.nasPublicUrlInput) els.nasPublicUrlInput.value = ''; saveSettings(); });
    els.cameraSelect.addEventListener('change', () => { selectedDeviceId = els.cameraSelect.value; if (stream) restartCamera().catch((error) => alert(error.message)); });
    els.mirrorSelect.addEventListener('change', saveSettings); if (els.countdownSelect) els.countdownSelect.addEventListener('change', saveSettings);
    els.printButton.addEventListener('click', printPhoto); els.recoverButton.addEventListener('click', recoverPhoto); els.continueButton.addEventListener('click', resetToHome); els.resultScreen.addEventListener('pointerdown', startResultIdleTimer);
  }

  async function init() { loadSettings(); bindEvents(); preventZoom(); await listCameras().catch(() => {}); if (localStorage.getItem('gc-camera-was-accepted') === '1') startCamera('').catch(() => setStatus('Touchez Prendre une photo')); if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=gc-2026-05').catch(() => {}); }
  init();
})();
globalThis.browser = globalThis.browser || chrome;
let audioCtx = null;
let gainNode = null;
let connectedElements = new WeakSet();
let currentVolume = 100;
let isBoostEnabled = false;

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
  }
}

function updateGain() {
  if (!gainNode) return;
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => { });
  }
  gainNode.gain.value = isBoostEnabled ? (currentVolume / 100) : 1;
}

function hookMediaElements() {
  const mediaElements = document.querySelectorAll('video, audio');
  if (mediaElements.length === 0) return;

  mediaElements.forEach(el => {
    if (!connectedElements.has(el)) {
      initAudioContext();
      try {
        const source = audioCtx.createMediaElementSource(el);
        source.connect(gainNode);
        connectedElements.add(el);
      } catch (error) {
        console.warn("Volume Booster: Could not hook media element.", error);
      }
    }
  });
}

let hookTimeout;
let observerInstance = null;

function startObserver() {
  if (!observerInstance && document.body) {
    observerInstance = new MutationObserver(() => {
      clearTimeout(hookTimeout);
      hookTimeout = setTimeout(() => {
        hookMediaElements();
      }, 300);
    });
    observerInstance.observe(document.body, { childList: true, subtree: true });
  }
}

function stopObserver() {
  if (observerInstance) {
    observerInstance.disconnect();
    observerInstance = null;
  }
}

async function autoInit() {
  const settings = await browser.runtime.sendMessage({ action: "getContentSettings" });

  if (settings && settings.enabled) {
    currentVolume = settings.volume;
    isBoostEnabled = true;
    initAudioContext();
    hookMediaElements();
    updateGain();
    startObserver();
  }
}

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "updateVolume") {
    currentVolume = message.volume;
    isBoostEnabled = message.enabled;

    if (isBoostEnabled) {
      initAudioContext();
      hookMediaElements();
      updateGain();
      startObserver();
    } else {
      updateGain();
      stopObserver();
    }
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}


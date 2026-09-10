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
  resumeAudioContext();
  gainNode.gain.value = isBoostEnabled ? (currentVolume / 100) : 1;
}

function resumeAudioContext() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => { });
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === 'visible') resumeAudioContext();
});
document.addEventListener("click", resumeAudioContext, { passive: true });
document.addEventListener("keydown", resumeAudioContext, { passive: true });

function hookMediaElements() {
  const videos = document.getElementsByTagName('video');
  const audios = document.getElementsByTagName('audio');

  let newlyHooked = false;

  const processElement = (el) => {
    if (!connectedElements.has(el)) {
      initAudioContext();
      try {
        const source = audioCtx.createMediaElementSource(el);
        source.connect(gainNode);
        connectedElements.add(el);
        newlyHooked = true;
      } catch (error) {
        console.warn("Volume Booster: Could not hook media element.", error);
      }
    }
  };

  for (let i = 0; i < videos.length; i++) processElement(videos[i]);
  for (let i = 0; i < audios.length; i++) processElement(audios[i]);

  if (newlyHooked) resumeAudioContext();
}

let hookTimeout;
let observerInstance = null;

function startObserver() {
  if (!observerInstance && document.body) {
    observerInstance = new MutationObserver((mutations) => {
      let hasPotentialMedia = false;
      for (let mutation of mutations) {
        for (let node of mutation.addedNodes) {
          if (node.nodeName === 'VIDEO' || node.nodeName === 'AUDIO') {
            hasPotentialMedia = true;
            break;
          }
          if (node.getElementsByTagName) {
            if (node.getElementsByTagName('video').length > 0 || node.getElementsByTagName('audio').length > 0) {
              hasPotentialMedia = true;
              break;
            }
          }
        }
        if (hasPotentialMedia) break;
      }

      if (hasPotentialMedia) {
        clearTimeout(hookTimeout);
        hookTimeout = setTimeout(() => {
          hookMediaElements();
        }, 300);
      }
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

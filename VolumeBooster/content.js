globalThis.browser = globalThis.browser || chrome;

let audioCtx = null;
let gainNode = null;
const connectedElements = new WeakSet();
let currentVolume = 100;
let isBoostEnabled = false;
let unlockListenersAttached = false;

function resumeAudioContext() {
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") {
    attachUnlockListeners();
    audioCtx.resume().then(() => {
      if (audioCtx.state === "running") removeUnlockListeners();
    }).catch(() => {});
  } else if (audioCtx.state === "running") {
    removeUnlockListeners();
  }
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") resumeAudioContext();
}

function attachUnlockListeners() {
  if (unlockListenersAttached) return;
  unlockListenersAttached = true;
  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("click", resumeAudioContext, { passive: true });
  document.addEventListener("keydown", resumeAudioContext, { passive: true });
  document.addEventListener("pointerdown", resumeAudioContext, { passive: true });
  document.addEventListener("touchstart", resumeAudioContext, { passive: true });
}

function removeUnlockListeners() {
  if (!unlockListenersAttached) return;
  unlockListenersAttached = false;
  document.removeEventListener("visibilitychange", onVisibilityChange);
  document.removeEventListener("click", resumeAudioContext);
  document.removeEventListener("keydown", resumeAudioContext);
  document.removeEventListener("pointerdown", resumeAudioContext);
  document.removeEventListener("touchstart", resumeAudioContext);
}

function initAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    attachUnlockListeners();
  }
}

function updateGain() {
  if (!gainNode || !audioCtx) return;
  resumeAudioContext();
  const targetGain = isBoostEnabled ? (currentVolume / 100) : 1;
  // Smooth 15ms exponential interpolation to prevent zipper noise when moving the slider
  gainNode.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.015);
}

function hookMediaElements() {
  const videos = document.getElementsByTagName("video");
  const audios = document.getElementsByTagName("audio");
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

let hookTimeout = null;
let observerInstance = null;

function startObserver() {
  if (!observerInstance && document.body) {
    observerInstance = new MutationObserver((mutations) => {
      let hasPotentialMedia = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeName === "VIDEO" || node.nodeName === "AUDIO") {
            hasPotentialMedia = true;
            break;
          }
          if (node.getElementsByTagName &&
             (node.getElementsByTagName("video").length > 0 || node.getElementsByTagName("audio").length > 0)) {
            hasPotentialMedia = true;
            break;
          }
        }
        if (hasPotentialMedia) break;
      }

      if (hasPotentialMedia) {
        clearTimeout(hookTimeout);
        hookTimeout = setTimeout(hookMediaElements, 300);
      }
    });
    observerInstance.observe(document.body, { childList: true, subtree: true });
  }
}

function stopObserver() {
  clearTimeout(hookTimeout);
  hookTimeout = null;
  if (observerInstance) {
    observerInstance.disconnect();
    observerInstance = null;
  }
}

async function autoInit() {
  try {
    const settings = await browser.runtime.sendMessage({ action: "getContentSettings" });
    if (settings && settings.enabled) {
      currentVolume = settings.volume;
      isBoostEnabled = true;
      initAudioContext();
      hookMediaElements();
      updateGain();
      startObserver();
    }
  } catch (e) {}
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
  document.addEventListener("DOMContentLoaded", autoInit, { once: true });
} else {
  autoInit();
}

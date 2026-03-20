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
  gainNode.gain.value = isBoostEnabled ? (currentVolume / 100) : 1;
}

function hookMediaElements() {
  const mediaElements = document.querySelectorAll('video, audio');
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

async function autoInit() {
  const settings = await browser.runtime.sendMessage({ action: "getContentSettings" });
  
  if (settings && settings.enabled) {
    currentVolume = settings.volume;
    isBoostEnabled = true;
    initAudioContext();
    hookMediaElements();
    updateGain();
  }
}

const observer = new MutationObserver(() => hookMediaElements());
observer.observe(document.body, { childList: true, subtree: true });

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "updateVolume") {
    currentVolume = message.volume;
    isBoostEnabled = message.enabled;
    initAudioContext();
    hookMediaElements();
    updateGain();
  }
});

autoInit();
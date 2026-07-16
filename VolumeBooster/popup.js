globalThis.browser = globalThis.browser || chrome;
document.addEventListener("DOMContentLoaded", async () => {
  const masterToggle = document.getElementById("masterToggle");
  const limitToggle = document.getElementById("limitToggle");
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeValue = document.getElementById("volumeValue");
  const applyLastBtn = document.getElementById("applyLastBtn");
  const resetBtn = document.getElementById("resetBtn");
  const activeTabInfo = document.getElementById("activeTabInfo");
  const themeToggle = document.getElementById("themeToggle");

  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];
  
  if (!currentTab) {
    activeTabInfo.textContent = "Error: No active tab found";
    return;
  }
  const tabId = currentTab.id;

  try {
    const url = new URL(currentTab.url);
    activeTabInfo.textContent = `Active on: ${url.hostname.replace('www.', '')}`;
  } catch (e) {
    activeTabInfo.textContent = "Active on: current page";
  }

  const storageData = await browser.storage.local.get(["globalLastVolume", "themePreference", `tab_${tabId}`]);
  let globalLastVolume = storageData.globalLastVolume || 100;
  let tabState = storageData[`tab_${tabId}`] || { enabled: false, volume: 100, extremeMode: false };
  let isLightMode = storageData.themePreference === "light";

  if (isLightMode) document.body.classList.add("light-mode");

  masterToggle.checked = tabState.enabled;
  limitToggle.checked = tabState.extremeMode;
  volumeSlider.max = tabState.extremeMode ? "1000" : "600";
  volumeSlider.value = tabState.volume;
  
  updateUIText();

  function updateUIText(val = null) {
    const currentVal = val !== null ? val : parseInt(volumeSlider.value, 10);
    volumeValue.textContent = `${currentVal}%`;
    
    if (currentVal > 600) {
      volumeValue.className = "glow-red";
    } else {
      volumeValue.className = "glow-green";
    }
    
    applyLastBtn.textContent = `Apply Last: ${globalLastVolume}%`;
  }

  async function syncState() {
    const currentVol = parseInt(volumeSlider.value);
    const isEnabled = masterToggle.checked;
    const isExtreme = limitToggle.checked;

    tabState = { enabled: isEnabled, volume: currentVol, extremeMode: isExtreme };
    
    const dataToSave = { [`tab_${tabId}`]: tabState };
    if (isEnabled && currentVol !== 100) {
      globalLastVolume = currentVol;
      dataToSave.globalLastVolume = globalLastVolume;
    }
    await browser.storage.local.set(dataToSave);
    
    updateUIText();

    try {
      await browser.tabs.sendMessage(tabId, {
        action: "updateVolume",
        volume: currentVol,
        enabled: isEnabled
      });
    } catch (err) {
      console.warn("Could not connect to content script. Page might need a refresh.");
    }

    browser.runtime.sendMessage({
      action: "updateBadge",
      tabId: tabId,
      volume: currentVol,
      enabled: isEnabled
    });
  }

  themeToggle.addEventListener("click", () => {
    isLightMode = !isLightMode;
    document.body.classList.toggle("light-mode", isLightMode);
    browser.storage.local.set({ themePreference: isLightMode ? "light" : "dark" });
  });

  volumeSlider.addEventListener("input", async () => {
    const currentVol = parseInt(volumeSlider.value, 10);
    
    masterToggle.checked = (currentVol !== 100);
    updateUIText(currentVol);
    try {
      await browser.tabs.sendMessage(tabId, {
        action: "updateVolume",
        volume: currentVol,
        enabled: masterToggle.checked
      });
    } catch (err) {}
  });

  volumeSlider.addEventListener("change", () => {
    syncState();
  });

  masterToggle.addEventListener("change", () => {
    if (parseInt(volumeSlider.value, 10) === 100) {
      masterToggle.checked = false;
    }
    syncState();
  });

  limitToggle.addEventListener("change", () => {
    const isExtreme = limitToggle.checked;
    volumeSlider.max = isExtreme ? "1000" : "600";
    
    if (!isExtreme && parseInt(volumeSlider.value) > 600) {
      volumeSlider.value = "600";
    }
    syncState();
  });

  applyLastBtn.addEventListener("click", () => {
    if (globalLastVolume > 600) {
      limitToggle.checked = true;
      volumeSlider.max = "1000";
    }
    volumeSlider.value = globalLastVolume;
    masterToggle.checked = (globalLastVolume !== 100);
    syncState();
  });

  resetBtn.addEventListener("click", () => {
    volumeSlider.value = "100";
    masterToggle.checked = false;
    syncState();
  });
});


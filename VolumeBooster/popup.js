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
  const lastVolText = document.getElementById("lastVolText");
  const langSelect = document.getElementById("langSelect");
  const syncDomainBtn = document.getElementById("syncDomainBtn");

  const availableLangs = {
    "auto": "🌐 Auto (Browser)", "en": "🇬🇧 English", "ro": "🇷🇴 Română", "es": "🇪🇸 Español", "fr": "🇫🇷 Français",
    "de": "🇩🇪 Deutsch", "it": "🇮🇹 Italiano", "pt_BR": "🇧🇷 Português", "ru": "🇷🇺 Русский", "zh_CN": "🇨🇳 中文",
    "zh_TW": "🇹🇼 繁體中文", "ja": "🇯🇵 日本語", "ko": "🇰🇷 한국어", "ar": "🇸🇦 العربية", "hi": "🇮🇳 हिन्दी", "tr": "🇹🇷 Türkçe",
    "nl": "🇳🇱 Nederlands", "pl": "🇵🇱 Polski", "sv": "🇸🇪 Svenska", "fi": "🇫🇮 Suomi", "da": "🇩🇰 Dansk",
    "no": "🇳🇴 Norsk", "el": "🇬🇷 Ελληνικά", "cs": "🇨🇿 Čeština", "hu": "🇭🇺 Magyar", "bg": "🇧🇬 Български",
    "uk": "🇺🇦 Українська", "hr": "🇭🇷 Hrvatski", "sk": "🇸🇰 Slovenčina", "sl": "🇸🇮 Slovenščina", "sr": "🇷🇸 Српски",
    "id": "🇮🇩 Bahasa Indonesia", "ms": "🇲🇾 Bahasa Melayu", "th": "🇹🇭 ไทย", "vi": "🇻🇳 Tiếng Việt", "he": "🇮🇱 עברית",
    "fa": "🇮🇷 فارسی", "ca": "🇦🇩 Català", "et": "🇪🇪 Eesti", "lt": "🇱🇹 Lietuvių", "lv": "🇱🇻 Latviešu",
    "sw": "🇰🇪 Kiswahili", "am": "🇪🇹 አማርኛ", "bn": "🇧🇩 বাংলা", "fil": "🇵🇭 Filipino", "gu": "🇮🇳 ગુજરાતી",
    "kn": "🇮🇳 ಕನ್ನಡ", "ml": "🇮🇳 മലയാളം", "mr": "🇮🇳 मराठी", "ta": "🇮🇳 தமிழ்", "te": "🇮🇳 తెలుగు"
  };

  // Single DOM reflow using DocumentFragment
  const fragment = document.createDocumentFragment();
  for (const [code, name] of Object.entries(availableLangs)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = name;
    fragment.appendChild(opt);
  }
  langSelect.appendChild(fragment);

  const [storageData, tabs] = await Promise.all([
    browser.storage.local.get(["themePreference", "languagePreference"]),
    browser.tabs.query({ active: true, currentWindow: true })
  ]);

  let isLightMode = storageData.themePreference === "light";
  let langPref = storageData.languagePreference || "auto";

  langSelect.value = langPref;
  if (isLightMode) document.body.classList.add("light-mode");

  let customMessages = null;
  const i18nElements = document.querySelectorAll("[data-i18n]");
  const i18nTitleElements = document.querySelectorAll("[data-i18n-title]");

  async function loadTranslations(lang) {
    if (lang === "auto") {
      customMessages = null;
      return;
    }
    try {
      const url = browser.runtime.getURL(`_locales/${lang}/messages.json`);
      const response = await fetch(url);
      customMessages = await response.json();
    } catch (e) {
      console.error("Failed to load language:", lang, e);
      customMessages = null;
    }
  }

  function getMessage(key) {
    if (customMessages && customMessages[key] && customMessages[key].message) {
      return customMessages[key].message;
    }
    return globalThis.browser.i18n.getMessage(key);
  }

  function applyTranslations() {
    i18nElements.forEach(el => {
      const msg = getMessage(el.getAttribute("data-i18n"));
      if (msg) el.textContent = msg;
    });
    i18nTitleElements.forEach(el => {
      const msg = getMessage(el.getAttribute("data-i18n-title"));
      if (msg) el.title = msg;
    });
  }

  await loadTranslations(langPref);
  applyTranslations();

  const currentTab = tabs[0];
  let tabId = null;
  let tabKey = null;
  let domainKey = null;
  let urlObj = null;
  let domainVolume = 100;

  if (currentTab) {
    tabId = currentTab.id;
    tabKey = "tab_" + tabId;
    try {
      urlObj = new URL(currentTab.url);
      if (urlObj.hostname) {
        domainKey = "domain_" + urlObj.hostname;
      }
    } catch (e) {}
  }

  function updateTabInfoDisplay() {
    if (!currentTab) {
      activeTabInfo.textContent = getMessage("errorNoTab") || "Error: No active tab found";
      return;
    }
    const activeOnMsg = getMessage("activeOn") || "Active on: ";
    const activeCurrentMsg = getMessage("activeCurrent") || "Active on: current page";
    if (urlObj && urlObj.hostname) {
      activeTabInfo.textContent = activeOnMsg + urlObj.hostname.replace(/^www\./, "");
    } else {
      activeTabInfo.textContent = activeCurrentMsg;
    }
  }

  updateTabInfoDisplay();

  let tabState = { enabled: false, volume: 100, extremeMode: false };

  if (tabKey) {
    const keysToGet = [tabKey];
    if (domainKey) keysToGet.push(domainKey);

    const tabAndDomainData = await browser.storage.local.get(keysToGet);
    if (tabAndDomainData[tabKey]) {
      tabState = tabAndDomainData[tabKey];
    }
    if (domainKey && tabAndDomainData[domainKey] && tabAndDomainData[domainKey].volume !== 100) {
      domainVolume = tabAndDomainData[domainKey].volume;
    }
  }

  masterToggle.checked = tabState.enabled;
  limitToggle.checked = tabState.extremeMode;
  volumeSlider.max = tabState.extremeMode ? "1000" : "600";
  volumeSlider.value = tabState.volume;

  function updateUIText(val = null) {
    const currentVal = val !== null ? val : parseInt(volumeSlider.value, 10);
    volumeValue.textContent = currentVal + "%";

    let hue;
    if (currentVal <= 100) {
      hue = 150;
    } else if (currentVal <= 600) {
      hue = 150 - ((currentVal - 100) / 500) * 90;
    } else {
      hue = 60 - ((currentVal - 600) / 400) * 60;
    }

    const lightness = isLightMode ? 35 : 50;
    const dynamicColor = `hsl(${hue}, 100%, ${lightness}%)`;
    volumeValue.style.color = dynamicColor;
    volumeValue.style.textShadow = `0 0 12px hsla(${hue}, 100%, ${lightness}%, 0.4)`;
    document.documentElement.style.setProperty("--dynamic-accent", dynamicColor);

    if (lastVolText) lastVolText.textContent = domainVolume + "%";
  }

  updateUIText();

  langSelect.addEventListener("change", async () => {
    langPref = langSelect.value;
    await browser.storage.local.set({ languagePreference: langPref });
    await loadTranslations(langPref);
    applyTranslations();
    updateTabInfoDisplay();
  });

  async function syncState() {
    if (!tabKey) return;
    const currentVol = parseInt(volumeSlider.value, 10);
    const isEnabled = masterToggle.checked;
    const isExtreme = limitToggle.checked;

    tabState = { enabled: isEnabled, volume: currentVol, extremeMode: isExtreme };
    const dataToSave = { [tabKey]: tabState };

    if (domainKey && currentVol !== 100) {
      dataToSave[domainKey] = { volume: currentVol, extremeMode: isExtreme };
      domainVolume = currentVol;
    }

    await browser.storage.local.set(dataToSave);
    updateUIText(currentVol);

    if (tabId) {
      browser.tabs.sendMessage(tabId, {
        action: "updateVolume",
        volume: currentVol,
        enabled: isEnabled
      }).catch(() => {});

      browser.runtime.sendMessage({
        action: "updateBadge",
        tabId: tabId,
        volume: currentVol,
        enabled: isEnabled
      });
    }
  }

  let syncBtnTimeout = null;
  if (syncDomainBtn) {
    if (!domainKey) {
      syncDomainBtn.parentElement.style.display = "none";
    } else {
      syncDomainBtn.addEventListener("click", () => {
        const currentVol = parseInt(volumeSlider.value, 10);
        const isEnabled = masterToggle.checked;
        browser.runtime.sendMessage({
          action: "syncDomainTabs",
          domain: urlObj.hostname,
          state: { enabled: isEnabled, volume: currentVol, extremeMode: limitToggle.checked }
        });

        clearTimeout(syncBtnTimeout);
        syncDomainBtn.textContent = getMessage("syncSuccess") || "\u2713 Synced!";
        syncBtnTimeout = setTimeout(() => {
          syncDomainBtn.textContent = getMessage("syncTabsText") || "Sync All Tabs";
        }, 1500);
      });
    }
  }

  themeToggle.addEventListener("click", () => {
    isLightMode = !isLightMode;
    document.body.classList.toggle("light-mode", isLightMode);
    browser.storage.local.set({ themePreference: isLightMode ? "light" : "dark" });
    updateUIText();
  });

  let rafId = null;
  volumeSlider.addEventListener("input", () => {
    const currentVol = parseInt(volumeSlider.value, 10);
    masterToggle.checked = (currentVol !== 100);
    if (domainKey && currentVol !== 100) {
      domainVolume = currentVol;
    }
    updateUIText(currentVol);

    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (!tabId) return;
      const vol = parseInt(volumeSlider.value, 10);
      const enabled = masterToggle.checked;

      browser.runtime.sendMessage({
        action: "updateBadge",
        tabId: tabId,
        volume: vol,
        enabled: enabled
      });

      browser.tabs.sendMessage(tabId, {
        action: "updateVolume",
        volume: vol,
        enabled: enabled
      }).catch(() => {});
    });
  });

  volumeSlider.addEventListener("change", () => syncState());

  masterToggle.addEventListener("change", () => {
    if (parseInt(volumeSlider.value, 10) === 100) masterToggle.checked = false;
    syncState();
  });

  limitToggle.addEventListener("change", () => {
    const isExtreme = limitToggle.checked;
    volumeSlider.max = isExtreme ? "1000" : "600";
    if (!isExtreme && parseInt(volumeSlider.value, 10) > 600) {
      volumeSlider.value = "600";
    }
    syncState();
  });

  applyLastBtn.addEventListener("click", () => {
    const volToApply = domainVolume;
    if (volToApply > 600) {
      limitToggle.checked = true;
      volumeSlider.max = "1000";
    }
    volumeSlider.value = volToApply;
    masterToggle.checked = (volToApply !== 100);
    syncState();
  });

  resetBtn.addEventListener("click", () => {
    volumeSlider.value = "100";
    masterToggle.checked = false;
    syncState();
  });
});

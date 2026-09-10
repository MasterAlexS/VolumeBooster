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

  const availableLangs = {
    "auto": "🌐 Auto (Browser)", "en": "🇬🇧 English", "ro": "🇷🇴 Română", "es": "🇪🇸 Español", "fr": "🇫🇷 Français",
    "de": "🇩🇪 Deutsch", "it": "🇮🇹 Italiano", "pt_BR": "🇧🇷 Português", "ru": "🇷🇺 Русский", "zh_CN": "🇨🇳 中文",
    "ja": "🇯🇵 日本語", "ko": "🇰🇷 한국어", "ar": "🇸🇦 العربية", "hi": "🇮🇳 हिन्दी", "tr": "🇹🇷 Türkçe",
    "nl": "🇳🇱 Nederlands", "pl": "🇵🇱 Polski", "sv": "🇸🇪 Svenska", "fi": "🇫🇮 Suomi", "da": "🇩🇰 Dansk",
    "no": "🇳🇴 Norsk", "el": "🇬🇷 Ελληνικά", "cs": "🇨🇿 Čeština", "hu": "🇭🇺 Magyar", "bg": "🇧🇬 Български",
    "uk": "🇺🇦 Українська", "hr": "🇭🇷 Hrvatski", "sk": "🇸🇰 Slovenčina", "sl": "🇸🇮 Slovenščina", "sr": "🇷🇸 Српски",
    "id": "🇮🇩 Bahasa Indonesia", "ms": "🇲🇾 Bahasa Melayu", "th": "🇹🇭 ไทย", "vi": "🇻🇳 Tiếng Việt", "he": "🇮🇱 עברית",
    "fa": "🇮🇷 فارسی", "ca": "🇦🇩 Català", "et": "🇪🇪 Eesti", "lt": "🇱🇹 Lietuvių", "lv": "🇱🇻 Latviešu",
    "sw": "🇰🇪 Kiswahili", "am": "🇪🇹 አማርኛ", "bn": "🇧🇩 বাংলা", "fil": "🇵🇭 Filipino", "gu": "🇮🇳 ગુજરાતી",
    "kn": "🇮🇳 ಕನ್ನಡ", "ml": "🇮🇳 മലയാളം", "mr": "🇮🇳 मराठी", "ta": "🇮🇳 தமிழ்", "te": "🇮🇳 తెలుగు"
  };

  // Populate langSelect
  for (const [code, name] of Object.entries(availableLangs)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = name;
    langSelect.appendChild(opt);
  }

  const storageData = await browser.storage.local.get(["globalLastVolume", "themePreference", "languagePreference"]);
  let globalLastVolume = storageData.globalLastVolume || 100;
  let isLightMode = storageData.themePreference === "light";
  let langPref = storageData.languagePreference || "auto";

  langSelect.value = langPref;

  if (isLightMode) document.body.classList.add("light-mode");

  let customMessages = null;

  async function loadTranslations(lang) {
    if (lang === "auto") {
      customMessages = null;
      return;
    }
    try {
      const url = browser.runtime.getURL("_locales/" + lang + "/messages.json");
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
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const msg = getMessage(el.getAttribute('data-i18n'));
      if (msg) el.textContent = msg;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const msg = getMessage(el.getAttribute('data-i18n-title'));
      if (msg) el.title = msg;
    });
  }

  await loadTranslations(langPref);
  applyTranslations();

  langSelect.addEventListener("change", async () => {
    langPref = langSelect.value;
    await browser.storage.local.set({ languagePreference: langPref });
    await loadTranslations(langPref);
    applyTranslations();
    updateTabInfoDisplay(); // refresh dynamic domain text
  });

  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  let tabId = null;
  let tabKey = null;
  let domainKey = null;
  let urlObj = null;
  let domainVolume = 100;

  function updateTabInfoDisplay() {
    if (!currentTab) {
      activeTabInfo.textContent = getMessage("errorNoTab") || "Error: No active tab found";
      return;
    }
    const activeOnMsg = getMessage("activeOn") || "Active on: ";
    const activeCurrentMsg = getMessage("activeCurrent") || "Active on: current page";
    if (urlObj && urlObj.hostname) {
      activeTabInfo.textContent = activeOnMsg + urlObj.hostname.replace(/^www\./, '');
    } else {
      activeTabInfo.textContent = activeCurrentMsg;
    }
  }

  if (currentTab) {
    tabId = currentTab.id;
    tabKey = "tab_" + tabId;
    try {
      urlObj = new URL(currentTab.url);
      if (urlObj.hostname) {
        domainKey = "domain_" + urlObj.hostname;
      }
    } catch (e) { }
  }

  updateTabInfoDisplay();

  let tabState = { enabled: false, volume: 100, extremeMode: false };

  if (tabKey) {
    let keysToGet = [tabKey];
    if (domainKey) keysToGet.push(domainKey);

    const tabAndDomainData = await browser.storage.local.get(keysToGet);
    if (tabAndDomainData[tabKey]) {
      tabState = tabAndDomainData[tabKey];
    }
    if (domainKey && tabAndDomainData[domainKey]) {
      domainVolume = tabAndDomainData[domainKey].volume;
    }
  }

  masterToggle.checked = tabState.enabled;
  limitToggle.checked = tabState.extremeMode;
  volumeSlider.max = tabState.extremeMode ? "1000" : "600";
  volumeSlider.value = tabState.volume;

  updateUIText();

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
    volumeValue.className = "";
    document.documentElement.style.setProperty('--dynamic-accent', dynamicColor);

    if (lastVolText) lastVolText.textContent = domainVolume + "%";
  }

  async function syncState() {
    if (!tabKey) return;
    const currentVol = parseInt(volumeSlider.value);
    const isEnabled = masterToggle.checked;
    const isExtreme = limitToggle.checked;

    tabState = { enabled: isEnabled, volume: currentVol, extremeMode: isExtreme };

    const dataToSave = { [tabKey]: tabState };

    if (domainKey && currentVol !== 100) {
      dataToSave[domainKey] = { volume: currentVol, extremeMode: isExtreme };
      domainVolume = currentVol;
    }

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
    } catch (err) { }

    browser.runtime.sendMessage({
      action: "updateBadge",
      tabId: tabId,
      volume: currentVol,
      enabled: isEnabled
    });
  }

  const syncDomainBtn = document.getElementById("syncDomainBtn");
  if (syncDomainBtn) {
    if (!domainKey) {
      syncDomainBtn.parentElement.style.display = "none";
    } else {
      syncDomainBtn.addEventListener("click", () => {
        const currentVol = parseInt(volumeSlider.value);
        const isEnabled = masterToggle.checked;
        browser.runtime.sendMessage({
          action: "syncDomainTabs",
          domain: urlObj.hostname,
          state: { enabled: isEnabled, volume: currentVol, extremeMode: limitToggle.checked }
        });
        const originalText = syncDomainBtn.textContent;
        syncDomainBtn.textContent = getMessage("syncSuccess") || "\u2713 Synced!";
        setTimeout(() => {
          syncDomainBtn.textContent = originalText;
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

  volumeSlider.addEventListener("input", async () => {
    const currentVol = parseInt(volumeSlider.value, 10);
    masterToggle.checked = (currentVol !== 100);
    updateUIText(currentVol);

    browser.runtime.sendMessage({
      action: "updateBadge",
      tabId: tabId,
      volume: currentVol,
      enabled: masterToggle.checked
    });

    try {
      await browser.tabs.sendMessage(tabId, {
        action: "updateVolume",
        volume: currentVol,
        enabled: masterToggle.checked
      });
    } catch (err) { }
  });

  volumeSlider.addEventListener("change", () => syncState());
  masterToggle.addEventListener("change", () => {
    if (parseInt(volumeSlider.value, 10) === 100) masterToggle.checked = false;
    syncState();
  });
  limitToggle.addEventListener("change", () => {
    const isExtreme = limitToggle.checked;
    volumeSlider.max = isExtreme ? "1000" : "600";
    if (!isExtreme && parseInt(volumeSlider.value) > 600) volumeSlider.value = "600";
    syncState();
  });
  applyLastBtn.addEventListener("click", () => {
    let volToApply = domainVolume;
    if (volToApply > 600) { limitToggle.checked = true; volumeSlider.max = "1000"; }
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

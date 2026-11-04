globalThis.browser = globalThis.browser || chrome;

browser.runtime.onStartup.addListener(async () => {
  const allData = await browser.storage.local.get(null);
  const keysToRemove = Object.keys(allData).filter(key => key.startsWith("tab_"));
  if (keysToRemove.length > 0) {
    await browser.storage.local.remove(keysToRemove);
  }
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBadge") {
    updateTabBadge(message.tabId, message.enabled, message.volume);
  } 
  else if (message.action === "getContentSettings") {
    if (!sender.tab || typeof sender.tab.id !== "number") {
      sendResponse({ enabled: false, volume: 100, extremeMode: false });
      return false;
    }

    const tabId = sender.tab.id;
    const tabKey = `tab_${tabId}`;

    browser.storage.local.get(tabKey).then(res => {
      const state = res[tabKey];
      if (state) {
        sendResponse(state);
        if (sender.frameId === 0) {
          updateTabBadge(tabId, state.enabled, state.volume);
        }
      } else {
        sendResponse({ enabled: false, volume: 100, extremeMode: false });
      }
    });
    return true;
  } 
  else if (message.action === "syncDomainTabs") {
    const targetDomain = message.domain;
    const state = message.state;

    browser.tabs.query({}).then(tabs => {
      const storageUpdates = {};
      if (state.volume !== 100) {
        storageUpdates[`domain_${targetDomain}`] = {
          volume: state.volume,
          extremeMode: state.extremeMode
        };
      }

      tabs.forEach(tab => {
        try {
          if (!tab.url) return;
          const urlObj = new URL(tab.url);
          if (urlObj.hostname === targetDomain) {
            storageUpdates[`tab_${tab.id}`] = state;
            updateTabBadge(tab.id, state.enabled, state.volume);
            browser.tabs.sendMessage(tab.id, {
              action: "updateVolume",
              volume: state.volume,
              enabled: state.enabled
            }).catch(() => {});
          }
        } catch (e) {}
      });

      if (Object.keys(storageUpdates).length > 0) {
        browser.storage.local.set(storageUpdates);
      }
    });
  }
});

function updateTabBadge(tabId, enabled, volume) {
  if (enabled) {
    const text = volume >= 1000 ? "1K" : volume.toString();
    browser.action.setBadgeText({ text: text, tabId: tabId });

    let r, g;
    if (volume <= 100) {
      r = 0; g = 255;
    } else if (volume <= 600) {
      r = Math.round(((volume - 100) / 500) * 255);
      g = 255;
    } else {
      r = 255;
      g = Math.round(255 - ((volume - 600) / 400) * 255);
    }

    browser.action.setBadgeBackgroundColor({
      color: [r, g, 0, 255],
      tabId: tabId
    });
  } else {
    browser.action.setBadgeText({ text: "", tabId: tabId });
  }
}

browser.tabs.onRemoved.addListener((tabId) => {
  browser.storage.local.remove(`tab_${tabId}`);
});

globalThis.browser = globalThis.browser || chrome;
browser.runtime.onStartup.addListener(async () => {
  const allData = await browser.storage.local.get();
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
    const tabId = sender.tab.id;
    const tabKey = `tab_${tabId}`;

    browser.storage.local.get(tabKey).then(res => {
      const state = res[tabKey];
      if (state) {
        sendResponse(state);
        updateTabBadge(tabId, state.enabled, state.volume);
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
      tabs.forEach(tab => {
        try {
          if (!tab.url) return;
          const urlObj = new URL(tab.url);
          if (urlObj.hostname === targetDomain) {
            const tabKey = `tab_${tab.id}`;
            browser.storage.local.set({ [tabKey]: state });
            updateTabBadge(tab.id, state.enabled, state.volume);
            browser.tabs.sendMessage(tab.id, {
              action: "updateVolume",
              volume: state.volume,
              enabled: state.enabled
            }).catch(() => {});
          }
        } catch (e) {}
      });
    });
  }
});

function updateTabBadge(tabId, enabled, volume) {
  if (enabled) {
    let text = volume >= 1000 ? "1K" : volume.toString();
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

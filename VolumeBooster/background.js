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
    let storageKey = `tab_${tabId}`;
    try {
      if (sender.url) {
        const url = new URL(sender.url);
        if (url.hostname) {
          storageKey = `domain_${url.hostname}`;
        }
      }
    } catch (e) {
      // Keep fallback
    }

    browser.storage.local.get(storageKey).then(res => {
      const state = res[storageKey];
      if (state) {
        sendResponse(state);
        updateTabBadge(tabId, state.enabled, state.volume);
      } else {
        sendResponse({ enabled: false, volume: 100 });
      }
    });
    return true;
  }
});

function updateTabBadge(tabId, enabled, volume) {
  if (enabled) {
    let text = volume >= 1000 ? "1K" : volume.toString();
    browser.action.setBadgeText({ text: text, tabId: tabId });
    browser.action.setBadgeBackgroundColor({ 
      color: volume > 600 ? "#ff4757" : "#00cc6a", 
      tabId: tabId 
    });
  } else {
    browser.action.setBadgeText({ text: "", tabId: tabId });
  }
}

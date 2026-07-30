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

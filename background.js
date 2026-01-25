function numberTabs() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    tabs.forEach((tab, index) => {
      if (
        tab.url &&
        !tab.url.startsWith("chrome://") &&
        !tab.url.startsWith("brave://") &&
        !tab.url.startsWith("edge://") &&
        !tab.url.startsWith("devtools://")
      ) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (i) => {
            document.title = `${i + 1}. ` + document.title.replace(/^\d+\.\s*/, "");
          },
          args: [index]
        }).catch(err => console.warn("Script error:", err.message));
      }
    });
  });
}

// 🔄 Triggers to auto-update tab numbers
chrome.tabs.onActivated.addListener(numberTabs);
chrome.tabs.onCreated.addListener(numberTabs);
chrome.tabs.onUpdated.addListener(numberTabs);
chrome.tabs.onRemoved.addListener(numberTabs);
chrome.tabs.onMoved.addListener(numberTabs);

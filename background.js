// ==========================================
// TAB NUMBERING - Optimized with debouncing
// ==========================================

let numberingTimeout = null;

function numberTabs() {
  // Debounce to prevent excessive executions
  if (numberingTimeout) {
    clearTimeout(numberingTimeout);
  }

  numberingTimeout = setTimeout(() => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      tabs.forEach((tab, index) => {
        if (
          tab.url &&
          !tab.url.startsWith("chrome://") &&
          !tab.url.startsWith("brave://") &&
          !tab.url.startsWith("edge://") &&
          !tab.url.startsWith("devtools://")
        ) {
          chrome.scripting
            .executeScript({
              target: { tabId: tab.id },
              func: (i) => {
                document.title =
                  `${i + 1}. ` + document.title.replace(/^\d+\.\s*/, "");
              },
              args: [index],
            })
            .catch(() => {}); // Silent fail for protected pages
        }
      });
    });
  }, 100); // 100ms debounce
}

// Tab numbering event listeners
chrome.tabs.onActivated.addListener(numberTabs);
chrome.tabs.onCreated.addListener(numberTabs);
chrome.tabs.onUpdated.addListener(numberTabs);
chrome.tabs.onRemoved.addListener(numberTabs);
chrome.tabs.onMoved.addListener(numberTabs);

// ==========================================
// SITE BLOCKING - New Feature
// ==========================================

/**
 * Normalize URL to extract domain
 * @param {string} url - URL to normalize
 * @returns {string} - Domain without www
 */
function normalizeDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch (error) {
    return url.replace(/^www\./, "").split("/")[0];
  }
}

/**
 * Check if URL should be blocked
 * @param {string} url - URL to check
 * @param {Array} blockedSites - Array of blocked domains
 * @returns {boolean} - True if should be blocked
 */
function shouldBlockUrl(url, blockedSites) {
  if (!url || !blockedSites || blockedSites.length === 0) {
    return false;
  }

  const domain = normalizeDomain(url);

  return blockedSites.some((blockedSite) => {
    const normalizedBlocked = blockedSite.replace(/^www\./, "");
    return (
      domain === normalizedBlocked || domain.endsWith("." + normalizedBlocked)
    );
  });
}

/**
 * Block navigation to blocked sites
 */
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle main frame navigations
  if (details.frameId !== 0) {
    return;
  }

  try {
    // Get blocked sites and pause state from storage
    const result = await chrome.storage.local.get([
      "blockedSites",
      "siteBlockerPaused",
    ]);
    const blockedSites = result.blockedSites || [];
    const isPaused = result.siteBlockerPaused || false;

    // Don't block if paused
    if (isPaused) {
      return;
    }

    // Check if URL should be blocked
    if (shouldBlockUrl(details.url, blockedSites)) {
      console.log("🚫 Blocking and closing tab for:", details.url);

      // Close the tab
      chrome.tabs.remove(details.tabId);
    }
  } catch (error) {
    console.error("Error checking blocked sites:", error);
  }
});

/**
 * Block tab updates to blocked sites
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only check when URL changes
  if (!changeInfo.url) {
    return;
  }

  try {
    // Get blocked sites and pause state from storage
    const result = await chrome.storage.local.get([
      "blockedSites",
      "siteBlockerPaused",
    ]);
    const blockedSites = result.blockedSites || [];
    const isPaused = result.siteBlockerPaused || false;

    // Don't block if paused
    if (isPaused) {
      return;
    }

    // Check if URL should be blocked
    if (shouldBlockUrl(changeInfo.url, blockedSites)) {
      console.log("🚫 Blocking and closing tab for:", changeInfo.url);

      // Close the tab
      chrome.tabs.remove(tabId);
    }
  } catch (error) {
    console.error("Error checking blocked sites:", error);
  }
});

console.log("✨ Extension background script initialized");

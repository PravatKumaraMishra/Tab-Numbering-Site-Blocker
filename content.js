// ==========================================
// YOUTUBE SHORTS BLOCKER - Optimized
// ==========================================

console.log("🎬 YouTube Shorts Blocker: Content script loaded");

let isBlocking = false;
let styleElement = null;
let observer = null;

// Optimized CSS selectors - more specific and efficient
const blockingCSS = `
    /* Hide Shorts shelf on homepage */
    ytd-reel-shelf-renderer,
    ytd-rich-shelf-renderer[is-shorts] {
        display: none !important;
    }
    
    /* Hide Shorts tab in navigation */
    yt-tab-shape[tab-title="Shorts"],
    a[title="Shorts"],
    ytd-guide-entry-renderer[title="Shorts"] {
        display: none !important;
    }
    
    /* Hide individual shorts in feed */
    ytd-reel-item-renderer,
    ytd-video-renderer[is-shorts],
    ytd-grid-video-renderer[is-shorts] {
        display: none !important;
    }
`;

/**
 * Inject CSS to block shorts
 */
function injectBlockingCSS() {
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "youtube-shorts-blocker-style";
    styleElement.textContent = blockingCSS;
    document.head.appendChild(styleElement);
    console.log("✅ Blocking CSS injected");
  }
}

/**
 * Remove blocking CSS
 */
function removeBlockingCSS() {
  if (styleElement?.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
    styleElement = null;
    console.log("❌ Blocking CSS removed");
  }
}

/**
 * Redirect shorts URLs to regular video format
 */
function handleShortsRedirect() {
  if (isBlocking && window.location.pathname.includes("/shorts/")) {
    console.log("🔄 Redirecting from Shorts URL");
    const videoId = window.location.pathname
      .split("/shorts/")[1]
      ?.split("?")[0];
    if (videoId) {
      window.location.replace(`https://www.youtube.com/watch?v=${videoId}`);
    }
  }
}

/**
 * Enable blocking
 */
function enableBlocking() {
  console.log("🚫 Enabling Shorts blocking");
  isBlocking = true;
  injectBlockingCSS();
  handleShortsRedirect();
}

/**
 * Disable blocking
 */
function disableBlocking() {
  console.log("✅ Disabling Shorts blocking");
  isBlocking = false;
  removeBlockingCSS();
}

/**
 * Initialize blocker from storage
 */
async function initializeBlocker() {
  try {
    const result = await chrome.storage.local.get("blockShorts");
    const shouldBlock = result.blockShorts || false;
    console.log("📊 Initial blocking state:", shouldBlock);

    if (shouldBlock) {
      enableBlocking();
    }
  } catch (error) {
    console.error("❌ Error initializing blocker:", error);
  }
}

/**
 * Listen for messages from popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Message received:", request);

  if (request.action === "toggleShorts") {
    if (request.enabled) {
      enableBlocking();
    } else {
      disableBlocking();
    }
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Listen for storage changes
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.blockShorts) {
    console.log("💾 Storage changed:", changes.blockShorts.newValue);
    if (changes.blockShorts.newValue) {
      enableBlocking();
    } else {
      disableBlocking();
    }
  }
});

/**
 * Handle YouTube SPA navigation - Optimized
 */
let lastUrl = location.href;

if (observer) {
  observer.disconnect();
}

observer = new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    console.log("🔄 Navigation detected:", currentUrl);
    handleShortsRedirect();
  }
});

// Observe only necessary parts of the DOM
observer.observe(document, {
  subtree: true,
  childList: true,
});

/**
 * Cleanup on page unload to prevent memory leaks
 */
window.addEventListener("beforeunload", () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});

// Initialize
initializeBlocker();

// Also check on DOMContentLoaded if still loading
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeBlocker);
}

console.log("✨ YouTube Shorts Blocker: Initialization complete");

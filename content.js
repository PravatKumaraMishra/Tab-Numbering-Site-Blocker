// ==========================================
// YOUTUBE SHORTS BLOCKER - Section-Specific Control
// ==========================================

console.log("🎬 YouTube Shorts Blocker: Content script loaded");

let isBlocking = false;
let pauseConfig = {
  home: false,
  subscriptions: false,
  search: false,
};
let hideRecommendations = false;
let styleElement = null;
let recommendationStyleElement = null;
let observer = null;

/**
 * Detect current YouTube section
 * @returns {string} Current section: 'home', 'subscriptions', 'search', or 'other'
 */
function getCurrentSection() {
  const path = window.location.pathname;
  const search = window.location.search;

  if (path === "/" || path === "/feed/explore") return "home";
  if (path.includes("/feed/subscriptions")) return "subscriptions";
  if (path.includes("/results") || search.includes("search_query="))
    return "search";
  return "other";
}

/**
 * Check if blocking should apply in current section
 * @returns {boolean} True if should block
 */
function shouldBlockInCurrentSection() {
  if (!isBlocking) return false;

  const section = getCurrentSection();

  // Only block if we're on a recognized section (not 'other')
  if (section === "other") return false;

  // Block if section is NOT paused (paused = false means blocking active)
  return !pauseConfig[section];
}

function getBlockingCSS() {
  if (!shouldBlockInCurrentSection()) {
    return ""; // Don't block if paused for this section
  }

  // Section-specific CSS selectors
  const section = getCurrentSection();
  let css = "";

  // Always hide Shorts tab in navigation when any blocking is active
  css += `
    /* Hide Shorts tab in navigation */
    yt-tab-shape[tab-title="Shorts"],
    a[title="Shorts"],
    ytd-guide-entry-renderer[title="Shorts"],
    ytd-mini-guide-entry-renderer[aria-label*="Shorts"] {
        display: none !important;
    }
  `;

  // Add section-specific selectors
  if (section === "home") {
    css += `
      /* Hide Shorts shelf on homepage */
      ytd-reel-shelf-renderer,
      ytd-rich-shelf-renderer[is-shorts],
      ytd-rich-section-renderer:has(ytd-reel-shelf-renderer) {
          display: none !important;
      }
    `;
  }

  if (section === "subscriptions") {
    css += `
      /* Hide Shorts in subscriptions feed */
      ytd-reel-item-renderer,
      ytd-video-renderer[is-shorts],
      ytd-grid-video-renderer[is-shorts],
      ytd-rich-item-renderer:has([overlay-style="SHORTS"]),
      ytd-rich-shelf-renderer[is-shorts] {
          display: none !important;
      }
    `;
  }

  if (section === "search") {
    css += `
      /* Hide Shorts in search results */
      ytd-video-renderer[is-shorts],
      ytd-grid-video-renderer[is-shorts],
      ytd-reel-shelf-renderer,
      ytd-reel-item-renderer,
      ytd-item-section-renderer:has(ytd-reel-shelf-renderer),
      /* Hide shorts shelf in search */
      ytd-shelf-renderer:has(#video-title[href*="/shorts/"]) {
          display: none !important;
      }
    `;
  }

  // Hide individual shorts in any feed (catch-all)
  css += `
    /* Hide individual shorts in feed */
    ytd-reel-item-renderer,
    ytd-video-renderer[is-shorts],
    ytd-grid-video-renderer[is-shorts],
    a[href*="/shorts/"],
    ytd-thumbnail[href*="/shorts/"],
    ytd-rich-item-renderer:has(a[href*="/shorts/"]) {
        display: none !important;
    }
  `;

  return css;
}

/**
 * Update CSS injection based on current section and pause state
 */
function updateBlockingCSS() {
  const css = getBlockingCSS();

  if (css) {
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "youtube-shorts-blocker-style";
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;
    console.log("✅ Blocking CSS updated for section:", getCurrentSection());
  } else {
    removeBlockingCSS();
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

// ==========================================
// YOUTUBE RECOMMENDATION HIDING
// ==========================================

/**
 * Update recommendation hiding CSS based on current state
 */
function updateRecommendationCSS() {
  if (hideRecommendations) {
    if (!recommendationStyleElement) {
      recommendationStyleElement = document.createElement("style");
      recommendationStyleElement.id = "youtube-recommendation-hider-style";
      document.head.appendChild(recommendationStyleElement);
    }
    recommendationStyleElement.textContent = `
      /* Hide recommendations on watch page */
      #secondary.style-scope.ytd-watch-flexy { display: none !important; }
      ytd-watch-next-secondary-results-renderer { display: none !important; }
      
      /* Hide end of video recommendations */
      .ytp-endscreen-content { display: none !important; }
      
      /* Hide Home Page Content */
      ytd-browse[page-subtype="home"] #primary { display: none !important; }
      
      /* Hide Subscriptions Page Content */
      ytd-browse[page-subtype="subscriptions"] #primary { display: none !important; }
    `;
    console.log("🎯 Recommendation hiding enabled");
  } else if (recommendationStyleElement?.parentNode) {
    recommendationStyleElement.parentNode.removeChild(
      recommendationStyleElement,
    );
    recommendationStyleElement = null;
    console.log("✅ Recommendation hiding disabled");
  }
}

/**
 * Redirect home page to Watch Later if recommendations are hidden
 */
function handleRecommendationRedirect() {
  if (hideRecommendations && window.location.pathname === "/") {
    console.log("🔄 Redirecting from Home to Watch Later");
    window.location.replace(
      "https://youtube.com/playlist?list=PLx5OhTygUYQ5u2JtnaT9UFr8dey-9_JT2&si=mJyleOog4eix9-Ik",
    );
  }
}

/**
 * Redirect shorts URLs to regular video format
 */
function handleShortsRedirect() {
  if (
    shouldBlockInCurrentSection() &&
    window.location.pathname.includes("/shorts/")
  ) {
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
  updateBlockingCSS();
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
 * Update pause configuration for a specific section
 * @param {Object} newConfig Updated pause configuration
 */
function updatePauseConfig(newConfig) {
  pauseConfig = { ...pauseConfig, ...newConfig };
  console.log("⚙️ Pause config updated:", pauseConfig);
  updateBlockingCSS();
  handleShortsRedirect();
}

/**
 * Initialize blocker from storage
 */
async function initializeBlocker() {
  try {
    const result = await chrome.storage.local.get([
      "blockShorts",
      "shortsPauseConfig",
      "hideRecommendations",
    ]);
    const shouldBlock = result.blockShorts || false;
    pauseConfig = result.shortsPauseConfig || {
      home: false,
      subscriptions: false,
      search: false,
    };
    hideRecommendations = result.hideRecommendations || false;
    console.log(
      "📊 Initial state - Blocking:",
      shouldBlock,
      "Pause config:",
      pauseConfig,
      "Hide recommendations:",
      hideRecommendations,
    );

    if (shouldBlock) enableBlocking();
    if (hideRecommendations) {
      updateRecommendationCSS();
      handleRecommendationRedirect();
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
  } else if (request.action === "updatePauseConfig") {
    updatePauseConfig(request.config);
    sendResponse({ success: true });
  } else if (request.action === "toggleRecommendations") {
    hideRecommendations = request.enabled;
    updateRecommendationCSS();
    handleRecommendationRedirect();
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Listen for storage changes
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.blockShorts) {
    console.log("💾 Blocking state changed:", changes.blockShorts.newValue);
    if (changes.blockShorts.newValue) {
      enableBlocking();
    } else {
      disableBlocking();
    }
  }
  if (changes.shortsPauseConfig) {
    console.log("💾 Pause config changed:", changes.shortsPauseConfig.newValue);
    pauseConfig = changes.shortsPauseConfig.newValue || {
      home: false,
      subscriptions: false,
      search: false,
    };
    updateBlockingCSS();
    handleShortsRedirect();
  }
  if (changes.hideRecommendations) {
    console.log(
      "💾 Hide recommendations changed:",
      changes.hideRecommendations.newValue,
    );
    hideRecommendations = changes.hideRecommendations.newValue;
    updateRecommendationCSS();
    handleRecommendationRedirect();
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
    updateBlockingCSS();
    handleShortsRedirect();
    handleRecommendationRedirect();
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
  if (recommendationStyleElement?.parentNode) {
    recommendationStyleElement.parentNode.removeChild(
      recommendationStyleElement,
    );
    recommendationStyleElement = null;
  }
});

// Initialize
initializeBlocker();

// Also check on DOMContentLoaded if still loading
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeBlocker);
}

console.log("✨ YouTube Shorts Blocker: Initialization complete");

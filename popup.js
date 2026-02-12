// ==========================================
// DOM ELEMENTS
// ==========================================

const statusText = document.getElementById("status");
const pauseHomeBtn = document.getElementById("pauseHomeBtn");
const pauseSubsBtn = document.getElementById("pauseSubsBtn");
const pauseSearchBtn = document.getElementById("pauseSearchBtn");
const toggleRecommendationsBtn = document.getElementById(
  "toggleRecommendationsBtn",
);
const recommendationStatus = document.getElementById("recommendationStatus");
const siteInput = document.getElementById("siteInput");
const addSiteBtn = document.getElementById("addSiteBtn");
const blockedSitesList = document.getElementById("blockedSitesList");
const pauseSiteBlockerBtn = document.getElementById("pauseSiteBlockerBtn");
const siteBlockerStatus = document.getElementById("siteBlockerStatus");

console.log("🎨 Popup loaded");

// ==========================================
// YOUTUBE SHORTS BLOCKER - Section-Specific
// ==========================================

/**
 * Load pause configuration from storage
 */
async function loadPauseConfig() {
  try {
    const result = await chrome.storage.local.get("shortsPauseConfig");
    return (
      result.shortsPauseConfig || {
        home: false,
        subscriptions: false,
        search: false,
      }
    );
  } catch (error) {
    console.error("Error loading pause config:", error);
    return { home: false, subscriptions: false, search: false };
  }
}

/**
 * Update UI for a sepcific section pause button
 */
function updatePauseButtonUI(section, isPaused) {
  let button;
  if (section === "home") button = pauseHomeBtn;
  else if (section === "subscriptions") button = pauseSubsBtn;
  else if (section === "search") button = pauseSearchBtn;

  if (button) {
    button.textContent = isPaused ? "▶️" : "⏸️";
    if (isPaused) {
      button.classList.add("paused");
    } else {
      button.classList.remove("paused");
    }
  }
}

/**
 * Update all pause buttons based on config
 */
async function updateAllPauseButtons() {
  const config = await loadPauseConfig();
  updatePauseButtonUI("home", config.home);
  updatePauseButtonUI("subscriptions", config.subscriptions);
  updatePauseButtonUI("search", config.search);
}

/**
 * Update Shorts UI - simplified for button-only interface
 */
function updateShortsUI() {
  statusText.textContent = "Toggle sections to control Shorts blocking";
}

/**
 * Toggle pause for a specific section
 */
async function toggleSectionPause(section) {
  try {
    const config = await loadPauseConfig();
    const newPauseState = !config[section];

    console.log(
      `Toggling ${section} from ${config[section]} to ${newPauseState}`,
    );

    config[section] = newPauseState;
    await chrome.storage.local.set({ shortsPauseConfig: config });

    updatePauseButtonUI(section, newPauseState);

    // Send message to content scripts
    const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: "updatePauseConfig",
          config: config,
        });
        console.log("Pause config sent to tab:", tab.id);
      } catch (err) {
        console.log("Could not message tab", tab.id, "- reloading instead");
        await chrome.tabs.reload(tab.id);
      }
    }

    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    statusText.textContent = newPauseState
      ? `${sectionName}: Shorts unblocked`
      : `${sectionName}: Shorts blocked`;
  } catch (error) {
    console.error("Error toggling section pause:", error);
    statusText.textContent = "Error: " + error.message;
  }
}
// Event listeners for section buttons
pauseHomeBtn.addEventListener("click", () => toggleSectionPause("home"));
pauseSubsBtn.addEventListener("click", () =>
  toggleSectionPause("subscriptions"),
);
pauseSearchBtn.addEventListener("click", () => toggleSectionPause("search"));

// ==========================================
// YOUTUBE RECOMMENDATION HIDING
// ==========================================

/**
 * Load recommendation hiding state from storage
 */
async function loadRecommendationState() {
  try {
    const result = await chrome.storage.local.get("hideRecommendations");
    return result.hideRecommendations || false;
  } catch (error) {
    console.error("Error loading recommendation state:", error);
    return false;
  }
}

/**
 * Update recommendation UI based on state
 */
function updateRecommendationUI(isHidden) {
  if (isHidden) {
    toggleRecommendationsBtn.textContent = "▶️ Show Recommendations";
    toggleRecommendationsBtn.classList.add("active");
    recommendationStatus.textContent = "Recommendations are hidden";
  } else {
    toggleRecommendationsBtn.textContent = "🚫 Hide Recommendations";
    toggleRecommendationsBtn.classList.remove("active");
    recommendationStatus.textContent = "Recommendations are visible";
  }
}

/**
 * Toggle recommendation hiding
 */
async function toggleRecommendations() {
  try {
    const currentState = await loadRecommendationState();
    const newState = !currentState;

    console.log(`Toggling recommendations from ${currentState} to ${newState}`);

    await chrome.storage.local.set({ hideRecommendations: newState });
    updateRecommendationUI(newState);

    // Send message to YouTube tabs
    const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: "toggleRecommendations",
          enabled: newState,
        });
        console.log("Recommendation toggle sent to tab:", tab.id);
      } catch (err) {
        console.log("Could not message tab", tab.id, "- will apply on reload");
      }
    }
  } catch (error) {
    console.error("Error toggling recommendations:", error);
    recommendationStatus.textContent = "Error: " + error.message;
  }
}

// Event listener for recommendation toggle
toggleRecommendationsBtn.addEventListener("click", toggleRecommendations);

// ==========================================
// CUSTOM SITE BLOCKER
// ==========================================

/**
 * Normalize domain input
 */
function normalizeDomain(input) {
  let domain = input.trim().toLowerCase();

  // Remove protocol
  domain = domain.replace(/^https?:\/\//, "");

  // Remove www
  domain = domain.replace(/^www\./, "");

  // Remove trailing slash and path
  domain = domain.split("/")[0];

  // Remove port
  domain = domain.split(":")[0];

  return domain;
}

/**
 * Validate domain
 */
function isValidDomain(domain) {
  // Basic domain validation
  const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
  return domainRegex.test(domain);
}

/**
 * Get blocked sites from storage
 */
async function getBlockedSites() {
  try {
    const result = await chrome.storage.local.get("blockedSites");
    return result.blockedSites || [];
  } catch (error) {
    console.error("Error getting blocked sites:", error);
    return [];
  }
}

/**
 * Save blocked sites to storage
 */
async function saveBlockedSites(sites) {
  try {
    await chrome.storage.local.set({ blockedSites: sites });
    return true;
  } catch (error) {
    console.error("Error saving blocked sites:", error);
    return false;
  }
}

/**
 * Add a site to the blocked list
 */
async function addBlockedSite() {
  const input = siteInput.value;

  if (!input) {
    siteInput.classList.add("error");
    setTimeout(() => siteInput.classList.remove("error"), 300);
    return;
  }

  const domain = normalizeDomain(input);

  if (!isValidDomain(domain)) {
    siteInput.classList.add("error");
    siteInput.value = "";
    siteInput.placeholder = "Invalid domain! Try again...";
    setTimeout(() => {
      siteInput.classList.remove("error");
      siteInput.placeholder = "e.g., facebook.com";
    }, 2000);
    return;
  }

  const blockedSites = await getBlockedSites();

  if (blockedSites.includes(domain)) {
    siteInput.value = "";
    siteInput.placeholder = "Already blocked!";
    setTimeout(() => {
      siteInput.placeholder = "e.g., facebook.com";
    }, 2000);
    return;
  }

  blockedSites.push(domain);
  await saveBlockedSites(blockedSites);

  siteInput.value = "";
  siteInput.placeholder = "✓ Added!";
  setTimeout(() => {
    siteInput.placeholder = "e.g., facebook.com";
  }, 1500);

  renderBlockedSites();
}

/**
 * Remove a site from the blocked list
 */
async function removeBlockedSite(domain) {
  const blockedSites = await getBlockedSites();
  const updatedSites = blockedSites.filter((site) => site !== domain);
  await saveBlockedSites(updatedSites);
  renderBlockedSites();
}

/**
 * Render the blocked sites list
 */
async function renderBlockedSites() {
  const blockedSites = await getBlockedSites();

  if (blockedSites.length === 0) {
    blockedSitesList.innerHTML =
      '<p class="empty-state">No blocked sites yet</p>';
    await updateSiteBlockerPauseUI();
    return;
  }

  blockedSitesList.innerHTML = blockedSites
    .map(
      (site) => `
      <div class="blocked-item">
        <span class="blocked-domain">${site}</span>
        <button class="remove-btn" data-domain="${site}">×</button>
      </div>
    `,
    )
    .join("");

  // Add event listeners to remove buttons
  const removeButtons = blockedSitesList.querySelectorAll(".remove-btn");
  removeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const domain = btn.getAttribute("data-domain");
      removeBlockedSite(domain);
    });
  });

  // Update pause button visibility
  await updateSiteBlockerPauseUI();
}

// Event listeners
addSiteBtn.addEventListener("click", addBlockedSite);
siteInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addBlockedSite();
  }
});

// ==========================================
// SITE BLOCKER PAUSE FUNCTIONALITY
// ==========================================

/**
 * Check and update site blocker pause state
 */
async function updateSiteBlockerPauseUI() {
  try {
    const result = await chrome.storage.local.get("siteBlockerPaused");
    const isPaused = result.siteBlockerPaused || false;
    const blockedSites = await getBlockedSites();

    if (blockedSites.length > 0) {
      pauseSiteBlockerBtn.style.display = "block";
      if (isPaused) {
        pauseSiteBlockerBtn.textContent = "▶️ Resume Blocking";
        pauseSiteBlockerBtn.classList.add("paused");
        siteBlockerStatus.textContent = "Site blocking is PAUSED";
        siteBlockerStatus.style.display = "block";
      } else {
        pauseSiteBlockerBtn.textContent = "⏸️ Pause Blocking";
        pauseSiteBlockerBtn.classList.remove("paused");
        siteBlockerStatus.textContent = "Site blocking is active";
        siteBlockerStatus.style.display = "block";
      }
    } else {
      pauseSiteBlockerBtn.style.display = "none";
      siteBlockerStatus.style.display = "none";
    }
  } catch (error) {
    console.error("Error updating site blocker UI:", error);
  }
}

/**
 * Toggle pause state for site blocker
 */
async function toggleSiteBlockerPause() {
  try {
    const result = await chrome.storage.local.get("siteBlockerPaused");
    const isPaused = result.siteBlockerPaused || false;
    const newPauseState = !isPaused;

    console.log(
      "Toggling site blocker pause from",
      isPaused,
      "to",
      newPauseState,
    );

    await chrome.storage.local.set({ siteBlockerPaused: newPauseState });
    await updateSiteBlockerPauseUI();
  } catch (error) {
    console.error("Error toggling site blocker pause:", error);
  }
}

pauseSiteBlockerBtn.addEventListener("click", toggleSiteBlockerPause);

// ==========================================
// INITIALIZATION
// ==========================================

async function initialize() {
  // Ensure Shorts blocking is enabled by default
  const result = await chrome.storage.local.get("blockShorts");
  if (result.blockShorts === undefined) {
    await chrome.storage.local.set({ blockShorts: true });
    console.log("✅ Initialized blockShorts to true");
  }

  updateShortsUI();
  await updateAllPauseButtons();
  await renderBlockedSites();
  await updateSiteBlockerPauseUI();

  // Initialize recommendation hiding UI
  const hideRecommendations = await loadRecommendationState();
  updateRecommendationUI(hideRecommendations);
}

initialize();

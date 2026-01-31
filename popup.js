// ==========================================
// DOM ELEMENTS
// ==========================================

const toggleBtn = document.getElementById("toggleBtn");
const btnText = document.getElementById("btnText");
const statusText = document.getElementById("status");
const siteInput = document.getElementById("siteInput");
const addSiteBtn = document.getElementById("addSiteBtn");
const blockedSitesList = document.getElementById("blockedSitesList");

console.log("🎨 Popup loaded");

// ==========================================
// YOUTUBE SHORTS BLOCKER
// ==========================================

async function checkBlockingState() {
  try {
    const result = await chrome.storage.local.get("blockShorts");
    const isBlocking = result.blockShorts || false;
    console.log("Current blocking state:", isBlocking);
    updateShortsUI(isBlocking);
    return isBlocking;
  } catch (error) {
    console.error("Error checking state:", error);
    statusText.textContent = "Error loading state";
    return false;
  }
}

function updateShortsUI(isBlocking) {
  if (isBlocking) {
    toggleBtn.classList.add("enabled");
    toggleBtn.classList.remove("disabled");
    btnText.textContent = "✓ Shorts Blocked";
    statusText.textContent = "YouTube Shorts are being blocked";
  } else {
    toggleBtn.classList.add("disabled");
    toggleBtn.classList.remove("enabled");
    btnText.textContent = "✗ Shorts Allowed";
    statusText.textContent = "YouTube Shorts are visible";
  }
}

async function toggleBlocking() {
  try {
    const currentState = await checkBlockingState();
    const newState = !currentState;

    console.log("Toggling from", currentState, "to", newState);

    await chrome.storage.local.set({ blockShorts: newState });
    updateShortsUI(newState);

    const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
    console.log("Found YouTube tabs:", tabs.length);

    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: "toggleShorts",
          enabled: newState,
        });
        console.log("Message sent to tab:", tab.id);
      } catch (err) {
        console.log("Could not message tab", tab.id, "- reloading instead");
        await chrome.tabs.reload(tab.id);
      }
    }

    if (tabs.length === 0) {
      statusText.textContent = newState
        ? "Enabled! Open YouTube to see it work."
        : "Disabled!";
    }
  } catch (error) {
    console.error("Error toggling:", error);
    statusText.textContent = "Error: " + error.message;
  }
}

toggleBtn.addEventListener("click", toggleBlocking);

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
}

// Event listeners
addSiteBtn.addEventListener("click", addBlockedSite);
siteInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addBlockedSite();
  }
});

// ==========================================
// INITIALIZATION
// ==========================================

async function initialize() {
  await checkBlockingState();
  await renderBlockedSites();
}

initialize();

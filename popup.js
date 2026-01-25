// Get DOM elements
const toggleBtn = document.getElementById("toggleBtn");
const btnText = document.getElementById("btnText");
const statusText = document.getElementById("status");

console.log("🎨 Popup loaded");

// Check current blocking state
async function checkBlockingState() {
  try {
    const result = await chrome.storage.local.get("blockShorts");
    const isBlocking = result.blockShorts || false;
    console.log("Current blocking state:", isBlocking);
    updateUI(isBlocking);
    return isBlocking;
  } catch (error) {
    console.error("Error checking state:", error);
    statusText.textContent = "Error loading state";
    return false;
  }
}

// Update UI based on blocking state
function updateUI(isBlocking) {
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

// Toggle blocking state
async function toggleBlocking() {
  try {
    const currentState = await checkBlockingState();
    const newState = !currentState;

    console.log("Toggling from", currentState, "to", newState);

    // Save new state
    await chrome.storage.local.set({ blockShorts: newState });

    // Update UI
    updateUI(newState);

    // Notify all YouTube tabs
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
        // Content script might not be loaded, reload the tab
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

// Event listeners
toggleBtn.addEventListener("click", toggleBlocking);

// Initialize
checkBlockingState();

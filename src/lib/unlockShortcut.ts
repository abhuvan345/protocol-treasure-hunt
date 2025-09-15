// Global keyboard shortcut for system unlock
// This runs independently of React components

let keySequence = "";
const UNLOCK_CODE = "unlock2024";

function initializeUnlockShortcut() {
  // Check if already initialized
  if ((window as any).__wrenUnlockInitialized) {
    console.log("🔑 Unlock shortcut already initialized");
    return;
  }

  console.log("🚀 Initializing global unlock shortcut");

  const handleKeyDown = (e: KeyboardEvent) => {
    // Only work when system is locked
    const systemLocked = localStorage.getItem("wren-manor-system-completed");
    if (systemLocked !== "true") {
      return;
    }

    const key = e.key.toLowerCase();
    keySequence += key;

    console.log(`🎹 Unlock Key: ${key} | Sequence: "${keySequence}"`);

    // Check for unlock sequence
    if (keySequence.includes(UNLOCK_CODE)) {
      console.log("🎯 UNLOCK SEQUENCE DETECTED!");

      // Import the utility to handle any active timers before unlocking
      import('./gameExit').then(module => {
        const { handleSystemLock } = module;
        // Stop any running timers before unlocking the system
        handleSystemLock().then(() => {
          // Unlock the system
          localStorage.removeItem("wren-manor-system-completed");
          keySequence = "";

          // Show immediate feedback
          alert("🔓 System Unlocked!\nCoordinator access granted.");

          // Reload page
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });
      }).catch(error => {
        console.error("Error handling timer before unlock:", error);
        
        // Fallback - continue with unlock even if timer handling fails
        localStorage.removeItem("wren-manor-system-completed");
        keySequence = "";
        alert("🔓 System Unlocked!\nCoordinator access granted.");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });

      return;
    }

    // Keep sequence manageable
    if (keySequence.length > 30) {
      keySequence = keySequence.slice(-15);
      console.log(`✂️ Sequence trimmed to: "${keySequence}"`);
    }
  };

  // Attach to document only to avoid duplicate events
  document.addEventListener("keydown", handleKeyDown, { capture: true, passive: true });

  // Mark as initialized
  (window as any).__wrenUnlockInitialized = true;
  (window as any).__wrenUnlockHandler = handleKeyDown;

  console.log("✅ Global unlock shortcut ready! Type 'unlock2024' to unlock system.");
}

// Auto-initialize when script loads
if (typeof window !== "undefined") {
  // Initialize immediately
  initializeUnlockShortcut();

  // Also initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeUnlockShortcut);
  }
}

export { initializeUnlockShortcut };
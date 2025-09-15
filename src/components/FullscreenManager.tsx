import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FullscreenManagerProps {
  children: React.ReactNode;
}

const FullscreenManager = ({ children }: FullscreenManagerProps) => {
  const { toast } = useToast();
  const [warningGiven, setWarningGiven] = useState(false);
  const [gameExited, setGameExited] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [systemLocked, setSystemLocked] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);

  // Function to start fullscreen mode when game begins
  const startFullscreenMode = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setGameStarted(true);
      localStorage.setItem("wren-manor-game-session", "active");
    } catch (err) {
      console.warn("Could not enter fullscreen mode:", err);
    }
  };

  // Expose function globally for Home component to call
  useEffect(() => {
    (window as any).startFullscreenMode = startFullscreenMode;
    return () => {
      delete (window as any).startFullscreenMode;
    };
  }, []);

  // Function to handle returning to fullscreen mode
  const returnToFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setShowFullscreenPrompt(false);
      }
    } catch (err) {
      console.warn("Could not re-enter fullscreen mode:", err);
    }
  };

  useEffect(() => {
    // Check if game has been completed on this system or if system is locked
    const checkSystemLock = () => {
      const gameCompleted = localStorage.getItem("wren-manor-system-completed");
      const gameInProgress = localStorage.getItem("wren-manor-game-session");

      if (gameCompleted === "true") {
        setSystemLocked(true);
        return true;
      }

      // Check if there's an active game session from current path
      const currentPath = window.location.pathname;
      if (
        gameInProgress &&
        currentPath !== "/" &&
        currentPath !== "/leaderboard"
      ) {
        setGameStarted(true);
      }

      return false;
    };

    const isLocked = checkSystemLock();
    if (isLocked) return;

    // Only add event listeners if game is started
    if (!gameStarted && window.location.pathname === "/") {
      return; // Don't add listeners on home page until game starts
    }

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden && gameStarted) {
        if (!warningGiven) {
          setWarningGiven(true);
          toast({
            title: "⚠️ Warning!",
            description:
              "Please stay focused on the game. Next tab switch will exit the game!",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          // Second violation - exit game
          setGameExited(true);
          toast({
            title: "🚫 Game Exited",
            description:
              "You have been removed from the game for tab switching.",
            variant: "destructive",
            duration: 10000,
          });

          // Clear game data and redirect
          setTimeout(async () => {
            // Import dynamically to avoid circular dependencies
            const { handleSystemLock } = await import("@/lib/gameExit");

            // Stop the timer before locking the system
            await handleSystemLock();

            // Lock the system
            localStorage.setItem("wren-manor-system-completed", "true");
            localStorage.removeItem("wren-manor-player");
            localStorage.removeItem("wren-manor-game-session");
            // Don't clear all localStorage to preserve system lock
            window.location.href = "/";
          }, 3000);
        }
      }
    };

    // Handle fullscreen exit
    const handleFullscreenChange = () => {
      // If we've exited fullscreen and the game is active
      if (!document.fullscreenElement && gameStarted) {
        // Show the fullscreen prompt
        setShowFullscreenPrompt(true);

        if (!warningGiven) {
          setWarningGiven(true);
          toast({
            title: "🔒 Fullscreen Required",
            description:
              "Please click the button to return to fullscreen mode.",
            variant: "default",
            duration: 5000,
          });
        } else {
          toast({
            title: "🔒 Stay Focused",
            description:
              "Please return to fullscreen mode to continue your investigation.",
            variant: "default",
            duration: 3000,
          });
        }
      }
      // If we're back in fullscreen mode, hide the prompt
      else if (document.fullscreenElement) {
        setShowFullscreenPrompt(false);
      }
    };

    // Handle keyboard shortcuts (prevent common shortcuts)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) return;

      // Try to prevent Escape key from exiting fullscreen mode
      // and show a prompt if it does exit
      if (e.key === "Escape" && document.fullscreenElement) {
        e.preventDefault();
        e.stopPropagation();

        // Show a toast message immediately
        toast({
          title: "🔒 Stay Focused",
          description: "Press the button to remain in fullscreen mode.",
          variant: "default",
          duration: 3000,
        });

        // We need to handle the case where the escape key still exits fullscreen
        // despite our efforts to prevent it (happens in many browsers)
        setTimeout(() => {
          if (!document.fullscreenElement) {
            // If fullscreen was exited, show our manual re-enter prompt
            setShowFullscreenPrompt(true);
          }
        }, 100);

        return; // Exit early to prevent any other handling
      }

      // Prevent Alt+Tab, Ctrl+T, Ctrl+W, Ctrl+N, etc.
      if (
        (e.altKey && e.key === "Tab") ||
        (e.ctrlKey && (e.key === "t" || e.key === "T")) ||
        (e.ctrlKey && (e.key === "w" || e.key === "W")) ||
        (e.ctrlKey && (e.key === "n" || e.key === "N")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "t" || e.key === "T")) ||
        e.key === "F11"
      ) {
        e.preventDefault();

        if (!warningGiven) {
          setWarningGiven(true);
          toast({
            title: "⚠️ Warning!",
            description:
              "Keyboard shortcuts are disabled during the game. Next attempt will exit the game!",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          setGameExited(true);
          toast({
            title: "🚫 Game Exited",
            description:
              "You have been removed from the game for using forbidden shortcuts.",
            variant: "destructive",
            duration: 10000,
          });

          setTimeout(async () => {
            // Import dynamically to avoid circular dependencies
            const { handleSystemLock } = await import("@/lib/gameExit");

            // Stop the timer before locking the system
            await handleSystemLock();

            // Lock the system
            localStorage.setItem("wren-manor-system-completed", "true");
            localStorage.removeItem("wren-manor-player");
            localStorage.removeItem("wren-manor-game-session");
            // Don't clear all localStorage to preserve system lock
            window.location.href = "/";
          }, 3000);
        }
      }
    };

    // Add event listeners only when game is active
    if (gameStarted) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      // Use capture phase for keydown to ensure we catch escape before other handlers
      document.addEventListener("keydown", handleKeyDown, true);
    }

    // Cleanup event listeners
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [warningGiven, toast, gameStarted]);

  // Show system locked screen
  if (systemLocked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-red-400">System Locked</h1>
          <p className="text-lg text-gray-300">
            A game has already been completed on this system.
          </p>
          <p className="text-sm text-gray-400">
            Each system can only be used once to maintain game integrity.
          </p>
        </div>
      </div>
    );
  }

  // Show game exit screen
  if (gameExited) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-red-400">Game Exited</h1>
          <p className="text-lg text-gray-300">
            You have been removed from Wren Manor for violating game rules.
          </p>
          <p className="text-sm text-gray-400">
            The investigation requires your full attention. This system is now
            locked.
          </p>
          <div className="animate-pulse text-sm text-gray-500">
            Redirecting to home page...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}

      {/* Fullscreen Prompt Overlay */}
      {showFullscreenPrompt && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <h2 style={{ marginBottom: "20px", fontSize: "24px" }}>
            Return to Fullscreen Mode
          </h2>
          <p style={{ marginBottom: "30px", fontSize: "16px" }}>
            You must remain in fullscreen mode to continue your investigation.
          </p>
          <button
            onClick={returnToFullscreen}
            style={{
              padding: "12px 24px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Continue in Fullscreen
          </button>
        </div>
      )}
    </>
  );
};

export default FullscreenManager;

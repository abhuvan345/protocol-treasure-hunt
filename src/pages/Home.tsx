import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  ManorCard,
  ManorCardContent,
  ManorCardDescription,
  ManorCardHeader,
  ManorCardTitle,
} from "@/components/ui/manor-card";
import { ManorButton } from "@/components/ui/manor-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skull, Crown, Users, Trophy, Clock, KeyRound } from "lucide-react";
import {
  getGameProgress,
  saveGameProgress,
  type GameProgress,
} from "@/lib/gameState";
import { useToast } from "@/hooks/use-toast";
import { useGameExitHandler } from "@/hooks/use-game-exit";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [playerName, setPlayerName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  // PIN unlock states (keeping for compatibility)
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const COORDINATOR_PIN = "2024";

  // Keyboard shortcut sequence tracking
  const [keySequence, setKeySequence] = useState("");

  const handleUnlock = () => {
    if (pin === COORDINATOR_PIN) {
      setIsUnlocking(true);

      // Import the utility to handle any active timers before unlocking
      import("@/lib/gameExit")
        .then((module) => {
          const { handleSystemLock } = module;
          // Stop any running timers before unlocking the system
          handleSystemLock().then(() => {
            localStorage.removeItem("wren-manor-system-completed");
            toast({
              title: "🔓 System Unlocked",
              description:
                "The system has been unlocked by coordinator access.",
              duration: 3000,
            });
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          });
        })
        .catch(() => {
          // Fallback - continue with unlock even if timer handling fails
          localStorage.removeItem("wren-manor-system-completed");
          toast({
            title: "🔓 System Unlocked",
            description: "The system has been unlocked by coordinator access.",
            duration: 3000,
          });
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        });
    } else {
      toast({
        title: "❌ Invalid PIN",
        description: "The coordinator PIN is incorrect.",
        variant: "destructive",
        duration: 3000,
      });
      setPin("");
    }
  };

  useEffect(() => {
    const loadProgress = async () => {
      try {
        setIsLoading(true);

        // Check if system is locked first
        const systemCompleted = localStorage.getItem(
          "wren-manor-system-completed"
        );
        if (systemCompleted === "true") {
          // Don't load anything, just redirect or show message
          setIsLoading(false);
          return;
        }

        // Get stored player data if available
        const stored = localStorage.getItem("wren-manor-player");
        let storedPlayerName = "";
        let storedTeamId = "";

        if (stored) {
          const playerData = JSON.parse(stored);
          storedPlayerName = playerData.playerName || "";
          storedTeamId = playerData.teamId || "";
        }

        if (storedPlayerName && storedTeamId) {
          const existingProgress = await getGameProgress(
            storedPlayerName,
            storedTeamId
          );
          setProgress(existingProgress);
          setPlayerName(existingProgress.playerName || storedPlayerName);
          setTeamId(existingProgress.teamId || storedTeamId);
        } else {
          const defaultProgress = await getGameProgress("", "");
          setProgress(defaultProgress);
        }
      } catch (error) {
        console.error("Error loading progress:", error);
        const defaultProgress: GameProgress = {
          p1: false,
          p2: false,
          p3: false,
          p4: false,
          p5: false,
          p6: false,
          p7: false,
          p8: false,
          p9: false,
          weapon: "",
          killer: "",
          currentPage: 0,
          startTime: Date.now(),
          playerName: "",
          teamId: "",
        };
        setProgress(defaultProgress);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, []);

  // Use our custom hook to handle game exit
  useGameExitHandler(progress);

  // Initialize global keyboard shortcut once
  useEffect(() => {
    const systemCompleted = localStorage.getItem("wren-manor-system-completed");
    if (systemCompleted !== "true") {
      console.log("🔑 System not locked, keyboard listener disabled");
      return;
    }

    console.log("🔑 Setting up global keyboard listener for unlock sequence");

    // Simple global listener
    let sequence = "";
    const TARGET = "unlock2024";

    const keyHandler = (event: KeyboardEvent) => {
      console.log(`🎹 Key detected: ${event.key} (Code: ${event.code})`);

      sequence += event.key.toLowerCase();
      console.log(`📝 Current sequence: "${sequence}"`);

      if (sequence.includes(TARGET)) {
        console.log("🎯 UNLOCK SEQUENCE MATCHED!");

        // Unlock the system
        localStorage.removeItem("wren-manor-system-completed");
        toast({
          title: "� System Unlocked",
          description: "Coordinator access granted!",
          duration: 3000,
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);

        sequence = ""; // Reset
        return;
      }

      // Keep sequence manageable
      if (sequence.length > 20) {
        sequence = sequence.slice(-10);
        console.log(`✂️ Sequence trimmed to: "${sequence}"`);
      }
    };

    // Attach to both document and window for maximum coverage
    document.addEventListener("keydown", keyHandler, true);
    window.addEventListener("keydown", keyHandler, true);

    console.log(
      "✅ Global keyboard listeners attached. Type 'unlock2024' anywhere on the page."
    );

    // Cleanup
    return () => {
      document.removeEventListener("keydown", keyHandler, true);
      window.removeEventListener("keydown", keyHandler, true);
      console.log("🧹 Keyboard listeners removed");
    };
  }, []);

  const handleStartGame = async () => {
    if (!playerName.trim() || !teamId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both your name and team ID to begin.",
        variant: "destructive",
      });
      return;
    }

    // Check if system is already locked
    const systemCompleted = localStorage.getItem("wren-manor-system-completed");
    if (systemCompleted === "true") {
      toast({
        title: "System Locked",
        description:
          "This system has already been used to complete a game. Please try from a different device.",
        variant: "destructive",
      });
      return;
    }

    setIsStarting(true);

    try {
      const newProgress: GameProgress = {
        ...(progress || {
          p1: false,
          p2: false,
          p3: false,
          p4: false,
          p5: false,
          p6: false,
          p7: false,
          p8: false,
          p9: false,
          weapon: "",
          killer: "",
          currentPage: 0,
          startTime: Date.now(),
        }),
        playerName: playerName.trim(),
        teamId: teamId.trim().toUpperCase(),
        startTime: Date.now(), // Always start the timer when Begin Investigation is clicked
      };

      await saveGameProgress(newProgress);
      setProgress(newProgress);

      // Store player info for puzzle pages
      localStorage.setItem(
        "wren-manor-player",
        JSON.stringify({
          playerName: playerName.trim(),
          teamId: teamId.trim().toUpperCase(),
        })
      );

      // Start fullscreen mode before navigation
      if ((window as any).startFullscreenMode) {
        await (window as any).startFullscreenMode();
      }

      // Dramatic pause before navigation
      setTimeout(() => {
        navigate("/puzzle-1");
      }, 1000);
    } catch (error) {
      console.error("Error starting game:", error);
      setIsStarting(false);
      toast({
        title: "Error",
        description: "Failed to start the game. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleContinueGame = async () => {
    if (!progress) return;

    // Check if system is locked
    const systemCompleted = localStorage.getItem("wren-manor-system-completed");
    if (systemCompleted === "true") {
      toast({
        title: "System Locked",
        description:
          "This system has already been used to complete a game. Please try from a different device.",
        variant: "destructive",
      });
      return;
    }

    // If this is the first time continuing (startTime is 0), set the startTime to now
    if (progress.startTime === 0) {
      const updatedProgress = {
        ...progress,
        startTime: Date.now(),
      };
      await saveGameProgress(updatedProgress);
      setProgress(updatedProgress);
    }

    if (progress.p9) {
      navigate("/results");
    } else if (progress.p8) {
      navigate("/puzzle-9");
    } else if (progress.p7) {
      navigate("/puzzle-8");
    } else if (progress.p6) {
      navigate("/puzzle-7");
    } else if (progress.p5) {
      navigate("/puzzle-6");
    } else if (progress.p4) {
      navigate("/puzzle-5");
    } else if (progress.p3) {
      navigate("/puzzle-4");
    } else if (progress.p2) {
      navigate("/puzzle-3");
    } else if (progress.p1) {
      navigate("/puzzle-2");
    } else {
      navigate("/puzzle-1");
    }
  };
  if (isLoading) {
    return (
      <Layout showProgress={false}>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if system is locked and show appropriate message
  const systemCompleted = localStorage.getItem("wren-manor-system-completed");
  if (systemCompleted === "true") {
    // No need to redefine these state variables as they are already defined at component level

    const handleUnlock = () => {
      if (pin === COORDINATOR_PIN) {
        setIsUnlocking(true);
        localStorage.removeItem("wren-manor-system-completed");
        toast({
          title: "🔓 System Unlocked",
          description: "The system has been unlocked by coordinator access.",
          duration: 3000,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "❌ Invalid PIN",
          description: "The coordinator PIN is incorrect.",
          variant: "destructive",
          duration: 3000,
        });
        setPin("");
      }
    };

    return (
      <Layout showProgress={false}>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold text-red-400">System Locked</h1>
            <p className="text-lg text-muted-foreground">
              A game has already been completed on this system.
            </p>
            <p className="text-sm text-muted-foreground">
              Each system can only be used once to maintain game integrity.
            </p>
            <p className="text-sm text-accent mt-4">
              Please try from a different device or browser.
            </p>

            {/* Subtle hint for coordinators */}
            <p className="text-xs text-muted-foreground/50 mt-6 font-mono">
              * Coordinator access available
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showProgress={false}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center items-center space-x-4 mb-8">
            <div className="relative">
              <Skull className="h-16 w-16 text-primary animate-pulse-blood" />
              <Crown className="h-8 w-8 text-accent absolute -top-2 -right-2 animate-glow" />
            </div>
          </div>

          <h1 className="font-mystery text-5xl md:text-7xl font-bold text-foreground mb-4">
            Ashcroft Estate
          </h1>
          <h2 className="font-mystery text-2xl md:text-3xl text-primary mb-6">
            The Dark Secret of Lord Ashcroft
          </h2>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Lord Ashcroft lies dead in his study, and the storm outside has
            trapped everyone within. The Butler swears trouble began before
            dinner, the Chef insists the quarrel was over wine choice, while
            Lady Ashcroft claims it was merely a husband's temper. But someone
            is lying. Piece together the timeline and uncover the truth in this
            deadly game of deception.
          </motion.p>
        </motion.div>

        {/* Game Entry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <ManorCard className="max-w-lg mx-auto">
            <ManorCardHeader className="text-center">
              <ManorCardTitle className="flex items-center justify-center space-x-2">
                <Users className="h-6 w-6 text-primary" />
                <span>Enter the Investigation</span>
              </ManorCardTitle>
              <ManorCardDescription>
                Join the investigation at Ashcroft Estate
              </ManorCardDescription>
            </ManorCardHeader>

            <ManorCardContent className="space-y-4">
              {progress?.playerName && progress?.teamId ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-sm text-muted-foreground">
                      Welcome back,
                    </p>
                    <p className="font-semibold text-foreground">
                      {progress.playerName}
                    </p>
                    <p className="text-sm text-accent">
                      Team: {progress.teamId}
                    </p>
                  </div>

                  {/* Progress Overview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress:</span>
                      <span className="text-primary font-medium">
                        {
                          [
                            progress.p1,
                            progress.p2,
                            progress.p3,
                            progress.p4,
                            progress.p5,
                            progress.p6,
                            progress.p7,
                            progress.p8,
                            progress.p9,
                          ].filter(Boolean).length
                        }
                        /9 Puzzles
                      </span>
                    </div>
                    <div className="w-full bg-muted/20 rounded-full h-2">
                      <div
                        className="bg-gradient-blood h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            ([
                              progress.p1,
                              progress.p2,
                              progress.p3,
                              progress.p4,
                              progress.p5,
                              progress.p6,
                              progress.p7,
                              progress.p8,
                              progress.p9,
                            ].filter(Boolean).length /
                              9) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <ManorButton
                    onClick={handleContinueGame}
                    className="w-full"
                    size="lg"
                  >
                    Continue Investigation
                  </ManorButton>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="playerName"
                      className="text-foreground font-manor"
                    >
                      Investigator Name
                    </Label>
                    <Input
                      id="playerName"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your name"
                      className="bg-input/50 border-border focus:border-primary"
                      disabled={isStarting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="teamId"
                      className="text-foreground font-manor"
                    >
                      Team ID
                    </Label>
                    <Input
                      id="teamId"
                      value={teamId}
                      onChange={(e) => setTeamId(e.target.value.toUpperCase())}
                      placeholder="Enter your team ID"
                      className="bg-input/50 border-border focus:border-primary"
                      disabled={isStarting}
                    />
                  </div>

                  <ManorButton
                    onClick={handleStartGame}
                    disabled={isStarting}
                    className="w-full"
                    size="lg"
                  >
                    {isStarting
                      ? "Entering the Manor..."
                      : "Begin Investigation"}
                  </ManorButton>
                </div>
              )}
            </ManorCardContent>
          </ManorCard>
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <ManorCard className="text-center">
            <ManorCardHeader>
              <Crown className="h-12 w-12 text-accent mx-auto mb-2 animate-glow" />
              <ManorCardTitle className="text-lg">
                Nine Deadly Puzzles
              </ManorCardTitle>
            </ManorCardHeader>
            <ManorCardContent>
              <ManorCardDescription>
                Unscramble letters, reconstruct the fateful night, verify
                suspect alibis, and piece together the truth behind Lord
                Ashcroft's demise.
              </ManorCardDescription>
            </ManorCardContent>
          </ManorCard>

          <ManorCard className="text-center">
            <ManorCardHeader>
              <Trophy className="h-12 w-12 text-primary mx-auto mb-2 animate-pulse-blood" />
              <ManorCardTitle className="text-lg">
                Live Leaderboard
              </ManorCardTitle>
            </ManorCardHeader>
            <ManorCardContent>
              <ManorCardDescription>
                Watch other investigators' progress update instantly as they
                solve puzzles. Real-time competition with live rankings and
                progress tracking.
              </ManorCardDescription>
            </ManorCardContent>
          </ManorCard>

          <ManorCard className="text-center">
            <ManorCardHeader>
              <Clock className="h-12 w-12 text-accent mx-auto mb-2" />
              <ManorCardTitle className="text-lg">
                Race Against Time
              </ManorCardTitle>
            </ManorCardHeader>
            <ManorCardContent>
              <ManorCardDescription>
                Every second counts as you uncover the dark secrets hidden
                within Ashcroft Estate's walls.
              </ManorCardDescription>
            </ManorCardContent>
          </ManorCard>
        </motion.div>

        {/* Navigation */}
        <motion.div
          className="text-center space-x-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <ManorButton
            variant="secondary"
            onClick={() => navigate("/leaderboard")}
          >
            View Leaderboard
          </ManorButton>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Home;

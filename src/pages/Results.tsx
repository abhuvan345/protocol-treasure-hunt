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
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Skull,
  Clock,
  Users,
  Trophy,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { getGameProgress, resetGameProgress } from "@/lib/gameState";
import { Timer } from "@/components/Timer";
import { useGameExitHandler } from "@/hooks/use-game-exit";
import { isSystemLocked } from "@/lib/utils";

const Results = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load game progress
  useEffect(() => {
    const loadProgress = async () => {
      // Get player data from localStorage (same format as other puzzles)
      const stored = localStorage.getItem("wren-manor-player");
      let playerName = "";
      let teamId = "";

      if (stored) {
        const playerData = JSON.parse(stored);
        playerName = playerData.playerName || "";
        teamId = playerData.teamId || "";
      }

      if (!playerName || !teamId) {
        // Fallback to check individual items
        playerName = localStorage.getItem("playerName") || "";
        teamId = localStorage.getItem("teamId") || "";
      }

      if (!playerName || !teamId) {
        navigate("/");
        return;
      }

      const gameProgress = await getGameProgress(playerName, teamId);
      setProgress(gameProgress);
      setLoading(false);

      // Allow viewing results if at least puzzle 1 is completed
      if (!gameProgress.p1) {
        navigate("/");
        return;
      }

      // Mark system as completed if all puzzles are done
      const allPuzzlesCompleted = [
        gameProgress.p1,
        gameProgress.p2,
        gameProgress.p3,
        gameProgress.p4,
        gameProgress.p5,
        gameProgress.p6,
        gameProgress.p7,
        gameProgress.p8,
        gameProgress.p9,
      ].every(Boolean);

      if (allPuzzlesCompleted) {
        // Import the utility to stop the timer
        import("@/lib/gameExit").then((module) => {
          const { handleSystemLock } = module;
          // Stop the timer before locking the system
          handleSystemLock().then(() => {
            localStorage.setItem("wren-manor-system-completed", "true");
            localStorage.removeItem("wren-manor-game-session");
          });
        });
      }
    };

    loadProgress();
  }, [navigate]);

  const handlePlayAgain = async () => {
    if (progress?.playerName && progress?.teamId) {
      await resetGameProgress(progress.playerName, progress.teamId);
    }
    localStorage.removeItem("playerName");
    localStorage.removeItem("teamId");
    navigate("/");
  };

  const handleViewLeaderboard = () => {
    navigate("/leaderboard");
  };

  // Use our custom hook to handle game exit
  useGameExitHandler(progress);

  if (loading || !progress) {
    return null;
  }

  const completedPuzzles = [
    progress.p1,
    progress.p2,
    progress.p3,
    progress.p4,
    progress.p5,
    progress.p6,
    progress.p7,
    progress.p8,
    progress.p9,
  ].filter(Boolean).length;

  const totalPuzzles = 9;
  const allCompleted = completedPuzzles === totalPuzzles;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Victory Header */}
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center items-center space-x-4 mb-8">
            <div className="relative">
              <Crown className="h-20 w-20 text-accent animate-glow" />
              <Skull className="h-10 w-10 text-primary absolute bottom-0 right-0 animate-pulse-blood" />
            </div>
          </div>

          <Badge
            variant="outline"
            className="text-accent border-accent/30 bg-accent/10 text-lg px-4 py-2"
          >
            {allCompleted ? "Case Closed" : "Investigation In Progress"}
          </Badge>

          <h1 className="font-mystery text-5xl md:text-6xl font-bold text-foreground mb-4">
            {allCompleted ? "Mystery Solved!" : "Progress Report"}
          </h1>

          <motion.p
            className="text-xl text-accent max-w-2xl mx-auto leading-relaxed font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {allCompleted
              ? `Congratulations, Detective ${progress.playerName}! You have successfully unraveled the dark secrets of Wren Manor.`
              : `Detective ${progress.playerName}, you have completed ${completedPuzzles} of ${totalPuzzles} investigations. Continue your work to solve the mystery.`}
          </motion.p>
        </motion.div>

        {/* Investigation Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <ManorCard className="border-primary/20 shadow-blood">
            <ManorCardHeader className="text-center">
              <ManorCardTitle className="text-2xl flex items-center justify-center space-x-2 font-detective">
                <Skull className="h-8 w-8 text-primary" />
                <span>Investigation Summary</span>
              </ManorCardTitle>
              <ManorCardDescription>
                Your complete findings from the Wren Manor investigation
              </ManorCardDescription>
            </ManorCardHeader>

            <ManorCardContent className="space-y-6">
              {/* Progress Overview */}
              <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-lg mb-6">
                <h3 className="font-detective font-semibold text-foreground mb-2">
                  Investigation Progress
                </h3>
                <div className="text-3xl font-bold text-primary">
                  {completedPuzzles} / {totalPuzzles}
                </div>
                <p className="text-sm text-muted-foreground">
                  Puzzles Completed
                </p>
              </div>

              {/* Evidence Collected */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="text-2xl mb-2">🗡️</div>
                  <h3 className="font-detective font-semibold text-foreground mb-1">
                    Murder Weapon
                  </h3>
                  <p className="text-primary font-bold">
                    {progress.weapon || "Unknown"}
                  </p>
                  {progress.p1 && (
                    <Badge
                      variant="outline"
                      className="mt-2 text-green-500 border-green-500/30"
                    >
                      ✓ Identified
                    </Badge>
                  )}
                </div>

                <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="text-2xl mb-2">🧠</div>
                  <h3 className="font-detective font-semibold text-foreground mb-1">
                    Killer Identity
                  </h3>
                  <p className="text-primary font-bold">
                    {progress.killer || "Unknown"}
                  </p>
                  {progress.p4 && (
                    <Badge
                      variant="outline"
                      className="mt-2 text-green-500 border-green-500/30"
                    >
                      ✓ Deduced
                    </Badge>
                  )}
                </div>

                <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="text-2xl mb-2">📋</div>
                  <h3 className="font-detective font-semibold text-foreground mb-1">
                    Case Status
                  </h3>
                  <p className="text-primary font-bold">
                    {allCompleted ? "Solved" : "Ongoing"}
                  </p>
                  {allCompleted && (
                    <Badge
                      variant="outline"
                      className="mt-2 text-green-500 border-green-500/30"
                    >
                      ✓ Complete
                    </Badge>
                  )}
                </div>
              </div>

              {/* Puzzle Status Grid */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { key: "p1", label: "Weapon", icon: "🗡️" },
                  { key: "p2", label: "Timeline", icon: "⏰" },
                  { key: "p3", label: "Alibis", icon: "👥" },
                  { key: "p4", label: "Logic", icon: "🧠" },
                  { key: "p5", label: "Cipher", icon: "🔐" },
                  { key: "p6", label: "Evidence", icon: "🔍" },
                  { key: "p7", label: "Verdict", icon: "⚖️" },
                  { key: "p8", label: "Inspect", icon: "🕵️" },
                  { key: "p9", label: "Final", icon: "🎯" },
                ].map((puzzle, index) => (
                  <motion.div
                    key={puzzle.key}
                    className={`text-center p-3 rounded-lg border transition-all ${
                      progress[puzzle.key as keyof typeof progress]
                        ? "bg-green-500/10 border-green-500/30 shadow-green-500/20 shadow-lg"
                        : "bg-muted/10 border-border"
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-lg mb-1">{puzzle.icon}</div>
                    <div className="text-xs font-medium text-foreground">
                      {puzzle.label}
                    </div>
                    {progress[puzzle.key as keyof typeof progress] && (
                      <motion.div
                        className="text-green-500 text-xs mt-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.8 + index * 0.1,
                          type: "spring",
                          stiffness: 200,
                        }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Final Deduction - Only show if case is complete */}
              {allCompleted && (
                <motion.div
                  className="p-6 bg-gradient-blood/10 border border-primary/30 rounded-lg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5, duration: 0.6 }}
                >
                  <h3 className="font-detective text-xl font-semibold text-foreground mb-3 text-center">
                    🎯 Final Deduction 🎯
                  </h3>
                  <p className="text-muted-foreground leading-relaxed font-body text-center mb-4">
                    Through meticulous investigation across nine challenging
                    puzzles, you have solved the murder at Wren Manor.{" "}
                    <strong className="text-primary">Marcel the Chef</strong>{" "}
                    committed the crime using a{" "}
                    <strong className="text-primary">dagger</strong> in the{" "}
                    <strong className="text-primary">wine cellar</strong>,
                    driven by greed and blackmail after receiving suspicious
                    payments.
                  </p>
                  <div className="text-center">
                    <Badge className="bg-primary text-primary-foreground px-4 py-2">
                      🏆 Master Detective Achievement Unlocked 🏆
                    </Badge>
                  </div>
                </motion.div>
              )}

              {/* Completion Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    Investigation Progress
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {completedPuzzles}/{totalPuzzles}
                  </span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-blood h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(completedPuzzles / totalPuzzles) * 100}%`,
                    }}
                    transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
                  />
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  {Math.round((completedPuzzles / totalPuzzles) * 100)}%
                  Complete
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-card/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">
                      Investigation Time
                    </span>
                  </div>
                  <span className="font-bold text-accent">
                    <Timer
                      startTime={progress?.startTime || 0}
                      endTime={progress?.completionTime}
                      format="withUnits"
                      showIcon={false}
                      animate={
                        progress?.startTime > 0 &&
                        !progress?.completionTime &&
                        !isSystemLocked()
                      }
                      fallback="Still investigating..."
                    />
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-card/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">Team ID</span>
                  </div>
                  <span className="font-bold text-accent">
                    {progress.teamId}
                  </span>
                </div>
              </div>
            </ManorCardContent>
          </ManorCard>
        </motion.div>

        {/* Achievement Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-center"
        >
          <ManorCard className="max-w-md mx-auto bg-gradient-candlelight/10 border-accent/30">
            <ManorCardContent className="text-center p-8">
              <Trophy className="h-16 w-16 text-accent mx-auto mb-4 animate-glow" />
              <h3 className="font-detective text-2xl font-bold text-foreground mb-2">
                {allCompleted
                  ? "🏆 Master Detective"
                  : "🕵️ Detective in Training"}
              </h3>
              <p className="text-muted-foreground font-body">
                {allCompleted
                  ? "You have successfully completed all nine puzzles and solved the murder at Wren Manor. The mystery has been unraveled!"
                  : `You have completed ${completedPuzzles} out of ${totalPuzzles} investigations. Continue your quest to unveil the truth!`}
              </p>
              {allCompleted && (
                <motion.div
                  className="mt-4 text-accent font-semibold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 0.8 }}
                >
                  ⭐ Case Closed: Wren Manor Murder Mystery ⭐
                </motion.div>
              )}
            </ManorCardContent>
          </ManorCard>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {!allCompleted && (
            <ManorButton
              variant="primary"
              onClick={() => {
                // Navigate to next uncompleted puzzle
                const nextPuzzle = !progress.p1
                  ? "/puzzle1"
                  : progress.p1 && !progress.p2
                  ? "/puzzle2"
                  : progress.p2 && !progress.p3
                  ? "/puzzle3"
                  : progress.p3 && !progress.p4
                  ? "/puzzle4"
                  : progress.p4 && !progress.p5
                  ? "/puzzle5"
                  : progress.p5 && !progress.p6
                  ? "/puzzle6"
                  : progress.p6 && !progress.p7
                  ? "/puzzle7"
                  : progress.p7 && !progress.p8
                  ? "/puzzle8"
                  : progress.p8 && !progress.p9
                  ? "/puzzle9"
                  : "/";
                navigate(nextPuzzle);
              }}
              size="lg"
              className="animate-pulse"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Continue Investigation
            </ManorButton>
          )}

          <ManorButton
            variant="candlelight"
            onClick={handleViewLeaderboard}
            size="lg"
          >
            <Trophy className="h-4 w-4 mr-2" />
            View Leaderboard
          </ManorButton>

          <ManorButton variant="secondary" onClick={handlePlayAgain} size="lg">
            <RotateCcw className="h-4 w-4 mr-2" />
            Play Again
          </ManorButton>
        </motion.div>

        {/* Atmospheric Conclusion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="text-center space-y-4 pt-8"
        >
          <div className="w-24 h-0.5 bg-gradient-blood mx-auto mb-6" />
          <p className="text-muted-foreground max-w-2xl mx-auto font-body italic leading-relaxed">
            "The shadows of Wren Manor have revealed their secrets to you,
            Detective. Though this case is closed, the echoes of mystery will
            forever linger in these hallowed halls..."
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground pt-4">
            <Skull className="h-4 w-4" />
            <span>Case File: Wren Manor Murder Mystery</span>
            <Crown className="h-4 w-4" />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Results;

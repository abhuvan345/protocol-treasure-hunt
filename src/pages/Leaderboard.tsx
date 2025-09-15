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
  Trophy,
  Medal,
  Clock,
  Users,
  Crown,
  ArrowLeft,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  getLeaderboard,
  getGameProgress,
  subscribeToLeaderboard,
  subscribeToGameProgress,
  type LeaderboardEntry,
  type GameProgress,
} from "@/integrations/firebase/gameState";
import { Timer } from "@/components/Timer";
import { useToast } from "@/hooks/use-toast";
import { useGameExitHandler } from "@/hooks/use-game-exit";
import { isSystemLocked } from "@/lib/utils";

const Leaderboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentProgress, setCurrentProgress] = useState<GameProgress | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      setLeaderboard([]);
    }
  };

  const loadCurrentProgress = async () => {
    try {
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
        const progress = await getGameProgress(storedPlayerName, storedTeamId);
        setCurrentProgress(progress);
      } else {
        setCurrentProgress(null);
      }
    } catch (error) {
      console.error("Error loading current progress:", error);
      setCurrentProgress(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadLeaderboard(), loadCurrentProgress()]);
      setIsLoading(false);
    };
    loadData();

    // Set up Firebase real-time listeners
    console.log("Setting up Firebase real-time listeners for leaderboard...");
    console.log("Firebase config check:", {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? "✅ Set" : "❌ Not set",
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
        ? "✅ Set"
        : "❌ Not set",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
        ? "✅ Set"
        : "❌ Not set",
    });

    // Track previous leaderboard state to detect changes
    let previousLeaderboard: LeaderboardEntry[] = [];

    // Subscribe to leaderboard changes
    const unsubscribeLeaderboard = subscribeToLeaderboard((newLeaderboard) => {
      console.log("🔴 Firebase leaderboard update received:", newLeaderboard);

      // Check for new players or progress updates
      if (previousLeaderboard.length > 0) {
        const newPlayers = newLeaderboard.filter(
          (player) => !previousLeaderboard.find((prev) => prev.id === player.id)
        );

        const updatedPlayers = newLeaderboard.filter((player) => {
          const prev = previousLeaderboard.find((p) => p.id === player.id);
          return (
            prev &&
            (prev.completedPuzzles !== player.completedPuzzles ||
              prev.isComplete !== player.isComplete)
          );
        });

        // Show notifications for changes
        if (newPlayers.length > 0) {
          toast({
            title: "🔥 New Investigator!",
            description: `${newPlayers[0].playerName} has joined the hunt at Wren Manor.`,
            duration: 3000,
          });
        }

        if (updatedPlayers.length > 0) {
          toast({
            title: "📈 Leaderboard Updated!",
            description: `${updatedPlayers[0].playerName} has made progress.`,
            duration: 2000,
          });
        }
      }

      previousLeaderboard = [...newLeaderboard];
      setLeaderboard(newLeaderboard);
      setIsRealTimeConnected(true);
    });

    // Subscribe to current player's progress if available
    let unsubscribeProgress: (() => void) | null = null;
    const stored = localStorage.getItem("wren-manor-player");
    if (stored) {
      const playerData = JSON.parse(stored);
      const playerName = playerData.playerName || "";
      const teamId = playerData.teamId || "";

      if (playerName && teamId) {
        unsubscribeProgress = subscribeToGameProgress(
          playerName,
          teamId,
          (progress) => {
            console.log("Firebase game progress update received:", progress);
            setCurrentProgress(progress);
          }
        );
      }
    }

    console.log("✅ Firebase real-time leaderboard updates are now active!");

    // Cleanup listeners on component unmount
    return () => {
      console.log("Cleaning up Firebase real-time listeners...");
      unsubscribeLeaderboard();
      if (unsubscribeProgress) {
        unsubscribeProgress();
      }
    };
  }, [toast]);

  // Use our custom hook to handle game exit
  useGameExitHandler(currentProgress);

  const refreshLeaderboard = async () => {
    setIsRefreshing(true);
    try {
      await loadLeaderboard();
    } catch (error) {
      console.error("Error refreshing leaderboard:", error);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // We'll use the Timer component directly instead of manually tracking elapsed times
  // No need for elapsed time state or formatting functions

  const getProgressBadge = (progress: number) => {
    if (progress === 9)
      return {
        text: "Master Detective",
        variant: "default" as const,
        color: "text-green-500",
        icon: "🏆",
      };
    if (progress >= 7)
      return {
        text: "Expert",
        variant: "secondary" as const,
        color: "text-blue-500",
        icon: "🕵️",
      };
    if (progress >= 5)
      return {
        text: "Advanced",
        variant: "secondary" as const,
        color: "text-purple-500",
        icon: "🎯",
      };
    if (progress >= 3)
      return {
        text: "Intermediate",
        variant: "outline" as const,
        color: "text-yellow-500",
        icon: "🔍",
      };
    if (progress >= 1)
      return {
        text: "Beginner",
        variant: "outline" as const,
        color: "text-orange-500",
        icon: "🔰",
      };
    return {
      text: "Starting",
      variant: "outline" as const,
      color: "text-muted-foreground",
      icon: "🚪",
    };
  };

  const getRankIcon = (index: number) => {
    if (index === 0)
      return <Crown className="h-6 w-6 text-accent animate-glow" />;
    if (index === 1) return <Medal className="h-6 w-6 text-yellow-500" />;
    if (index === 2) return <Medal className="h-6 w-6 text-orange-500" />;
    return (
      <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">
        #{index + 1}
      </span>
    );
  };

  const isCurrentPlayer = (entry: LeaderboardEntry) => {
    if (!currentProgress) return false;
    return (
      entry.playerName === currentProgress.playerName &&
      entry.teamId === currentProgress.teamId
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <div className="animate-pulse font-body">
              Loading leaderboard...
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center items-center space-x-4 mb-6">
            <Trophy className="h-12 w-12 text-accent animate-glow" />
          </div>

          <h1 className="font-mystery text-4xl md:text-5xl font-bold text-foreground">
            Investigation Leaderboard
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-body">
            Track the progress of all investigators attempting to solve the
            mystery at Wren Manor. Rankings are based on progress completed and
            total completion time.
          </p>
        </motion.div>

        {/* Leaderboard Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex justify-between items-center"
        >
          <ManorButton variant="secondary" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </ManorButton>

          <div className="flex items-center space-x-4">
            {/* Real-time status indicator */}
            <div className="flex items-center space-x-2 text-sm">
              {isRealTimeConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500 animate-pulse" />
                  <span className="text-green-500 font-medium">
                    Live Updates
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-500 font-medium">
                    Connecting...
                  </span>
                </>
              )}
            </div>

            <ManorButton
              variant="outline"
              onClick={refreshLeaderboard}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </ManorButton>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="grid md:grid-cols-3 gap-4">
            <ManorCard className="text-center hover-scale">
              <ManorCardContent className="p-4">
                <Users className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                <div className="text-2xl font-bold text-foreground">
                  {leaderboard.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Investigators
                </div>
              </ManorCardContent>
            </ManorCard>

            <ManorCard className="text-center hover-scale">
              <ManorCardContent className="p-4">
                <Trophy className="h-8 w-8 text-accent mx-auto mb-2 animate-glow" />
                <div className="text-2xl font-bold text-foreground">
                  {
                    leaderboard.filter((entry) => entry.completedPuzzles === 9)
                      .length
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  Cases Solved
                </div>
              </ManorCardContent>
            </ManorCard>

            <ManorCard className="text-center hover-scale">
              <ManorCardContent className="p-4">
                <Clock className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">
                  {leaderboard.length > 0 && leaderboard[0].totalTime > 0 ? (
                    <Timer
                      startTime={
                        leaderboard[0].timestamp - leaderboard[0].totalTime
                      }
                      endTime={
                        leaderboard[0].isComplete
                          ? leaderboard[0].timestamp
                          : undefined
                      }
                      format="withUnits"
                      showIcon={false}
                      textClassName="text-2xl font-bold"
                      animate={!leaderboard[0].isComplete && !isSystemLocked()}
                    />
                  ) : (
                    "N/A"
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Best Time</div>
              </ManorCardContent>
            </ManorCard>
          </div>
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <ManorCard className="border-primary/20">
            <ManorCardHeader>
              <ManorCardTitle className="flex items-center space-x-2 font-detective">
                <Trophy className="h-6 w-6 text-primary" />
                <span>Rankings</span>
              </ManorCardTitle>
              <ManorCardDescription>
                Investigators ranked by progress and completion time
              </ManorCardDescription>
            </ManorCardHeader>

            <ManorCardContent className="p-0">
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-body">
                    No investigators have started their journey yet. Be the
                    first to enter Wren Manor!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-6">
                  {leaderboard.map((entry, index) => {
                    const progressBadge = getProgressBadge(
                      entry.completedPuzzles
                    );
                    const isCurrentUser = isCurrentPlayer(entry);
                    const progressPercentage =
                      (entry.completedPuzzles / 9) * 100;

                    return (
                      <motion.div
                        key={`${entry.playerName}-${entry.teamId}-${entry.timestamp}`}
                        className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
                          isCurrentUser
                            ? "bg-gradient-blood/10 border-primary/30 shadow-blood ring-2 ring-primary/20"
                            : "bg-card/30 border-border hover:bg-card/50 hover:border-primary/20"
                        }`}
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                          delay: index * 0.1,
                          duration: 0.4,
                          type: "spring",
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        {/* Progress Bar Background */}
                        <div
                          className={`absolute inset-0 ${
                            isCurrentUser ? "bg-primary/5" : "bg-accent/3"
                          }`}
                          style={{
                            background: `linear-gradient(to right, ${
                              isCurrentUser
                                ? "hsl(var(--primary) / 0.1)"
                                : "hsl(var(--accent) / 0.05)"
                            } ${progressPercentage}%, transparent ${progressPercentage}%)`,
                          }}
                        />

                        <div className="relative flex items-center justify-between p-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-12">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                  delay: index * 0.1 + 0.2,
                                  type: "spring",
                                  stiffness: 200,
                                }}
                              >
                                {getRankIcon(index)}
                              </motion.div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3
                                  className={`font-detective font-semibold ${
                                    isCurrentUser
                                      ? "text-primary"
                                      : "text-foreground"
                                  }`}
                                >
                                  {entry.playerName}
                                </h3>
                                {isCurrentUser && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5, type: "spring" }}
                                  >
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-2 py-0 text-primary border-primary/30 animate-pulse"
                                    >
                                      You
                                    </Badge>
                                  </motion.div>
                                )}
                                {index < 3 && (
                                  <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      delay: index,
                                    }}
                                  >
                                    <span className="text-lg">
                                      {index === 0
                                        ? "👑"
                                        : index === 1
                                        ? "🥈"
                                        : "🥉"}
                                    </span>
                                  </motion.div>
                                )}
                              </div>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className="text-sm text-muted-foreground font-detective">
                                  Team: {entry.teamId}
                                </span>
                                <Badge
                                  variant={progressBadge.variant}
                                  className={`text-xs ${progressBadge.color} flex items-center space-x-1`}
                                >
                                  <span>{progressBadge.icon}</span>
                                  <span>{progressBadge.text}</span>
                                </Badge>
                              </div>

                              {/* Progress Bar */}
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Progress</span>
                                  <span>{entry.currentProgress}/9</span>
                                </div>
                                <div className="w-full bg-muted/30 rounded-full h-2">
                                  <motion.div
                                    className={`h-2 rounded-full ${
                                      isCurrentUser
                                        ? "bg-gradient-blood"
                                        : "bg-gradient-candlelight"
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${progressPercentage}%`,
                                    }}
                                    transition={{
                                      delay: index * 0.1 + 0.5,
                                      duration: 0.8,
                                      ease: "easeOut",
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-right space-y-1">
                            <motion.div
                              className="text-sm font-medium text-foreground"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.3 }}
                            >
                              {Math.round(progressPercentage)}% Complete
                            </motion.div>
                            <div className="text-xs text-muted-foreground">
                              <Timer
                                startTime={entry.timestamp - entry.totalTime}
                                endTime={
                                  entry.isComplete ? entry.timestamp : undefined
                                }
                                format="withUnits"
                                showIcon={false}
                                textClassName="text-xs"
                                animate={!entry.isComplete && !isSystemLocked()}
                              />
                            </div>
                            {entry.currentProgress === 9 && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                  delay: index * 0.1 + 0.6,
                                  type: "spring",
                                }}
                              >
                                <Badge className="bg-green-500 text-white text-xs animate-pulse">
                                  🎉 Solved!
                                </Badge>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ManorCardContent>
          </ManorCard>
        </motion.div>

        {/* Top Performers Spotlight */}
        {leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <ManorCard className="bg-gradient-candlelight/5 border-accent/20">
              <ManorCardHeader className="text-center">
                <ManorCardTitle className="flex items-center justify-center space-x-2 text-accent font-detective">
                  <Crown className="h-6 w-6 animate-glow" />
                  <span>Hall of Fame</span>
                  <Crown className="h-6 w-6 animate-glow" />
                </ManorCardTitle>
                <ManorCardDescription>
                  Top 3 investigators who have made exceptional progress
                </ManorCardDescription>
              </ManorCardHeader>
              <ManorCardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {leaderboard.slice(0, 3).map((entry, index) => (
                    <motion.div
                      key={`spotlight-${entry.playerName}-${entry.teamId}`}
                      className={`text-center p-4 rounded-lg border-2 ${
                        index === 0
                          ? "border-yellow-500/30 bg-yellow-500/5"
                          : index === 1
                          ? "border-gray-400/30 bg-gray-400/5"
                          : "border-orange-500/30 bg-orange-500/5"
                      }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1, type: "spring" }}
                    >
                      <motion.div
                        className="text-4xl mb-2"
                        animate={{
                          scale: index === 0 ? [1, 1.1, 1] : 1,
                          rotate: index === 0 ? [0, 5, -5, 0] : 0,
                        }}
                        transition={{
                          duration: index === 0 ? 2 : 0,
                          repeat: index === 0 ? Infinity : 0,
                        }}
                      >
                        {index === 0 ? "👑" : index === 1 ? "🥈" : "🥉"}
                      </motion.div>
                      <h4 className="font-detective font-bold text-foreground mb-1">
                        {entry.playerName}
                      </h4>
                      <div className="text-sm text-muted-foreground mb-2">
                        Team: {entry.teamId}
                      </div>
                      <div
                        className={`text-lg font-bold mb-1 ${
                          index === 0
                            ? "text-yellow-500"
                            : index === 1
                            ? "text-gray-400"
                            : "text-orange-500"
                        }`}
                      >
                        {entry.currentProgress}/9
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <Timer
                          startTime={entry.timestamp - entry.totalTime}
                          endTime={
                            entry.isComplete ? entry.timestamp : undefined
                          }
                          format="withUnits"
                          showIcon={false}
                          textClassName="text-xs"
                          animate={!entry.isComplete && !isSystemLocked()}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ManorCardContent>
            </ManorCard>
          </motion.div>
        )}

        {/* Call to Action */}
        {currentProgress?.playerName && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center"
          >
            <ManorCard className="max-w-md mx-auto bg-accent/5 border-accent/20">
              <ManorCardContent className="text-center p-6">
                <Crown className="h-10 w-10 text-accent mx-auto mb-3 animate-glow" />
                <h3 className="font-manor text-lg font-semibold text-foreground mb-2">
                  Continue Your Investigation
                </h3>
                <p className="text-sm text-muted-foreground mb-4 font-body">
                  Return to Wren Manor and climb the leaderboard by solving more
                  puzzles.
                </p>
                <ManorButton
                  onClick={() => navigate("/")}
                  variant="candlelight"
                >
                  Return to Manor
                </ManorButton>
              </ManorCardContent>
            </ManorCard>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center pt-8"
        >
          <div className="w-24 h-0.5 bg-gradient-blood mx-auto mb-4" />
          <p className="text-xs text-muted-foreground font-body italic">
            "In the game of mystery, every second counts, and every clue
            matters..."
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Leaderboard;

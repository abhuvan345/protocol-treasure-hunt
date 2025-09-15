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
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle } from "lucide-react";
import { getGameProgress, saveGameProgress } from "@/lib/gameState";
import { useToast } from "@/hooks/use-toast";

const Puzzle9 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [killerName, setKillerName] = useState("");
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const correctKillerName = "LADY ASHCROFT";

  // Load game progress and log killer name to console
  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true);
        // Get player data from localStorage
        const stored = localStorage.getItem("wren-manor-player");
        let playerName = "";
        let teamId = "";

        if (stored) {
          const playerData = JSON.parse(stored);
          playerName = playerData.playerName || "";
          teamId = playerData.teamId || "";
        }

        console.log("Checking localStorage for player data...");
        if (!playerName || !teamId) {
          console.log(
            "No player data found in localStorage, using fallback from saved progress..."
          );
          playerName = "M";
          teamId = "AW";
          // Store in localStorage for future use
          const playerData = { playerName, teamId };
          localStorage.setItem("wren-manor-player", JSON.stringify(playerData));
          console.log("Set fallback player data:", playerData);
        }

        console.log(`Loading progress for ${playerName} (Team: ${teamId})`);
        const gameProgress = await getGameProgress(playerName, teamId);
        console.log("Loaded game progress from Firebase:", gameProgress);
        setProgress(gameProgress);

        // Check if previous puzzles are incomplete
        if (
          !gameProgress.p1 ||
          !gameProgress.p2 ||
          !gameProgress.p3 ||
          !gameProgress.p4 ||
          !gameProgress.p5 ||
          !gameProgress.p6 ||
          !gameProgress.p7 ||
          !gameProgress.p8
        ) {
          console.log("Previous puzzles incomplete, redirecting...", {
            p1: gameProgress.p1,
            p2: gameProgress.p2,
            p3: gameProgress.p3,
            p4: gameProgress.p4,
            p5: gameProgress.p5,
            p6: gameProgress.p6,
            p7: gameProgress.p7,
            p8: gameProgress.p8,
          });
          navigate("/");
          return;
        }

        console.log("All previous puzzles completed, ready for final puzzle!");

        // Log the killer name to console for the puzzle
        console.log("The killer name is Lady Ashcroft");
      } catch (error) {
        console.error("Error loading progress:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [navigate]);

  const handleKillerNameSubmit = async () => {
    const userInput = killerName.trim().toUpperCase();

    if (userInput === correctKillerName) {
      const newProgress = {
        ...progress,
        p9: true,
        currentPage: 9,
        completed: true,
        completionTime: Date.now(), // Set the completion time when the player solves the final puzzle
      };
      await saveGameProgress(newProgress);
      setProgress(newProgress);
      setPuzzleSolved(true);

      toast({
        title: "� Case Solved!",
        description:
          "Congratulations! You've successfully identified the killer!",
        duration: 5000,
      });

      // Ensure localStorage is updated before navigation
      const playerData = {
        playerName: newProgress.playerName,
        teamId: newProgress.teamId,
      };
      localStorage.setItem("wren-manor-player", JSON.stringify(playerData));

      setTimeout(() => {
        navigate("/results");
      }, 3000);
    } else {
      toast({
        title: "Incorrect Name",
        description:
          "That's not the killer's name. Check the browser console for clues.",
        variant: "destructive",
      });
    }
  };

  if (loading || !progress) {
    return null;
  }

  return (
    <Layout>
      <motion.div
        className="max-w-4xl mx-auto space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center space-y-4">
          <Badge
            variant="outline"
            className="text-primary border-primary/30 bg-primary/10"
          >
            Puzzle 9 of 9 • Final Puzzle
          </Badge>
          <div className="flex justify-center items-center space-x-3 mb-6">
            <Search className="h-8 w-8 text-primary animate-pulse-blood" />
            <h1 className="font-manor text-4xl font-bold text-foreground">
              Who am I
            </h1>
            <Search className="h-8 w-8 text-accent animate-glow" />
          </div>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-detective">
            Browser's Inspector
          </p>
        </div>

        {/* Killer Name Input */}
        <ManorCard>
          <ManorCardHeader>
            <ManorCardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <span>Enter the Killer's Name</span>
            </ManorCardTitle>
            <ManorCardDescription>
              find the killer's name, then enter it below
            </ManorCardDescription>
          </ManorCardHeader>
          <ManorCardContent className="space-y-4">
            <div className="space-y-4">
              <Input
                value={killerName}
                onChange={(e) => setKillerName(e.target.value)}
                placeholder="Enter the killer's name..."
                className="text-center font-mono text-lg tracking-wider"
                autoFocus
              />
              <div className="text-center">
                <ManorButton
                  onClick={handleKillerNameSubmit}
                  disabled={!killerName.trim()}
                  size="lg"
                >
                  Submit Final Answer
                </ManorButton>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                💡 <strong>Hint:</strong> You are the investigator you should
                find it no one will help you with clues in this stage !!!
              </p>
            </div>
          </ManorCardContent>
        </ManorCard>

        {/* Success Message */}
        {puzzleSolved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ManorCard className="bg-gradient-blood border-primary text-center">
              <ManorCardContent className="pt-6">
                <CheckCircle className="h-16 w-16 text-primary-foreground mx-auto mb-4" />
                <h3 className="font-manor text-2xl text-primary-foreground mb-2">
                  Mystery Solved!
                </h3>
                <p className="text-primary-foreground/90 mb-6">
                  You've successfully identified Lady Ashcroft as the killer!
                  The case is now closed.
                </p>
              </ManorCardContent>
            </ManorCard>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Puzzle9;

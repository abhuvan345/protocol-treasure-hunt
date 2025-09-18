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
import { Input } from "@/components/ui/input";
import { Eye, Search, CheckCircle, Delete, RotateCcw } from "lucide-react";
import { getGameProgress, saveGameProgress } from "@/lib/gameState";
import { useToast } from "@/hooks/use-toast";

const Puzzle8 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Wordle game state
  const [currentGuess, setCurrentGuess] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [currentRow, setCurrentRow] = useState(0);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const TARGET_WORD = "TOOLS";
  const MAX_GUESSES = 6;
  const WORD_LENGTH = 5;

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
          !gameProgress.p7
        ) {
          console.log("Previous puzzles incomplete, redirecting...", {
            p1: gameProgress.p1,
            p2: gameProgress.p2,
            p3: gameProgress.p3,
            p4: gameProgress.p4,
            p5: gameProgress.p5,
            p6: gameProgress.p6,
            p7: gameProgress.p7,
          });
          navigate("/");
          return;
        }

        console.log(
          "All previous puzzles completed, checking if puzzle 8 is already done..."
        );
        // If puzzle already completed, redirect to next
        if (gameProgress.p8 && gameProgress.currentPage > 7) {
          console.log(
            "Puzzle 8 already completed, redirecting to next puzzle..."
          );
          navigate("/puzzle-9");
          return;
        }

        console.log("Ready to show Puzzle 8!");
      } catch (error) {
        console.error("Error loading progress:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [navigate]);

  const getLetterColor = (letter: string, position: number, word: string) => {
    if (TARGET_WORD[position] === letter) {
      return "bg-green-600 border-green-600 text-white"; // Correct position
    } else if (TARGET_WORD.includes(letter)) {
      return "bg-yellow-600 border-yellow-600 text-white"; // Wrong position
    } else {
      return "bg-gray-600 border-gray-600 text-white"; // Not in word
    }
  };

  const submitGuess = async () => {
    if (currentGuess.length !== WORD_LENGTH) {
      toast({
        title: "Invalid Guess",
        description: `Please enter a ${WORD_LENGTH}-letter word.`,
        variant: "destructive",
      });
      return;
    }

    const newGuesses = [...guesses, currentGuess.toUpperCase()];
    setGuesses(newGuesses);
    setCurrentRow(currentRow + 1);

    if (currentGuess.toUpperCase() === TARGET_WORD) {
      setGameWon(true);
      setGameOver(true);
      setPuzzleSolved(true);

      const newProgress = {
        ...progress,
        p8: true,
        currentPage: 8,
      };
      await saveGameProgress(newProgress);
      setProgress(newProgress);

      toast({
        title: "🔍 Murder Weapon Found!",
        description: `You discovered the word "${TARGET_WORD}"! The hidden tools reveal the truth about the murder.`,
        duration: 3000,
      });

      // Ensure localStorage is updated before navigation
      const playerData = {
        playerName: newProgress.playerName,
        teamId: newProgress.teamId,
      };
      localStorage.setItem("wren-manor-player", JSON.stringify(playerData));

      setTimeout(() => {
        navigate("/puzzle-9");
      }, 3000);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      toast({
        title: "Game Over",
        description: `The word was "${TARGET_WORD}". The murder weapon remains hidden...`,
        variant: "destructive",
      });
    }

    setCurrentGuess("");
  };

  const resetGame = () => {
    setCurrentGuess("");
    setGuesses([]);
    setGameWon(false);
    setGameOver(false);
    setCurrentRow(0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitGuess();
    }
    // Let the onChange handler deal with character input and backspace
    // This prevents double character entry
  };

  const handleNext = () => {
    navigate("/puzzle-9");
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
            Puzzle 8 of 9
          </Badge>
          <div className="flex justify-center items-center space-x-3 mb-6">
            <Eye className="h-8 w-8 text-primary animate-pulse-blood" />
            <h1 className="font-manor text-4xl font-bold text-foreground">
              Uncover the Murder Weapon
            </h1>
            <Search className="h-8 w-8 text-accent animate-glow" />
          </div>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-detective">
            this is a 5-letter word puzzle try to find the word.
          </p>
        </div>

        {/* Game Instructions */}
        <ManorCard>
          <ManorCardHeader>
            <ManorCardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <span>Word Detective Game</span>
            </ManorCardTitle>
            <ManorCardDescription>
              You have {MAX_GUESSES} attempts to guess the 5-letter word. Each
              guess will reveal clues about the letters.
            </ManorCardDescription>
          </ManorCardHeader>
          <ManorCardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-green-600 rounded border flex items-center justify-center">
                    <span className="text-white font-bold text-xs">A</span>
                  </div>
                  <span className="font-semibold">Correct Position</span>
                </div>
                <p className="text-muted-foreground">
                  The letter is in the word and in the right spot.
                </p>
              </div>

              <div className="p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-yellow-600 rounded border flex items-center justify-center">
                    <span className="text-white font-bold text-xs">B</span>
                  </div>
                  <span className="font-semibold">Wrong Position</span>
                </div>
                <p className="text-muted-foreground">
                  The letter is in the word but in the wrong spot.
                </p>
              </div>

              <div className="p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gray-600 rounded border flex items-center justify-center">
                    <span className="text-white font-bold text-xs">C</span>
                  </div>
                  <span className="font-semibold">Not in Word</span>
                </div>
                <p className="text-muted-foreground">
                  The letter is not in the word at all.
                </p>
              </div>
            </div>
          </ManorCardContent>
        </ManorCard>

        {/* Game Board */}
        <ManorCard>
          <ManorCardHeader>
            <ManorCardTitle>Mystery Word Puzzle</ManorCardTitle>
            <ManorCardDescription>
              Attempt {currentRow + 1} of {MAX_GUESSES} | Find the word.
            </ManorCardDescription>
          </ManorCardHeader>
          <ManorCardContent className="space-y-6">
            {/* Game Grid */}
            <div className="flex flex-col items-center space-y-2">
              {Array.from({ length: MAX_GUESSES }, (_, rowIndex) => (
                <div key={rowIndex} className="flex space-x-2">
                  {Array.from({ length: WORD_LENGTH }, (_, colIndex) => {
                    let letter = "";
                    let colorClass = "bg-background border-border";

                    if (rowIndex < guesses.length) {
                      // Past guess
                      letter = guesses[rowIndex][colIndex] || "";
                      colorClass = getLetterColor(
                        letter,
                        colIndex,
                        guesses[rowIndex]
                      );
                    } else if (rowIndex === currentRow && !gameOver) {
                      // Current guess
                      letter = currentGuess[colIndex] || "";
                      colorClass = "bg-background border-primary";
                    }

                    return (
                      <div
                        key={colIndex}
                        className={`w-12 h-12 border-2 flex items-center justify-center font-bold text-lg rounded ${colorClass}`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Input and Controls */}
            {!gameOver && (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={currentGuess}
                    onChange={(e) => {
                      const value = e.target.value
                        .toUpperCase()
                        .slice(0, WORD_LENGTH);
                      setCurrentGuess(value);
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter your guess..."
                    className="text-center font-mono text-lg tracking-wider"
                    maxLength={WORD_LENGTH}
                    autoFocus
                  />
                  <ManorButton
                    onClick={submitGuess}
                    disabled={currentGuess.length !== WORD_LENGTH}
                  >
                    Submit
                  </ManorButton>
                </div>

                <div className="flex justify-center space-x-2">
                  <ManorButton
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentGuess("")}
                  >
                    <Delete className="h-4 w-4 mr-1" />
                    Clear
                  </ManorButton>
                  <ManorButton variant="outline" size="sm" onClick={resetGame}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </ManorButton>
                </div>
              </div>
            )}

            {/* Game Over States */}
            {gameOver && !gameWon && (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  The word was{" "}
                  <span className="font-bold text-primary">{TARGET_WORD}</span>
                </p>
                <ManorButton onClick={resetGame}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </ManorButton>
              </div>
            )}
          </ManorCardContent>
        </ManorCard>

        {/* Story Context */}
        <ManorCard className="bg-accent/5 border-accent/20">
          <ManorCardHeader>
            <ManorCardTitle className="text-accent">
              Detective's Notes
            </ManorCardTitle>
          </ManorCardHeader>
          <ManorCardContent>
            <p className="text-muted-foreground italic">
              "The killer was methodical, using specific implements to carry out
              the crime. Marcel's payment records show purchases of certain
              items just before the murder. What 5-letter word describes the
              implements a craftsman might use to... permanently silence
              someone?"
            </p>
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Hint:</strong> Think about what a person might use to
                fix things around a manor... or to cause irreparable damage.
              </p>
            </div>
          </ManorCardContent>
        </ManorCard>

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
                  Hidden Secrets Exposed!
                </h3>
                <p className="text-primary-foreground/90 mb-6">
                  The concealed evidence reveals the full conspiracy. Marcel was
                  paid to frame Charles, but kept the murder weapon as leverage.
                  Time for the final confrontation!
                </p>
                <ManorButton
                  onClick={handleNext}
                  variant="secondary"
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Final Accusation
                </ManorButton>
              </ManorCardContent>
            </ManorCard>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Puzzle8;

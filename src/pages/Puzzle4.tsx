import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { ManorCard, ManorCardHeader, ManorCardTitle, ManorCardContent } from "@/components/ui/manor-card";
import { ManorButton } from "@/components/ui/manor-button";
import { PhoneKeypad } from "@/components/ui/phone-keypad";
import { toast } from "@/hooks/use-toast";
import { getGameProgress, saveGameProgress } from "@/lib/gameState";
import { Code, Bug, CheckCircle2 } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const Puzzle4 = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userCode, setUserCode] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [solved, setSolved] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [debugResult, setDebugResult] = useState("");

  // Load game progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true);
        const stored = localStorage.getItem('wren-manor-player');
        let playerName = '';
        let teamId = '';
        
        if (stored) {
          const playerData = JSON.parse(stored);
          playerName = playerData.playerName || '';
          teamId = playerData.teamId || '';
        }
        
        if (!playerName || !teamId) {
          console.log('No player data found, redirecting to home...');
          navigate('/');
          return;
        }
        
        console.log(Loading progress for ${playerName} (Team: ${teamId}));
        const gameProgress = await getGameProgress(playerName, teamId);
        setProgress(gameProgress);
        setSolved(gameProgress.p4);
        
        // Check if previous puzzles are incomplete
        if (!gameProgress.p1 || !gameProgress.p2 || !gameProgress.p3) {
          console.log('Previous puzzles incomplete, redirecting...');
          if (!gameProgress.p1) navigate('/puzzle-1');
          else if (!gameProgress.p2) navigate('/puzzle-2');
          else navigate('/puzzle-3');
          return;
        }

        // If puzzle already completed, redirect to next
        if (gameProgress.p4 && gameProgress.currentPage > 3) {
          console.log('Puzzle 4 already completed, redirecting to next puzzle...');
          navigate('/puzzle-5');
          return;
        }
      } catch (error) {
        console.error('Error loading progress:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    loadProgress();
  }, [navigate]);

  // Buggy Python code displayed to the user
  const buggyCode = `def find_murder_weapon():
    weapons = ["dagger", "rope", "candlestick", "poison", "blunt_object"]
    clues = [1, 2, 3, 4, 5]
    
    # The butler's testimony points to a specific weapon
    butler_clue = clues[0] + clues[1] 
    
    # The maid's observation narrows it down
    maid_clue = butler_clue * 2 
    
    # The chef's alibi reveals the final piece
    chef_clue = maid_clue - 1      
    
    # Calculate the weapon index
    weapon_index = chef_clue % len(weapons)      
    
    # Get the weapon name
    weapon = weapons[weapon_index]
    
    # Convert to PIN (first 4 letters as numbers)
    pin = ""
    for char in weapon[:4]:
        pin += str(ord(char) - ord('a') + 1)
    
    return pin

# Debug this function to find the 4-digit PIN
result = find_murder_weapon()
print(f"The PIN is: {result}")`;

  const hints = [
    "Look for off-by-one errors in array indexing",
    "Check if the modulo operation is working correctly",
    "Verify the character-to-number conversion",
    "The PIN should be 4 digits representing the weapon name"
  ];

  // The correct PIN
  const correctPIN = "4177"; // D-A-G-G = 4-1-7-7

  /**
   * Handles submission of the input box
   * The user must type EXACTLY "4177" to unlock the phone keypad page
   */
  const handleCodeSubmit = () => {
    if (!userCode.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter the correct PIN in the input box.",
        variant: "destructive"
      });
      return;
    }

    if (userCode.trim() === correctPIN) {
      setDebugResult("Correct code entered! You can now unlock the phone using the keypad.");
      setShowKeypad(true);
      toast({
        title: "✅ Correct Code!",
        description: "Now enter the same code using the keypad to unlock the phone.",
        duration: 3000,
      });
    } else {
      toast({
        title: "Incorrect Code",
        description: "Only the exact PIN '4177' will unlock the phone keypad.",
        variant: "destructive"
      });
    }
  };

  /**
   * Handles the keypad input.
   * The user must also type 4177 on the keypad to fully unlock.
   */
  const handleKeypadComplete = async (pin: string) => {
    if (pin === correctPIN) {
      const newProgress = {
        ...progress,
        p4: true,
        killer: "Marcel",
        currentPage: 4
      };
      
      setProgress(newProgress);
      await saveGameProgress(newProgress);
      setSolved(true);
      
      toast({
        title: "🔓 Phone Unlocked!",
        description: "The phone has been successfully unlocked. Moving to the next puzzle...",
        duration: 3000,
      });

      const playerData = {
        playerName: newProgress.playerName,
        teamId: newProgress.teamId
      };
      localStorage.setItem('wren-manor-player', JSON.stringify(playerData));

      setTimeout(() => {
        navigate('/puzzle-5');
      }, 2000);
    } else {
      toast({
        title: "Incorrect PIN",
        description: "The phone remains locked. Please enter the correct PIN: 4177.",
        variant: "destructive"
      });
    }
  };

  const handleNext = () => {
    navigate("/puzzle-5");
  };

  if (loading || !progress) {
    return null;
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
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
            Puzzle 4 of 9
          </Badge>
          <h1 className="font-manor text-4xl font-bold text-foreground">
            The Chef's Secret Code
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-body">
            The chef left behind a buggy Python script that reveals a 4-digit PIN. 
            Type the exact PIN into the box, then use the phone keypad to fully unlock the phone.
          </p>
        </motion.div>

        {!showKeypad ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <ManorCard className="border-primary/20 shadow-blood">
              <ManorCardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Code className="h-12 w-12 text-primary animate-pulse-blood" />
                </div>
                <ManorCardTitle>Debug the Python Code</ManorCardTitle>
                <p className="text-muted-foreground">
                  Enter the final PIN below. Only when you enter "4177" will the phone keypad appear.
                </p>
              </ManorCardHeader>
              
              <ManorCardContent className="space-y-6">
                {/* Buggy Code Display */}
                <div className="space-y-3">
                  <Label className="text-foreground font-manor text-lg">
                    Buggy Python Code:
                  </Label>
                  <div className="bg-muted/20 border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre className="whitespace-pre-wrap text-foreground">{buggyCode}</pre>
                  </div>
                </div>

                {/* User PIN Input */}
                <div className="space-y-3">
                  <Label htmlFor="userCode" className="font-manor">
                    Enter PIN:
                  </Label>
                  <Textarea
                    id="userCode"
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    placeholder="Type 4177 here to proceed..."
                    className="min-h-16 font-mono text-sm bg-input/50 border-border focus:border-primary"
                    disabled={solved}
                  />
                </div>

                {/* Debug Result */}
                {debugResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-primary/10 border border-primary/30 rounded-lg"
                  >
                    <p className="text-primary font-semibold">{debugResult}</p>
                  </motion.div>
                )}

                {/* Action Button */}
                <div className="flex justify-end">
                  <ManorButton
                    onClick={handleCodeSubmit}
                    disabled={!userCode.trim()}
                    size="lg"
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Submit PIN
                  </ManorButton>
                </div>
              </ManorCardContent>
            </ManorCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <PhoneKeypad
              onComplete={handleKeypadComplete}
              title="Enter the 4-Digit PIN"
              description="Use the keypad to enter 4177"
            />
          </motion.div>
        )}

        {/* Atmospheric Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground max-w-md mx-auto font-detective italic">
            "The chef's phone holds the key to his alibi, but only the correct code will unlock its secrets..."
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Puzzle4;

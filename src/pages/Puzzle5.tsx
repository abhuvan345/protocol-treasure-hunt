import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ManorCard, ManorCardContent, ManorCardDescription, ManorCardHeader, ManorCardTitle } from '@/components/ui/manor-card';
import { ManorButton } from '@/components/ui/manor-button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, CheckCircle } from 'lucide-react';
import { getGameProgress, saveGameProgress } from '@/lib/gameState';
import { useToast } from '@/hooks/use-toast';

const Puzzle5 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedContradictions, setSelectedContradictions] = useState<string[]>([]);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const dialogues = [
    {
      id: 'butler-time',
      suspect: 'Bernard (Butler)',
      statement: '"The lights went out at 8:10 PM sharp. I was in the pantry organizing wine bottles."',
      category: 'timing'
    },
    {
      id: 'maid-sight',
      suspect: 'Millice (Maid)',
      statement: '"I saw the butler walking past the library at 8:15 PM. He looked quite nervous."',
      category: 'witness'
    },
    {
      id: 'chef-kitchen',
      suspect: 'Claude (Chef)',
      statement: '"I never left the kitchen after 7:30 PM. The roast needed constant attention."',
      category: 'alibi'
    },
    {
      id: 'guest-chef',
      suspect: 'Victoria (Guest)',
      statement: '"I saw Marcel in the garden around 8:20 PM. He was washing something at the fountain."',
      category: 'witness'
    },
    {
      id: 'doctor-study',
      suspect: 'Dr. Pembroke',
      statement: '"I was examining Lord Ashcroft in his study from 8:00 to 8:30 PM. He was alive when I left."',
      category: 'alibi'
    },
    {
      id: 'lady-drawing',
      suspect: 'Lady Ashcroft',
      statement: '"I heard my husband arguing with someone in his study at 8:25 PM."',
      category: 'witness'
    },
    {
      id: 'butler-keys',
      suspect: 'Bernard (Butler)',
      statement: '"I locked all the doors at 8:00 PM as usual. No one could enter or leave after that."',
      category: 'security'
    },
    {
      id: 'maid-cleaning',
      suspect: 'Millice (Maid)',
      statement: '"I saw Lady Victoria enter through the garden door at 8:30 PM, soaking wet from the rain."',
      category: 'witness'
    }
  ];

  const correctContradictions = [
    'butler-time|maid-sight',
    'chef-kitchen|guest-chef', 
    'doctor-study|lady-drawing',
    'butler-keys|maid-cleaning',
    'butler-time|butler-keys'
  ];

  // Load game progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true);
        // Get player data from localStorage
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
        
        console.log(`Loading progress for ${playerName} (Team: ${teamId})`);
        const gameProgress = await getGameProgress(playerName, teamId);
        setProgress(gameProgress);
        
        // Check if previous puzzles are incomplete
        if (!gameProgress.p1 || !gameProgress.p2 || !gameProgress.p3 || !gameProgress.p4) {
          console.log('Previous puzzles incomplete, redirecting...');
          if (!gameProgress.p1) navigate('/puzzle-1');
          else if (!gameProgress.p2) navigate('/puzzle-2');
          else if (!gameProgress.p3) navigate('/puzzle-3');
          else navigate('/puzzle-4');
          return;
        }

        // If puzzle already completed, redirect to next
        if (gameProgress.p5 && gameProgress.currentPage > 4) {
          console.log('Puzzle 5 already completed, redirecting to next puzzle...');
          navigate('/puzzle-6');
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

  const handleContradictionToggle = (contradiction: string) => {
    setSelectedContradictions(prev => {
      if (prev.includes(contradiction)) {
        return prev.filter(c => c !== contradiction);
      } else {
        return [...prev, contradiction];
      }
    });
  };

  const handleSubmit = async () => {
    // Check if exactly the first 3 contradictions are selected
    const firstThreeContradictions = correctContradictions.slice(0, 3);
    const correctlySelected = firstThreeContradictions.every(c => selectedContradictions.includes(c));
    const onlyFirstThreeSelected = selectedContradictions.length === 3 && correctlySelected;
    
    if (onlyFirstThreeSelected) {
      const newProgress = { ...progress, p5: true, currentPage: 5 };
      await saveGameProgress(newProgress);
      setProgress(newProgress);
      setPuzzleSolved(true);
      
      toast({
        title: "🕵️ Contradictions Found!",
        description: "The lies have been exposed! Proceeding to digital investigation...",
        duration: 3000,
      });

      // Ensure localStorage is updated before navigation
      const playerData = {
        playerName: newProgress.playerName,
        teamId: newProgress.teamId
      };
      localStorage.setItem('wren-manor-player', JSON.stringify(playerData));

      setTimeout(() => {
        navigate('/puzzle-6');
      }, 2000);
    } else {
      toast({
        title: "Incorrect Selection",
        description: "You must select exactly the first 3 contradictions to expose the lies.",
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    navigate('/puzzle-6');
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
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
            Puzzle 5 of 9
          </Badge>
          <div className="flex justify-center items-center space-x-3 mb-6">
            <MessageSquare className="h-8 w-8 text-primary animate-pulse-blood" />
            <h1 className="font-manor text-4xl font-bold text-foreground">Web of Lies</h1>
            <Search className="h-8 w-8 text-accent animate-glow" />
          </div>
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
            The suspects' statements contradict each other. Identify the lies by finding 
            contradictory statements that cannot both be true.
          </p>
        </div>

        <div className="grid gap-4">
          {dialogues.map((dialogue) => (
            <ManorCard key={dialogue.id} className="transition-manor hover:shadow-blood">
              <ManorCardHeader>
                <div className="flex items-center justify-between">
                  <ManorCardTitle className="text-lg">
                    {dialogue.suspect}
                  </ManorCardTitle>
                  <Badge variant="secondary" className="capitalize">
                    {dialogue.category}
                  </Badge>
                </div>
              </ManorCardHeader>
              <ManorCardContent>
                <p className="text-foreground italic text-lg leading-relaxed">
                  {dialogue.statement}
                </p>
              </ManorCardContent>
            </ManorCard>
          ))}
        </div>

        <ManorCard className="bg-accent/5 border-accent/20">
          <ManorCardHeader>
            <ManorCardTitle className="text-center text-accent">
              Identify Contradictions
            </ManorCardTitle>
          </ManorCardHeader>
          <ManorCardContent className="space-y-4">
            <div className="grid gap-3">
              {correctContradictions.map((contradiction, index) => (
                <div
                  key={contradiction}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedContradictions.includes(contradiction)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-accent'
                  }`}
                  onClick={() => handleContradictionToggle(contradiction)}
                >
                  <div className="text-sm text-muted-foreground">Contradiction {index + 1}:</div>
                  <div className="text-foreground">
                    {contradiction === 'butler-time|maid-sight' && 
                      "Butler claims lights out at 8:10, but maid saw him at 8:15."
                    }
                    {contradiction === 'chef-kitchen|guest-chef' && 
                      "Chef claims never left kitchen, but was seen in garden at 8:20"
                    }
                    {contradiction === 'doctor-study|lady-drawing' && 
                      "Doctor says Lord Ashcroft was alive when he left at 8:30, but Lady heard arguing at 8:25"
                    }
                    {contradiction === 'butler-keys|maid-cleaning' && 
                      "Butler locked all doors at 8:00, but maid saw Lady Victoria enter at 8:30"
                    }
                    {contradiction === 'butler-time|butler-keys' && 
                      "Butler claims lights out at 8:10 but also says he locked doors at 8:00"
                    }
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center pt-4">
              <ManorButton onClick={handleSubmit} disabled={selectedContradictions.length !== 3}>
                Expose the Lies
              </ManorButton>
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
                  Deceptions Unraveled!
                </h3>
                <p className="text-primary-foreground/90 mb-6">
                  The contradictions expose Marcel the Chef and Charles the Butler as liars. 
                  Their alibis crumble under scrutiny.
                </p>
                <ManorButton 
                  onClick={handleNext}
                  variant="secondary"
                  size="lg"
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Query the Database
                </ManorButton>
              </ManorCardContent>
            </ManorCard>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Puzzle5;

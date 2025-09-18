import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { Layout } from '@/components/Layout';
import {
  ManorCard,
  ManorCardContent,
  ManorCardHeader,
  ManorCardTitle,
} from '@/components/ui/manor-card';
import { ManorButton } from '@/components/ui/manor-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { CheckCircle, Lightbulb } from 'lucide-react';

import { getGameProgress, saveGameProgress } from '@/lib/gameState';
import { useToast } from '@/hooks/use-toast';

const Puzzle7 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [cipherAnswer, setCipherAnswer] = useState('');
  const [collectedClues, setCollectedClues] = useState('');
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [showClueEntry, setShowClueEntry] = useState(false);

  const [showHint, setShowHint] = useState(false);

  const encryptedMessage = 'SFDPMMFDU BMM UIF DMVFT';
  const correctDecryption = 'RECOLLECT ALL THE CLUES';

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

        // ✅ Fixed string interpolation with backticks
        console.log(`Loading progress for ${playerName} (Team: ${teamId})`);

        const gameProgress = await getGameProgress(playerName, teamId);
        setProgress(gameProgress);

        if (
          !gameProgress.p1 ||
          !gameProgress.p2 ||
          !gameProgress.p3 ||
          !gameProgress.p4 ||
          !gameProgress.p5 ||
          !gameProgress.p6
        ) {
          console.log('Previous puzzles incomplete, redirecting...');
          navigate('/');
          return;
        }

        if (gameProgress.p7 && gameProgress.currentPage > 6) {
          console.log('Puzzle 7 already completed, redirecting to next puzzle...');
          navigate('/puzzle-8');
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

  const handleCipherSubmit = () => {
    if (cipherAnswer.trim().toUpperCase() === correctDecryption) {
      setShowClueEntry(true);
      toast({
        title: 'Cipher Decoded!',
        description: 'Now enter all the clues from your investigation.',
        variant: 'default',
      });
    } else {
      toast({
        title: 'Incorrect Decryption',
        description: 'Try Caesar cipher with shift -1.',
        variant: 'destructive',
      });
    }
  };

  const handleCluesSubmit = async () => {
    const userClues = collectedClues.toUpperCase();
    const expectedClues = ['DAGGER', 'MARCEL', 'CHEF', 'BONUS'];
    const matchCount = expectedClues.filter((clue) => userClues.includes(clue)).length;

    if (matchCount >= 3) {
      const newProgress = { ...progress, p7: true, currentPage: 7 };
      await saveGameProgress(newProgress);
      setProgress(newProgress);
      setPuzzleSolved(true);

      toast({
        title: '🔓 Cipher Decoded!',
        description: 'The final clues have been collected! Proceeding to the grand finale...',
        duration: 3000,
      });

      const playerData = {
        playerName: newProgress.playerName,
        teamId: newProgress.teamId,
      };
      localStorage.setItem('wren-manor-player', JSON.stringify(playerData));

      setTimeout(() => {
        navigate('/puzzle-8');
      }, 2000);
    } else {
      toast({
        title: 'Incomplete Evidence',
        description: 'Include key clues: DAGGER, MARCEL, CHEF, BONUS',
        variant: 'destructive',
      });
    }
  };

  const handleNext = () => {
    navigate('/puzzle-8');
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
            Puzzle 7 of 9
          </Badge>
          <h1 className="font-manor text-4xl font-bold text-foreground">Pattern Decryption</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-detective">
            Decrypt the final cipher and combine all clues to reveal the complete truth.
          </p>
        </div>

        {/* Hint Toggle Section */}
        <div className="flex justify-center">
          <ManorButton
            variant="outline"
            onClick={() => setShowHint((prev) => !prev)}
            className="flex items-center gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </ManorButton>
        </div>

        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ManorCard className="mt-4">
                <ManorCardHeader>
                  <ManorCardTitle>Hint</ManorCardTitle>
                </ManorCardHeader>
                <ManorCardContent className="space-y-2">
                  <p className="text-muted-foreground max-w-2xl mx-auto font-detective">
                    This puzzle uses an additive cipher (also known as a Caesar cipher).
                    To solve it, you must apply a numerical shift to each letter.
                  </p>
                  <p className="text-muted-foreground max-w-2xl mx-auto font-detective">
                    Assign each letter a number from 0-25 (A=0, B=1, ... Z=25).
                  </p>
                  <p className="text-muted-foreground max-w-2xl mx-auto font-detective">
                    The decryption formula is: (numericalvalue + key) % 26.
                  </p>
                  <p className="text-muted-foreground max-w-2xl mx-auto font-detective">
                    Find the key by solving this problem = x^2 = ((3!-2!)/2!)-1
                  </p>
                </ManorCardContent>
              </ManorCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cipher Section */}
        <ManorCard>
          <ManorCardHeader>
            <ManorCardTitle>Encrypted Message</ManorCardTitle>
          </ManorCardHeader>
          <ManorCardContent className="space-y-4">
            <div className="p-4 bg-muted/20 rounded-lg font-mono text-lg text-center">
              {encryptedMessage}
            </div>

            <Input
              value={cipherAnswer}
              onChange={(e) => setCipherAnswer(e.target.value.toUpperCase())}
              placeholder="Enter decoded message"
              disabled={showClueEntry}
            />

            <ManorButton onClick={handleCipherSubmit} disabled={showClueEntry}>
              Decrypt Message
            </ManorButton>
          </ManorCardContent>
        </ManorCard>

        {showClueEntry && (
          <ManorCard>
            <ManorCardHeader>
              <ManorCardTitle>Collect All Evidence</ManorCardTitle>
            </ManorCardHeader>
            <ManorCardContent className="space-y-4">
              <Textarea
                value={collectedClues}
                onChange={(e) => setCollectedClues(e.target.value)}
                placeholder="Enter all clues: From your previous puzzles "
                rows={4}
              />
              <ManorButton onClick={handleCluesSubmit}>Assemble Evidence</ManorButton>
            </ManorCardContent>
          </ManorCard>
        )}

        {puzzleSolved && (
          <ManorCard className="bg-gradient-blood border-primary text-center">
            <ManorCardContent className="pt-6">
              <CheckCircle className="h-16 w-16 text-primary-foreground mx-auto mb-4" />
              <h3 className="font-manor text-2xl text-primary-foreground mb-2">
                Pattern Decoded!
              </h3>
              <ManorButton
                onClick={handleNext}
                variant="secondary"
                size="lg"
                className="bg-primary-foreground text-primary"
              >
                Inspect the Manor
              </ManorButton>
            </ManorCardContent>
          </ManorCard>
        )}
      </motion.div>
    </Layout>
  );
};

export default Puzzle7;

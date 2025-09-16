import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ManorCard, ManorCardContent, ManorCardDescription, ManorCardHeader, ManorCardTitle } from '@/components/ui/manor-card';
import { ManorButton } from '@/components/ui/manor-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Database, Terminal, CheckCircle } from 'lucide-react';
import { getGameProgress, saveGameProgress } from '@/lib/gameState';
import { useToast } from '@/hooks/use-toast';

const Puzzle6 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const database = {
    TRANSACTIONS: [
      { ID: '01', NAME: 'Chef', AMOUNT: 12000, DATE: '2025-09-01' },
      { ID: '02', NAME: 'Maid', AMOUNT: 5000, DATE: '2025-09-01' }
    ]
  };

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
        if (!gameProgress.p1 || !gameProgress.p2 || !gameProgress.p3 || !gameProgress.p4 || !gameProgress.p5) {
          console.log('Previous puzzles incomplete, redirecting...');
          navigate('/');
          return;
        }

        // If puzzle already completed, redirect to next
        if (gameProgress.p6 && gameProgress.currentPage > 5) {
          console.log('Puzzle 6 already completed, redirecting to next puzzle...');
          navigate('/puzzle-7');
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

  const executeQuery = async () => {
    const normalizedQuery = query.trim().toUpperCase();
    let results: any[] = [];
    
    if (normalizedQuery.includes('AMOUNT > 10000')) {
      results = database.TRANSACTIONS.filter(row => row.AMOUNT > 10000);
      
      if (results.length > 0 && !puzzleSolved) {
        const newProgress = { ...progress, p6: true, currentPage: 6 };
        await saveGameProgress(newProgress);
        setProgress(newProgress);
        setPuzzleSolved(true);
        
        toast({
          title: "💰 Evidence Discovered!",
          description: "The financial records reveal the motive! Proceeding to final cipher...",
          duration: 3000,
        });

        // Ensure localStorage is updated before navigation
        const playerData = {
          playerName: newProgress.playerName,
          teamId: newProgress.teamId
        };
        localStorage.setItem('wren-manor-player', JSON.stringify(playerData));

        setTimeout(() => {
          navigate('/puzzle-7');
        }, 2000);
      }
    }
    
    setQueryResults(results);
  };

  const handleNext = () => {
    navigate('/puzzle-7');
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
            Puzzle 6 of 9
          </Badge>
          <div className="flex justify-center items-center space-x-3 mb-6">
            <Database className="h-8 w-8 text-primary animate-pulse-blood" />
            <h1 className="font-manor text-4xl font-bold text-foreground">Query the Killer</h1>
            <Terminal className="h-8 w-8 text-accent animate-glow" />
          </div>
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-detective">
            Use SQL queries to search the manor's database and uncover evidence 
            that reveals the killer's motive.
          </p>
        </div>

        <ManorCard>
          <ManorCardHeader>
            <ManorCardTitle>Database Schema</ManorCardTitle>
            <ManorCardDescription>
              Available data in the TRANSACTIONS table:
            </ManorCardDescription>
          </ManorCardHeader>
          <ManorCardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">ID</th>
                    <th className="text-left p-3 font-semibold">NAME</th>
                    <th className="text-left p-3 font-semibold">AMOUNT</th>
                    <th className="text-left p-3 font-semibold">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {database.TRANSACTIONS.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-3">{row.ID}</td>
                      <td className="p-3">{row.NAME}</td>
                      <td className="p-3">£{row.AMOUNT.toLocaleString()}</td>
                      <td className="p-3">{row.DATE}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ManorCardContent>
        </ManorCard>

        <ManorCard>
          <ManorCardHeader>
            <ManorCardTitle>SQL Query Terminal</ManorCardTitle>
            <ManorCardDescription>
              Type your SQL-like query below
            </ManorCardDescription>
          </ManorCardHeader>
          <ManorCardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="query">Query:</Label>
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Write Your Query Here...."
                className="font-mono"
                onKeyDown={(e) => e.key === 'Enter' && executeQuery()}
              />
            </div>
            
            <ManorButton onClick={executeQuery}>Execute Query</ManorButton>
          </ManorCardContent>
        </ManorCard>

        {queryResults.length > 0 && (
          <ManorCard>
            <ManorCardHeader>
              <ManorCardTitle>Query Results</ManorCardTitle>
            </ManorCardHeader>
            <ManorCardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(queryResults[0]).map(key => (
                        <th key={key} className="text-left p-2">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResults.map((row, index) => (
                      <tr key={index} className="border-b">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="p-2">{String(value)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ManorCardContent>
          </ManorCard>
        )}

        {puzzleSolved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ManorCard className="bg-gradient-blood border-primary text-center">
              <ManorCardContent className="pt-6">
                <CheckCircle className="h-16 w-16 text-primary-foreground mx-auto mb-4" />
                <h3 className="font-manor text-2xl text-primary-foreground mb-2">
                  Motive Revealed!
                </h3>
                <p className="text-primary-foreground/90 mb-6">
                  Chef received £12,000 just before the murder. Someone was paying him well!
                </p>
                <ManorButton 
                  onClick={handleNext}
                  variant="secondary"
                  size="lg"
                  className="bg-primary-foreground text-primary"
                >
                  Decode the Pattern
                </ManorButton>
              </ManorCardContent>
            </ManorCard>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Puzzle6;

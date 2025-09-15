// Custom hook to handle game exit
import { useEffect } from 'react';
import { GameProgress } from '@/integrations/firebase/gameState';

export const useGameExitHandler = (progress: GameProgress | null) => {
  useEffect(() => {
    // Only set up exit handling for active games
    if (progress?.startTime > 0 && !progress?.completionTime && progress?.playerName && progress?.teamId) {
      // Pre-import the module so it's ready
      import('@/lib/gameExit').then(module => {
        const saveGameExit = module.saveGameExit;
        
        // Visibilitychange is more reliable than beforeunload for this purpose
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            // User is navigating away, save the exit time
            saveGameExit(progress.playerName, progress.teamId);
          }
        };
        
        // Add event listener for visibility change
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Also handle beforeunload as a backup
        const handleBeforeUnload = () => {
          saveGameExit(progress.playerName, progress.teamId);
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      });
    }
  }, [progress]);
};
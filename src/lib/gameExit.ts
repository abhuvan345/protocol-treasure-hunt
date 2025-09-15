import { database } from '@/integrations/firebase/config';
import { ref, get } from 'firebase/database';
import { saveGameProgress, type GameProgress } from '@/integrations/firebase/gameState';

// Function to save completion time when user exits the game
export const saveGameExit = async (playerName: string, teamId: string): Promise<void> => {
  try {
    // First get the current progress
    const progressRef = ref(database, `gameProgress/${teamId}_${playerName}`);
    const snapshot = await get(progressRef);
    
    if (snapshot.exists()) {
      const currentProgress = snapshot.val() as GameProgress;
      
      // Only update if the game is in progress (has startTime but no completionTime)
      if (currentProgress.startTime > 0 && !currentProgress.completionTime) {
        // Set completion time to now
        const updatedProgress = {
          ...currentProgress,
          completionTime: Date.now()
        };
        
        // Save the updated progress
        await saveGameProgress(updatedProgress);
        console.log('Game exit time saved successfully');
      }
    }
  } catch (error) {
    console.error('Error saving game exit time:', error);
  }
};

// Function to stop the timer when system gets locked
export const handleSystemLock = async (): Promise<void> => {
  try {
    // Get player info from localStorage
    const stored = localStorage.getItem("wren-manor-player");
    
    if (stored) {
      const playerData = JSON.parse(stored);
      const playerName = playerData.playerName;
      const teamId = playerData.teamId;
      
      if (playerName && teamId) {
        await saveGameExit(playerName, teamId);
        console.log('Timer stopped due to system lock');
      }
    }
  } catch (error) {
    console.error('Error stopping timer on system lock:', error);
  }
};
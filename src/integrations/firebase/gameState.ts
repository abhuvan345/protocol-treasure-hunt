import { database } from './config';
import { ref, set, get, push, onValue, off, query, orderByChild, limitToLast, DataSnapshot } from 'firebase/database';

export interface GameProgress {
  playerName: string;
  teamId: string;
  p1: boolean;
  p2: boolean;
  p3: boolean;
  p4: boolean;
  p5: boolean;
  p6: boolean;
  p7: boolean;
  p8: boolean;
  p9: boolean;
  weapon: string;
  killer: string;
  currentPage: number;
  startTime: number;
  completionTime?: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  teamId: string;
  completedPuzzles: number;
  currentProgress: number; // Added to match the usage in the Leaderboard component
  totalTime: number;
  weapon: string;
  killer: string;
  timestamp: number;
  isComplete: boolean;
}

// Save game progress to Firebase
export const saveGameProgress = async (progress: GameProgress): Promise<void> => {
  // Check if system is locked, don't save updates if it is
  if (isSystemLocked()) {
    console.log("⛔ System is locked, ignoring save game progress request");
    return;
  }

  try {
    console.log("🔥 Saving game progress to Firebase:", progress);
    const progressRef = ref(database, `gameProgress/${progress.teamId}_${progress.playerName}`);
    await set(progressRef, {
      ...progress,
      timestamp: Date.now()
    });

    // Always update leaderboard with current progress
    const completedPuzzles = [
      progress.p1, progress.p2, progress.p3, progress.p4, progress.p5,
      progress.p6, progress.p7, progress.p8, progress.p9
    ].filter(Boolean).length;

    const isComplete = completedPuzzles === 9;
    // Calculate time even if not complete to show progress time
    // Only calculate time if startTime is valid (not 0)
    // Always use completionTime if available, otherwise use current time
    const totalTime = progress.startTime > 0 
      ? (progress.completionTime || Date.now()) - progress.startTime
      : 0;

    const leaderboardRef = ref(database, `leaderboard/${progress.teamId}_${progress.playerName}`);
    await set(leaderboardRef, {
      id: `${progress.teamId}_${progress.playerName}`,
      playerName: progress.playerName,
      teamId: progress.teamId,
      completedPuzzles,
      currentProgress: completedPuzzles, // Ensure currentProgress matches completedPuzzles
      totalTime,
      weapon: progress.weapon,
      killer: progress.killer,
      timestamp: Date.now(),
      isComplete
    });

    console.log('Game progress saved to Firebase successfully');
  } catch (error) {
    console.error('Error saving game progress to Firebase:', error);
    throw error;
  }
};

// Get game progress from Firebase
export const getGameProgress = async (playerName: string, teamId: string): Promise<GameProgress> => {
  try {
    const progressRef = ref(database, `gameProgress/${teamId}_${playerName}`);
    const snapshot = await get(progressRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return data as GameProgress;
    } else {
      // Return default progress if none exists
      return {
        playerName,
        teamId,
        p1: false, p2: false, p3: false, p4: false, p5: false,
        p6: false, p7: false, p8: false, p9: false,
        weapon: '', killer: '', currentPage: 0,
        startTime: 0 // Initialize with 0, will be set properly when game starts
      };
    }
  } catch (error) {
    console.error('Error getting game progress from Firebase:', error);
    throw error;
  }
};

// Get leaderboard from Firebase
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const leaderboardRef = ref(database, 'leaderboard');
    const snapshot = await get(leaderboardRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const entries: LeaderboardEntry[] = Object.values(data);
      
      // Sort by completion status, then by puzzles completed, then by time
      return entries.sort((a, b) => {
        // First sort by completion status
        if (a.isComplete && !b.isComplete) return -1;
        if (!a.isComplete && b.isComplete) return 1;
        
        // If both have the same completion status, sort by number of completed puzzles
        if (a.completedPuzzles !== b.completedPuzzles) {
          return b.completedPuzzles - a.completedPuzzles;
        }
        
        // If both have completed the same number of puzzles and both are complete, sort by completion time
        if (a.isComplete && b.isComplete) {
          return a.totalTime - b.totalTime;
        }
        
        // If both have the same number of puzzles but aren't complete, sort by timestamp (most recent first)
        return b.timestamp - a.timestamp;
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error getting leaderboard from Firebase:', error);
    return [];
  }
};

// Reset game progress
export const resetGameProgress = async (playerName: string, teamId: string): Promise<void> => {
  try {
    const progressRef = ref(database, `gameProgress/${teamId}_${playerName}`);
    const leaderboardRef = ref(database, `leaderboard/${teamId}_${playerName}`);
    
    await set(progressRef, null);
    await set(leaderboardRef, null);
    
    console.log('Game progress reset successfully');
  } catch (error) {
    console.error('Error resetting game progress:', error);
    throw error;
  }
};

// Real-time listener for leaderboard changes
export const subscribeToLeaderboard = (callback: (leaderboard: LeaderboardEntry[]) => void) => {
  console.log("🔥 Setting up Firebase leaderboard subscription...");
  const leaderboardRef = ref(database, 'leaderboard');
  console.log("📍 Database reference:", leaderboardRef);
  
  const unsubscribe = onValue(leaderboardRef, (snapshot) => {
    console.log("🎯 Firebase leaderboard data received:", snapshot.exists() ? "Data exists" : "No data");
    
    // Check system lock status for logging purposes only
    const systemLocked = isSystemLocked();
    if (systemLocked) {
      console.log("⚠️ System is locked, but still showing leaderboard data (read-only)");
    }
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log("📊 Raw leaderboard data:", data);
      const entries: LeaderboardEntry[] = Object.values(data);
      console.log("📋 Parsed entries:", entries);
      
      // Sort entries
      const sortedEntries = entries.sort((a, b) => {
        if (a.isComplete && !b.isComplete) return -1;
        if (!a.isComplete && b.isComplete) return 1;
        if (a.completedPuzzles !== b.completedPuzzles) {
          return b.completedPuzzles - a.completedPuzzles;
        }
        if (a.isComplete && b.isComplete) {
          return a.totalTime - b.totalTime;
        }
        return b.timestamp - a.timestamp;
      });
      
      console.log("✅ Calling callback with sorted entries:", sortedEntries);
      callback(sortedEntries);
    } else {
      console.log("📭 No leaderboard data found, returning empty array");
      callback([]);
    }
  }, (error) => {
    console.error("🚨 Firebase leaderboard subscription error:", error);
  });

  return unsubscribe;
};

import { isSystemLocked } from "@/lib/utils";

// Real-time listener for game progress changes
export const subscribeToGameProgress = (playerName: string, teamId: string, callback: (progress: GameProgress | null) => void) => {
  const progressRef = ref(database, `gameProgress/${teamId}_${playerName}`);
  
  const unsubscribe = onValue(progressRef, (snapshot) => {
    // Check system lock status but always show data (read-only)
    const systemLocked = isSystemLocked();
    if (systemLocked) {
      console.log("⚠️ System is locked, but still showing game progress (read-only)");
    }
    
    if (snapshot.exists()) {
      callback(snapshot.val() as GameProgress);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};
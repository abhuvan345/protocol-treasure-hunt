import { useState, useEffect } from 'react';

/**
 * Custom hook to track elapsed time in real-time from a given start time
 * @param startTimeMs The timestamp when the timer started (in milliseconds)
 * @param endTimeMs Optional timestamp when the timer ended (for completed games)
 * @param isActive Whether the timer should be actively updating
 * @returns The current elapsed time in milliseconds
 */
export const useElapsedTime = (startTimeMs: number, endTimeMs?: number, isActive = true): number => {
  // Calculate the initial elapsed time
  const initialElapsedTime = endTimeMs && endTimeMs > startTimeMs 
    ? endTimeMs - startTimeMs 
    : startTimeMs > 0 
      ? Date.now() - startTimeMs 
      : 0;
      
  const [elapsedTime, setElapsedTime] = useState<number>(initialElapsedTime);
  
  useEffect(() => {
    // If we have an end time, this is a completed game with fixed duration
    if (endTimeMs && endTimeMs > startTimeMs) {
      setElapsedTime(endTimeMs - startTimeMs);
      return; // No need for interval updates
    }
    
    // Only run the timer if it's active and we have a valid start time
    if (!isActive || startTimeMs <= 0) {
      setElapsedTime(0);
      return;
    }
    
    // Set initial value immediately
    setElapsedTime(Date.now() - startTimeMs);
    
    // Update the timer every second
    const intervalId = setInterval(() => {
      setElapsedTime(Date.now() - startTimeMs);
    }, 1000);
    
    // Clean up the interval on unmount
    return () => clearInterval(intervalId);
  }, [startTimeMs, endTimeMs, isActive]);
  
  return elapsedTime;
};

/**
 * Format milliseconds into a readable time string (MM:SS or HH:MM:SS format)
 */
export const formatElapsedTime = (milliseconds: number, includeHours = false): string => {
  if (!milliseconds || milliseconds <= 0) return "00:00";
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  // Format with hours if requested or if time exceeds 1 hour
  if (includeHours || hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format milliseconds into a readable time string with units (e.g., "5m 30s")
 */
export const formatElapsedTimeWithUnits = (milliseconds: number): string => {
  if (!milliseconds || milliseconds <= 0) return "N/A";
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};
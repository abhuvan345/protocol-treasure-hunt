import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import {
  formatElapsedTime,
  formatElapsedTimeWithUnits,
} from "@/hooks/use-elapsed-time";
import { isSystemLocked } from "@/lib/utils";

interface TimerProps {
  startTime: number;
  endTime?: number;
  isActive?: boolean;
  showIcon?: boolean;
  format?: "compact" | "withUnits";
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  animate?: boolean;
  fallback?: string;
}

export const Timer = ({
  startTime,
  endTime,
  isActive = true,
  showIcon = true,
  format = "compact",
  className = "",
  iconClassName = "h-4 w-4 mr-1",
  textClassName = "",
  animate = true,
  fallback = "00:00",
}: TimerProps & {
  animate?: boolean;
  fallback?: string;
}) => {
  const [elapsed, setElapsed] = useState<number>(
    calculateElapsedTime(startTime, endTime)
  );

  // Calculate the elapsed time based on start and optional end time
  function calculateElapsedTime(start: number, end?: number): number {
    // Check system lock status using utility function
    if (start <= 0 || isSystemLocked()) return 0;

    if (end && end > start) {
      return end - start;
    } else {
      return Date.now() - start;
    }
  }

  // Only update the timer if it's active and not yet ended
  useEffect(() => {
    // Don't even start if system is locked using our utility function
    if (isSystemLocked()) {
      setElapsed(0);
      return;
    }

    // For completed games, or inactive timers, just set the final value and don't start interval
    if (
      !isActive ||
      !startTime ||
      startTime <= 0 ||
      (endTime && endTime > startTime)
    ) {
      // Set fixed value for completed timers
      setElapsed(calculateElapsedTime(startTime, endTime));
      return; // No interval needed
    }

    // Update immediately for active timers
    setElapsed(calculateElapsedTime(startTime));

    // Only set interval for active, ongoing timers
    if (animate && !endTime) {
      const intervalId = setInterval(() => {
        // Check system lock on each interval to stop timers if system gets locked
        if (isSystemLocked()) {
          clearInterval(intervalId);
          setElapsed(0); // Reset to 0 when locked
          return;
        }
        setElapsed(calculateElapsedTime(startTime));
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [startTime, endTime, isActive, animate]);

  // Format the time based on the chosen format
  const formattedTime = isSystemLocked()
    ? "00:00" // System locked, show zeros
    : elapsed > 0
    ? format === "compact"
      ? formatElapsedTime(elapsed)
      : formatElapsedTimeWithUnits(elapsed)
    : fallback;

  // Only animate if timer is active, ongoing (no endTime), animation is enabled, and system is not locked
  const shouldAnimate = animate && isActive && !endTime && !isSystemLocked();

  return (
    <div className={`flex items-center ${className}`}>
      {showIcon && <Clock className={iconClassName} />}
      <span
        className={`${shouldAnimate ? "animate-pulse" : ""} ${textClassName}`}
      >
        {formattedTime}
      </span>
    </div>
  );
};

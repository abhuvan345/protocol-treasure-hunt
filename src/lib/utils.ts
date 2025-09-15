import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if the system is locked due to a game violation or completion
 * @returns boolean True if the system is locked, false otherwise
 */
export function isSystemLocked(): boolean {
  return localStorage.getItem("wren-manor-system-completed") === "true";
}

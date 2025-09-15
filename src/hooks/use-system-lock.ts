import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const useSystemLockCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Check system lock status immediately when the hook is used
    const checkSystemLock = () => {
      const systemCompleted = localStorage.getItem('wren-manor-system-completed');
      if (systemCompleted === 'true') {
        setIsLocked(true);
        
        toast({
          title: "System Locked",
          description: "This system has been locked due to a game violation. Please try from a different device.",
          variant: "destructive",
          duration: 10000,
        });
        
        // Stop all intervals in the application
        const highestTimeoutId = setTimeout(() => {}, 0);
        for (let i = 0; i < Number(highestTimeoutId); i++) {
          clearTimeout(i);
          clearInterval(i);
        }
        
        // Redirect to home page after short delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
        
        return true;
      }
      return false;
    };

    const isLocked = checkSystemLock();
    if (!isLocked) {
      // Set up an interval to periodically check for system lock
      const intervalId = setInterval(checkSystemLock, 5000);
      return () => clearInterval(intervalId);
    }
  }, [navigate, toast]);
};
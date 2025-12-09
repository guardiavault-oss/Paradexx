import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Clock, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface SessionTimeoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onLogout?: () => void;
}

export function SessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onLogout,
}: SessionTimeoutProps) {
  const [location] = useLocation();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  // Use ref to avoid infinite loop - lastActivity doesn't need to trigger re-renders
  const lastActivityRef = useRef(Date.now());
  const showWarningRef = useRef(false);

  // Use ref for onLogout to avoid recreating handleLogout
  const onLogoutRef = useRef(onLogout);
  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  // Memoize handleLogout with stable dependencies
  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      const { logError } = await import("../utils/logger");
      logError(error instanceof Error ? error : new Error(String(error)), {
        context: "SessionTimeout_logout",
      });
    } finally {
      if (onLogoutRef.current) {
        onLogoutRef.current();
      } else {
        window.location.href = "/login";
      }
    }
  }, []); // Empty deps - onLogout accessed via ref

  // Only show session timeout on authenticated pages
  const isAuthenticatedPage = location.startsWith("/dashboard") ||
                              location.startsWith("/create-vault") ||
                              location.startsWith("/recover") ||
                              location.startsWith("/setup-recovery");

  useEffect(() => {
    // Early return if not on authenticated page - but hooks are already called
    if (!isAuthenticatedPage) return;

    // Track user activity
    const activities = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (showWarningRef.current) {
        setShowWarning(false);
        showWarningRef.current = false;
        setTimeRemaining(null);
      }
    };

    activities.forEach((activity) => {
      window.addEventListener(activity, handleActivity, { passive: true });
    });

    // Check session timeout
    const checkInterval = setInterval(() => {
      const inactiveTime = (Date.now() - lastActivityRef.current) / 1000 / 60; // minutes
      const remaining = timeoutMinutes - inactiveTime;

      if (remaining <= 0) {
        // Session expired
        handleLogout();
      } else if (remaining <= warningMinutes && !showWarningRef.current) {
        setTimeRemaining(Math.ceil(remaining));
        setShowWarning(true);
        showWarningRef.current = true;
      } else if (remaining > warningMinutes) {
        if (showWarningRef.current) {
          setShowWarning(false);
          showWarningRef.current = false;
        }
        setTimeRemaining(null);
      } else if (showWarningRef.current) {
        setTimeRemaining(Math.ceil(remaining));
      }
    }, 1000); // Check every second

    return () => {
      clearInterval(checkInterval);
      activities.forEach((activity) => {
        window.removeEventListener(activity, handleActivity);
      });
    };
  }, [timeoutMinutes, warningMinutes, handleLogout, isAuthenticatedPage]);

  const handleExtend = () => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    showWarningRef.current = false;
    setTimeRemaining(null);
  };

  // Early return AFTER all hooks are called
  if (!isAuthenticatedPage) return null;

  return (
    <>
      {showWarning && timeRemaining !== null && (
        <Dialog open={showWarning} onOpenChange={setShowWarning}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                Session Timeout Warning
              </DialogTitle>
              <DialogDescription>
                Your session will expire in {timeRemaining} minute
                {timeRemaining !== 1 ? "s" : ""}. Please extend your session to continue working.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
              <Button
                onClick={handleExtend}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Extend Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

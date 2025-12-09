import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setIsVisible(true);
      // Auto-hide after showing online status
      setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setWasOffline(false), 300);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setIsVisible(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!wasOffline) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl ${
          isOnline
            ? "bg-emerald-500/90 text-white border border-emerald-400/50"
            : "bg-red-500/90 text-white border border-red-400/50"
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-5 h-5" />
            <span className="text-sm font-medium">Connection restored</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5" />
            <span className="text-sm font-medium">No internet connection</span>
          </>
        )}
      </div>
    </div>
  );
}


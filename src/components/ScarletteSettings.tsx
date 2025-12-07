import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, Save, X } from "lucide-react";

interface ScarletteSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  type: "degen" | "regen";
}

export function ScarletteSettings({
  isOpen,
  onClose,
  type,
}: ScarletteSettingsProps) {
  const isDegen = type === "degen";
  const primaryColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";
  
  const [useWebSocket, setUseWebSocket] = useState(true);
  const [blockchainFocus, setBlockchainFocus] = useState("ethereum");
  const [autoExecuteTasks, setAutoExecuteTasks] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('scarlette_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setUseWebSocket(settings.useWebSocket ?? true);
        setBlockchainFocus(settings.blockchainFocus ?? "ethereum");
        setAutoExecuteTasks(settings.autoExecuteTasks ?? true);
      } catch (err) {
        console.error('Failed to load Scarlette settings:', err);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const settings = {
        useWebSocket,
        blockchainFocus,
        autoExecuteTasks,
      };
      
      localStorage.setItem('scarlette_settings', JSON.stringify(settings));
      
      setTimeout(() => {
        setSaving(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl p-6 max-w-md w-full shadow-2xl"
        style={{
          background: "rgba(0, 0, 0, 0.9)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${primaryColor}40`,
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" style={{ color: primaryColor }} />
            <h2 className="text-xl text-white">Scarlette Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ 
              background: "rgba(255, 255, 255, 0.05)",
            }}
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="space-y-6">
          {/* WebSocket Setting */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Real-time Chat</p>
                <p className="text-sm text-white/60">
                  Use WebSocket for instant responses
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={useWebSocket}
                  onChange={(e) => setUseWebSocket(e.target.checked)}
                  className="sr-only peer"
                />
                <div 
                  className="w-11 h-6 rounded-full peer transition-all cursor-pointer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{
                    background: useWebSocket ? primaryColor : "rgba(255, 255, 255, 0.1)",
                  }}
                  onClick={() => setUseWebSocket(!useWebSocket)}
                />
              </div>
            </label>
          </div>

          {/* Blockchain Focus */}
          <div>
            <label className="block mb-2">
              <p className="text-white font-medium mb-1">Default Blockchain</p>
              <p className="text-sm text-white/60 mb-2">
                Primary blockchain for analysis
              </p>
              <select
                value={blockchainFocus}
                onChange={(e) => setBlockchainFocus(e.target.value)}
                className="w-full rounded-lg px-4 py-2 text-white focus:outline-none"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${primaryColor}40`,
                }}
              >
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="arbitrum">Arbitrum</option>
                <option value="optimism">Optimism</option>
                <option value="bsc">BNB Chain</option>
                <option value="base">Base</option>
              </select>
            </label>
          </div>

          {/* Auto Execute Tasks */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Auto Execute Tasks</p>
                <p className="text-sm text-white/60">
                  Automatically execute AI tasks when requested
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={autoExecuteTasks}
                  onChange={(e) => setAutoExecuteTasks(e.target.checked)}
                  className="sr-only peer"
                />
                <div 
                  className="w-11 h-6 rounded-full peer transition-all cursor-pointer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                  style={{
                    background: autoExecuteTasks ? primaryColor : "rgba(255, 255, 255, 0.1)",
                  }}
                  onClick={() => setAutoExecuteTasks(!autoExecuteTasks)}
                />
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-white rounded-lg transition-colors"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: primaryColor,
            }}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, ArrowUp, History, Settings, Trash2, Plus, Brain } from "lucide-react";
import { GlowingBall } from "./ui/GlowingBall";
import { ScarletteSettings } from "./ScarletteSettings";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Session {
  id: string;
  name: string;
  createdAt: string;
  messageCount: number;
}

interface ScarletteChatProps {
  isOpen: boolean;
  onClose: () => void;
  type: "degen" | "regen";
}

const degenPrompts = [
  "Find me high APY opportunities",
  "Analyze this token contract: 0x...",
  "What are the hottest meme coins?",
  "Show me trending DEX pairs",
  "Scan for rug pull risks",
  "Find flash loan opportunities",
];

const regenPrompts = [
  "Is this address safe?",
  "Explain vault triggers",
  "How do I add a guardian?",
  "What is MEV protection?",
  "Analyze contract security: 0x...",
  "Review this transaction risk",
];

export function ScarletteChat({
  isOpen,
  onClose,
  type,
}: ScarletteChatProps) {
  const isDegen = type === "degen";
  const primaryColor = isDegen ? "#DC143C" : "#0080FF";
  const secondaryColor = isDegen ? "#8B0000" : "#000080";
  const suggestedPrompts = isDegen ? degenPrompts : regenPrompts;

  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConnected] = useState(true); // Simulated connection status
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mock sessions
  useEffect(() => {
    if (isOpen) {
      setSessions([
        {
          id: "session-1",
          name: "Security Analysis",
          createdAt: new Date().toISOString(),
          messageCount: 12,
        },
        {
          id: "session-2",
          name: "Token Research",
          createdAt: new Date().toISOString(),
          messageCount: 8,
        },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [localMessages]);

  const createNewSession = () => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      name: `Session ${sessions.length + 1}`,
      createdAt: new Date().toISOString(),
      messageCount: 0,
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    setLocalMessages([]);
    setShowSessions(false);
  };

  const deleteSession = (sessionIdToDelete: string) => {
    setSessions(sessions.filter(s => s.id !== sessionIdToDelete));
    if (sessionIdToDelete === currentSessionId) {
      setCurrentSessionId(undefined);
      setLocalMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setLocalMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue("");
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: generateMockResponse(messageToSend, isDegen),
        timestamp: new Date(),
      };
      setLocalMessages((prev) => [...prev, aiResponse]);
      setLoading(false);
    }, 1500);
  };

  const generateMockResponse = (message: string, isDegen: boolean): string => {
    if (message.toLowerCase().includes("safe") || message.toLowerCase().includes("security")) {
      return isDegen 
        ? "⚠️ High risk, high reward! This contract shows minimal security audits but has 10,000% APY potential. DYOR and ape responsibly! 🚀"
        : "✅ Security Analysis: This address has been verified on multiple block explorers. No red flags detected. Contract has been audited by CertiK with an 85/100 score.";
    }
    
    if (message.toLowerCase().includes("guardian") || message.toLowerCase().includes("vault")) {
      return "I can help you set up a guardian! Guardians are trusted contacts who can help recover your vault in emergencies. You'll need to provide their wallet address and set trigger conditions.";
    }
    
    if (message.toLowerCase().includes("mev") || message.toLowerCase().includes("protection")) {
      return "MEV Protection shields your transactions from front-running and sandwich attacks. It routes trades through private mempools, ensuring you get the best price without being exploited by MEV bots.";
    }

    return isDegen
      ? "🔥 Looking for alpha? I'm analyzing on-chain data for the spiciest opportunities. Remember: not financial advice, just pure degen energy! LFG! 🚀💎"
      : "I'm here to help you make informed, secure decisions. Let me know if you need contract analysis, security reviews, or vault management assistance.";
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Main Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
            }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-[70] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            style={{
              background: "rgba(0, 0, 0, 0.95)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${primaryColor}40`,
              boxShadow: `0 20px 80px ${primaryColor}40`,
            }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between px-6 py-4"
              style={{
                borderBottom: `1px solid ${primaryColor}20`,
                background: "rgba(0, 0, 0, 0.4)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12">
                  <GlowingBall className="w-full h-full" type={type} />
                </div>
                <div>
                  <h3 className="text-white flex items-center gap-2">
                    Scarlette
                    {isConnected && (
                      <span 
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ background: primaryColor }}
                      />
                    )}
                  </h3>
                  <p className="text-xs text-white/60">
                    {isDegen ? "Degen" : "Regen"} AI Assistant 
                    {currentSessionId && ` • Session ${currentSessionId.slice(-8)}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSessions(!showSessions)}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    background: showSessions ? `${primaryColor}20` : "rgba(255, 255, 255, 0.05)",
                  }}
                  title="Sessions"
                >
                  <History className="w-5 h-5 text-white/80" />
                </button>
                <button
                  onClick={() => setShowSettingsPanel(true)}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                  }}
                  title="Settings"
                >
                  <Settings className="w-5 h-5 text-white/80" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>
            </div>

            {/* Sessions Sidebar */}
            <AnimatePresence>
              {showSessions && (
                <motion.div
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  className="absolute left-0 top-16 bottom-0 w-64 border-r z-10 overflow-y-auto"
                  style={{
                    background: "rgba(0, 0, 0, 0.9)",
                    borderColor: `${primaryColor}20`,
                  }}
                >
                  <div className="p-4">
                    <button
                      onClick={createNewSession}
                      className="w-full flex items-center gap-2 p-3 text-white rounded-lg transition-colors mb-4"
                      style={{
                        background: primaryColor,
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      New Session
                    </button>
                    
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="p-3 rounded-lg cursor-pointer transition-colors"
                          style={{
                            background: session.id === currentSessionId 
                              ? `${primaryColor}20` 
                              : "rgba(255, 255, 255, 0.05)",
                            border: session.id === currentSessionId 
                              ? `1px solid ${primaryColor}` 
                              : "1px solid transparent",
                          }}
                          onClick={() => {
                            setCurrentSessionId(session.id);
                            setShowSessions(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">
                                {session.name || `Session ${session.id.slice(-8)}`}
                              </p>
                              <p className="text-xs text-white/60">
                                {session.messageCount} messages
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                              }}
                              className="p-1 rounded"
                              style={{
                                background: "rgba(255, 255, 255, 0.05)",
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-white/60" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
              {localMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8" style={{ marginTop: "-80px" }}>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-32 h-32"
                  >
                    <GlowingBall className="w-full h-full" type={type} />
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <h2 className="text-2xl text-white">
                      {isDegen ? "Ready to find alpha? 🚀" : "How can I help you today?"}
                    </h2>
                    <p className="text-sm text-white/60">
                      {isDegen 
                        ? "I can help with token analysis, finding opportunities, and risk assessment" 
                        : "I can help with security analysis, transaction reviews, vault management, and wallet questions"}
                    </p>
                  </motion.div>

                  {/* Suggested Prompts */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl"
                  >
                    {suggestedPrompts.map((prompt, index) => (
                      <motion.button
                        key={index}
                        whileHover={{
                          scale: 1.02,
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePromptClick(prompt)}
                        className="p-4 rounded-xl text-left text-sm text-white transition-all"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: `1px solid ${primaryColor}20`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles 
                            className="w-4 h-4 flex-shrink-0" 
                            style={{ color: primaryColor }}
                          />
                          <span>{prompt}</span>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {localMessages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex gap-4 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.type === "assistant" && (
                        <div className="w-8 h-8 flex-shrink-0">
                          <GlowingBall className="w-full h-full" type={type} />
                        </div>
                      )}

                      <div
                        className="max-w-[80%] p-4 rounded-2xl"
                        style={{
                          background: message.type === "user"
                            ? primaryColor
                            : "rgba(255, 255, 255, 0.05)",
                          border: message.type === "assistant" 
                            ? `1px solid ${primaryColor}20`
                            : "none",
                          color: "#ffffff",
                        }}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </div>

                      {message.type === "user" && (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: primaryColor }}
                        >
                          <span className="text-xs text-white font-bold">You</span>
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4"
                    >
                      <div className="w-8 h-8 flex-shrink-0">
                        <GlowingBall className="w-full h-full" type={type} />
                      </div>
                      <div 
                        className="p-4 rounded-2xl"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: `1px solid ${primaryColor}20`,
                        }}
                      >
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                delay: i * 0.2,
                              }}
                              className="w-2 h-2 rounded-full"
                              style={{ background: primaryColor }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div 
              className="p-4 md:p-6"
              style={{
                borderTop: `1px solid ${primaryColor}20`,
                background: "rgba(0, 0, 0, 0.4)",
              }}
            >
              <div className="max-w-3xl mx-auto">
                <div 
                  className="relative flex items-end gap-3 rounded-2xl p-3 transition-colors"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${primaryColor}40`,
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isDegen ? "What alpha are you hunting? 🎯" : "Message Scarlette..."}
                    className="flex-1 bg-transparent text-white placeholder-white/40 outline-none resize-none min-h-[24px] max-h-[120px] text-sm py-1"
                    rows={1}
                    style={{
                      lineHeight: "1.5",
                      height: "auto",
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = target.scrollHeight + "px";
                    }}
                  />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || loading}
                    className="p-2 rounded-xl transition-all flex-shrink-0 text-white"
                    style={{
                      background: inputValue.trim() ? primaryColor : "rgba(255, 255, 255, 0.1)",
                      opacity: inputValue.trim() ? 1 : 0.5,
                      cursor: inputValue.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </motion.button>
                </div>

                <p className="text-xs text-white/40 text-center mt-3">
                  Scarlette can make mistakes. Consider checking important information.
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Settings Modal */}
          <ScarletteSettings
            isOpen={showSettingsPanel}
            onClose={() => setShowSettingsPanel(false)}
            type={type}
          />
        </>
      )}
    </AnimatePresence>
  );
}
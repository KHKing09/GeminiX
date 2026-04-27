import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  MessageSquare, 
  Settings, 
  History, 
  Search, 
  PenTool, 
  Code, 
  Zap, 
  Image as ImageIcon,
  Menu,
  X,
  User,
  Moon,
  Sun,
  ChevronRight,
  LogOut,
  Download,
  Trash2
} from "lucide-react";
import { cn, formatDate } from "./lib/utils";
import { Storage, type ChatSession, type ChatMessage, type UserProfile, type AppSettings } from "./lib/storage";
import { chatWithGemini, MODULE_INSTRUCTIONS } from "./lib/gemini";
import ReactMarkdown from "react-markdown";

// --- Components ---

const Sidebar = ({ 
  chats, 
  currentChatId, 
  onChatSelect, 
  onNewChat, 
  onDeleteChat,
  onOpenSettings,
  isOpen,
  setIsOpen 
}: { 
  chats: ChatSession[];
  currentChatId: string | null;
  onChatSelect: (id: string) => void;
  onNewChat: (module?: string) => void;
  onDeleteChat: (id: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredChats = chats.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 w-72 h-full transition-transform duration-300 ease-in-out bg-minimal-sidebar border-r border-white/5 flex flex-col p-5 md:relative md:translate-x-0",
      !isOpen && "-translate-x-full"
    )}>
      <div className="flex items-center space-x-3 px-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-400 shadow-lg shadow-indigo-500/20"></div>
        <span className="text-lg font-semibold tracking-tight text-white font-display">GiminiX</span>
        <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-2 text-zinc-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-6 px-1">
        <button 
          onClick={() => onNewChat()}
          className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-medium text-white"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-hidden px-1">
        <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">Recent History</div>
        <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
          {filteredChats.map((chat) => (
            <div 
              key={chat.id}
              className={cn(
                "group flex items-center justify-between p-2.5 rounded-lg text-sm cursor-pointer transition-all",
                currentChatId === chat.id 
                  ? "bg-white/10 text-white" 
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
              onClick={() => onChatSelect(chat.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className="w-4 h-4 shrink-0 opacity-50" />
                <span className="truncate">{chat.title}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-200 uppercase">JD</div>
            <div className="text-sm font-medium text-white">Guest User</div>
          </div>
          <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Pro</div>
        </div>
        <div className="flex justify-between items-center px-2">
           <button 
            onClick={onOpenSettings}
            className="text-[11px] text-gray-500 hover:text-white transition-colors flex items-center gap-2"
          >
            <Settings className="w-3 h-3" />
            v2.4.0 High-Perf
          </button>
          <div className="w-8 h-4 rounded-full bg-white/10 relative cursor-pointer">
             <div className="absolute left-1 top-1 w-2 h-2 rounded-full bg-white"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === "user";
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full mb-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[85%] rounded-2xl p-5 shadow-sm relative group mb-6",
        isUser 
          ? "bg-white/10 text-white rounded-tr-none border border-white/5" 
          : "bg-[#1A1A1E] border border-white/10 text-gray-200 rounded-tl-none shadow-xl"
      )}>
        {!isUser && (
          <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-aura-500/20 flex items-center justify-center border border-aura-500/30">
            <Zap className="w-4 h-4 text-aura-400" />
          </div>
        )}
        
        <div className="markdown-body text-sm leading-relaxed">
          {message.parts.map((part, i) => (
            <React.Fragment key={i}>
              {part.text && <ReactMarkdown>{part.text}</ReactMarkdown>}
              {part.inlineData && (
                <img 
                  src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                  alt="Uploaded" 
                  className="rounded-lg mt-2 max-h-64 object-contain shadow-md"
                />
              )}
            </React.Fragment>
          ))}
        </div>
        
        <div className={cn(
          "text-[10px] mt-2 opacity-50",
          isUser ? "text-right" : "text-left"
        )}>
          {formatDate(message.timestamp)}
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState("general");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadedChats = Storage.getChats();
    setChats(loadedChats);
    if (loadedChats.length > 0) {
      setCurrentChatId(loadedChats[0].id);
    } else {
      const newChat = Storage.createChat();
      setChats([newChat]);
      setCurrentChatId(newChat.id);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats, currentChatId]);

  const currentChat = chats.find(c => c.id === currentChatId);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;
    if (!currentChatId) return;

    const userParts: any[] = [{ text: inputMessage }];
    if (selectedImage) {
      userParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: selectedImage.split(",")[1]
        }
      });
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: userParts,
      timestamp: Date.now()
    };

    Storage.addMessageToChat(currentChatId, userMsg);
    setChats(Storage.getChats());
    setInputMessage("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const chat = Storage.getChats().find(c => c.id === currentChatId)!;
      const responseText = await chatWithGemini(chat.messages, MODULE_INSTRUCTIONS[activeModule as keyof typeof MODULE_INSTRUCTIONS]);
      
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "model",
        parts: [{ text: responseText }],
        timestamp: Date.now()
      };

      Storage.addMessageToChat(currentChatId, botMsg);
      
      // Update local state and title if first message
      const updatedChats = Storage.getChats();
      if (chat.messages.length <= 2) {
        const index = updatedChats.findIndex(c => c.id === currentChatId);
        updatedChats[index].title = inputMessage.slice(0, 30) + (inputMessage.length > 30 ? "..." : "");
        Storage.saveChats(updatedChats);
      }
      setChats(updatedChats);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleNewChat = (module: string = "general") => {
    const newChat = Storage.createChat(module);
    setChats(Storage.getChats());
    setCurrentChatId(newChat.id);
    setActiveModule(module);
  };

  const handleDeleteChat = (id: string) => {
    const updated = chats.filter(c => c.id !== id);
    Storage.saveChats(updated);
    setChats(updated);
    if (currentChatId === id) {
      setCurrentChatId(updated[0]?.id || null);
    }
  };

  return (
    <div className="flex h-screen bg-minimal-bg text-gray-200 overflow-hidden font-sans">
      <Sidebar 
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={setCurrentChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col relative h-full">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-minimal-bg border-b border-white/5 shrink-0 z-10">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className={cn("p-2 hover:bg-white/5 rounded-lg md:hidden", isSidebarOpen && "hidden")}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex space-x-6 text-sm font-medium text-gray-400">
              <span className={cn("cursor-pointer transition-colors", activeModule === 'general' ? "text-white" : "hover:text-white")} onClick={() => setActiveModule('general')}>Chat</span>
              <span className={cn("cursor-pointer transition-colors", activeModule === 'coder' ? "text-white" : "hover:text-white")} onClick={() => setActiveModule('coder')}>Code</span>
              <span className={cn("cursor-pointer transition-colors", activeModule === 'writer' ? "text-white" : "hover:text-white")} onClick={() => setActiveModule('writer')}>Creative</span>
              <span className={cn("cursor-pointer transition-colors", activeModule === 'productivity' ? "text-white" : "hover:text-white")} onClick={() => setActiveModule('productivity')}>Work</span>
            </div>
            <div className="md:hidden flex flex-col">
              <h2 className="font-display font-semibold text-xs tracking-widest uppercase text-blue-400">
                {activeModule.toUpperCase()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentChat && currentChat.messages.length > 0 && (
              <div className="flex space-x-2 bg-white/5 p-1 rounded-lg">
                <button 
                  onClick={() => Storage.exportToPDF(currentChat)}
                  className="px-3 py-1 text-xs rounded bg-white/10 text-white font-medium transition-all hover:bg-white/20"
                >
                  Export PDF
                </button>
              </div>
            )}
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer">
               <Settings className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4">
          {currentChat?.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-12 max-w-2xl mx-auto py-12">
              <h1 className="text-5xl font-display font-semibold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                How can I help you today?
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[
                  { icon: PenTool, label: "Compose a professional email for a project proposal.", category: "Writing Assistant", color: "text-blue-400", border: "hover:border-blue-500/50" },
                  { icon: Code, label: "Debug a React useEffect hook with dependency issues.", category: "Code Expert", color: "text-purple-400", border: "hover:border-purple-500/50" },
                  { icon: History, label: "Summarize this complex legal document into key bullets.", category: "Productivity Suite", color: "text-pink-400", border: "hover:border-pink-500/50" },
                  { icon: ImageIcon, label: "Suggest color palettes based on this moodboard.", category: "Vision & Design", color: "text-indigo-400", border: "hover:border-indigo-500/50" },
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => setInputMessage(item.label)}
                    className={cn(
                      "p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer group transition-all text-left flex flex-col gap-2",
                      item.border
                    )}
                  >
                    <div className={cn("font-bold text-[10px] uppercase tracking-[0.2em]", item.color)}>{item.category}</div>
                    <p className="text-sm text-gray-300 leading-relaxed">{item.label}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-2">
              {currentChat?.messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex gap-2 items-center text-blue-400 text-sm font-medium animate-pulse ml-12 mb-8">
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="ml-2 font-display uppercase tracking-widest text-[10px]">Processing...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-8">
          <div className="max-w-3xl mx-auto relative">
            <AnimatePresence>
              {selectedImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-full mb-4 left-0 p-3 bg-minimal-input border border-white/10 rounded-2xl flex items-center gap-3 z-20 shadow-2xl"
                >
                  <img src={selectedImage} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-400 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-minimal-input border border-white/10 rounded-2xl p-3 flex items-end gap-3 shadow-2xl shadow-black/50 focus-within:border-blue-500/30 transition-all">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <Plus className="w-6 h-6 stroke-[1.5]" />
              </button>
              
              <textarea 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                placeholder={`Message Aura...`}
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-200 resize-none h-10 py-2 placeholder-gray-600 outline-none"
              />

              <div className="flex items-center space-x-2 pb-0.5">
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95",
                    (inputMessage.trim() || selectedImage) 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
                      : "bg-white/5 text-gray-600 cursor-not-allowed"
                  )}
                >
                  <Zap className={cn("w-5 h-5", (inputMessage.trim() || selectedImage) ? "fill-white" : "")} />
                </button>
              </div>
            </div>
            <div className="text-center mt-3 text-[10px] text-gray-600 tracking-tight">
              GiminiX may display inaccurate info, including about people, so double-check its responses.
            </div>
          </div>
        </div>
      </main>

      {/* Profile/Settings Modal (Simplification) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md glass-panel rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-bold font-display tracking-tight">System Settings</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active AI Module</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "general", label: "General", icon: MessageSquare },
                      { id: "coder", label: "Coder", icon: Code },
                      { id: "writer", label: "Writer", icon: PenTool },
                      { id: "productivity", label: "Suites", icon: History },
                    ].map((mod) => (
                      <button 
                        key={mod.id}
                        onClick={() => setActiveModule(mod.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                          activeModule === mod.id 
                            ? "bg-aura-500/10 border-aura-500 text-aura-400" 
                            : "bg-zinc-800 border-white/5 text-zinc-500 hover:text-white"
                        )}
                      >
                        <mod.icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{mod.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-aura-400" />
                    <div>
                      <div className="text-sm font-semibold">Store History</div>
                      <div className="text-[10px] text-zinc-500">Auto-save chats locally</div>
                    </div>
                  </div>
                  <div className="w-10 h-5 bg-aura-500 rounded-full relative">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-zinc-900/50 flex gap-4">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-aura-500 hover:bg-aura-600 text-white font-bold transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

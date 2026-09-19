import React, { useState, useRef } from "react";
import { 
  Bot, 
  Settings, 
  User, 
  LogIn, 
  Menu, 
  Plus,
  CheckCircle2,
  Sparkles,
  Bell,
  ShieldCheck
} from "lucide-react";
import { UserProfile, ModalType } from "../types";

interface HeaderProps {
  user: UserProfile | null;
  unreadNotifCount?: number;
  onOpenModal: (type: ModalType) => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  unreadNotifCount = 0,
  onOpenModal,
  onToggleSidebar,
  onNewChat,
  onOpenAdmin,
}) => {
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<any>(null);

  // 7-Tap Secret Trigger for Admin Access
  const handleLogoTap = () => {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    const nextCount = tapCount + 1;
    if (nextCount >= 7) {
      setTapCount(0);
      if (onOpenAdmin) {
        onOpenAdmin();
      } else {
        onOpenModal("admin_login");
      }
      return;
    }

    setTapCount(nextCount);
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 2500);
  };

  return (
    <header className="h-15 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Sidebar ☰ Toggle & Logo / Name */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          id="toggle-sidebar-btn"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/90 border border-slate-800 transition-all active:scale-95 cursor-pointer"
          title="মেনু ও চ্যাট হিস্টোরি (Menu & History)"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo and Name with 7-Tap Secret Admin Handler */}
        <div 
          onClick={handleLogoTap}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group relative active:scale-95 transition-transform shrink-0"
          title="Sajjat AI"
        >
          <div className="relative shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center group-hover:shadow-indigo-500/40 transition-shadow">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <span 
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" 
              title="Online"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center leading-none whitespace-nowrap">
              <span className="font-semibold text-slate-100">Sajjat</span>
              <span className="ml-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 font-black">
                AI
              </span>
            </h1>
            {tapCount >= 3 && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                {tapCount}/7
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* + New Chat Button */}
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
          title="নতুন চ্যাট শুরু করুন"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">নতুন চ্যাট</span>
        </button>

        {/* 🔔 Notification Bell Button */}
        <button
          id="notif-btn"
          onClick={() => onOpenModal("notifications")}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800/80 transition-all active:scale-95 relative cursor-pointer"
          title="বিজ্ঞপ্তি ও নোটিফিকেশন"
        >
          <Bell className="w-4 h-4 text-slate-300" />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center border-2 border-slate-900 animate-pulse">
              {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
            </span>
          )}
        </button>

        {/* ⚙️ Unified Settings Button (Includes Model Selection & Theme) */}
        <button
          id="settings-btn"
          onClick={() => onOpenModal("settings")}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800/80 transition-all active:scale-95 cursor-pointer"
          title="সেটিংস ও মডেল নির্বাচন (Settings & Models)"
        >
          <Settings className="w-4 h-4 text-slate-300" />
        </button>

        {/* User Profile / Auth */}
        {user ? (
          <button
            onClick={() => onOpenModal("profile")}
            className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/60 transition-colors cursor-pointer"
            title="প্রোফাইল"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {user.displayName ? user.displayName[0].toUpperCase() : "U"}
            </div>
            <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[80px] truncate">
              {user.displayName}
            </span>
          </button>
        ) : (
          <button
            onClick={() => onOpenModal("auth")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            title="লগইন"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">লগইন</span>
          </button>
        )}
      </div>
    </header>
  );
};

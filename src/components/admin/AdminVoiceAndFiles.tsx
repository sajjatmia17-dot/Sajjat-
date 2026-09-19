import React, { useState, useEffect } from "react";
import { 
  Mic, 
  Volume2, 
  FileUp, 
  Sliders, 
  Check, 
  ShieldAlert, 
  Lock, 
  Save, 
  RefreshCw,
  HardDrive,
  FileCode,
  Image as ImageIcon
} from "lucide-react";
import { SystemSettingsConfig } from "../../types";
import { subscribeToSystemSettings, saveSystemSettings } from "../../firebase";

export const AdminVoiceAndFiles: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingsConfig>({
    aiEnabled: true,
    voiceEnabled: true,
    imageUploadEnabled: true,
    fileUploadEnabled: true,
    chatHistoryEnabled: true,
    notificationsEnabled: true,
    activeProvider: "gemini",
    activeModel: "gemini-3.1-flash-lite",
    temperature: 0.7
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(15);
  const [voiceSpeed, setVoiceSpeed] = useState("1.0");
  const [allowedExtensions, setAllowedExtensions] = useState(".pdf, .txt, .js, .py, .html, .css, .json, .docx");

  useEffect(() => {
    const unsub = subscribeToSystemSettings((data) => {
      if (data) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    });
    return () => unsub();
  }, []);

  const handleToggle = (key: keyof SystemSettingsConfig) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    try {
      await saveSystemSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error("Save system settings error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice Control Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Voice Input & Speech Synthesis Control (ভয়েস নিয়ন্ত্রণ)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              বাংলা ভয়েস রিকগনিশন ও ভয়েস আউটপুট সেটিংস পরিচালনা করুন।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Voice Input (মাইক্রোফোন ইনপুট)</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">ব্যবহারকারীরা মুখে বাংলায় কথা বলে ইনপুট দিতে পারবে</p>
            </div>
            <button
              onClick={() => handleToggle("voiceEnabled")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.voiceEnabled ? "bg-teal-500" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.voiceEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60 space-y-2">
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Speech Output Speed (কণ্ঠের গতি)
            </label>
            <select
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(e.target.value)}
              className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
            >
              <option value="0.8">ধীর (0.8x Slow)</option>
              <option value="1.0">স্বাভাবিক (1.0x Normal)</option>
              <option value="1.2">দ্রুত (1.2x Fast)</option>
            </select>
          </div>
        </div>
      </div>

      {/* File Upload Control Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <FileUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              File & Attachment Control (ফাইল ও ইমেজ আপলোড নিয়ন্ত্রণ)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              ছবি, কোড ফাইল ও ডকুমেন্ট আপলোডের সীমা ও ফরম্যাট পরিচালনা করুন।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Image Analysis (ছবি বিশ্লেষণ)</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">ছবি আপলোড করে সরাসরি AI বিশ্লেষণ নেওয়া</p>
            </div>
            <button
              onClick={() => handleToggle("imageUploadEnabled")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.imageUploadEnabled ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.imageUploadEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">File & Code Attachment</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">কোড ও টেক্সট ফাইল আপলোড সুবিধা</p>
            </div>
            <button
              onClick={() => handleToggle("fileUploadEnabled")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.fileUploadEnabled ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.fileUploadEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60 space-y-1.5 md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Allowed File Extensions (অনুমোদিত ফাইল ফরম্যাট)
            </label>
            <input
              type="text"
              value={allowedExtensions}
              onChange={(e) => setAllowedExtensions(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedSuccess ? "সেটিংস সংরক্ষিত হয়েছে" : "সেটিংস সংরক্ষণ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
};

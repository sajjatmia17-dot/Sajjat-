import React, { useState } from "react";
import { 
  X, 
  Sparkles, 
  Palette, 
  Download, 
  Maximize2, 
  Send, 
  RefreshCw,
  Sliders,
  Check,
  Copy
} from "lucide-react";
import { generateAiImageApi } from "../api";
import { applySajjatAiWatermark, downloadWatermarkedImage } from "../utils/imageWatermark";

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

const SAMPLE_PROMPTS = [
  "একটি সুন্দর বাংলাদেশি নদী, কাশফুল ও পালতোলা নৌকার দৃশ্য",
  "ভবিষ্যতের প্রযুক্তিনির্ভর ঢাকা শহর (২০৫০ সাল), নিয়ন লাইট",
  "সূর্যাস্তের আলোয় বরফে ঢাকা সবুজ পাহাড়ি ঝর্ণা",
  "একটি কিউট রিয়েলিস্টিক রোবট বিড়াল, ড্রিমলাইক লাইটিং",
  "ঐতিহাসিক রাজকীয় মুঘল প্রাসাদ ও বাগান",
  "মহাকাশে গ্যালাক্সির মাঝে ভাসমান একটি সুন্দর দ্বীপ"
];

const STYLES = [
  { id: "photorealistic", label: "ফটোরিয়ালিস্টিক", promptAdd: "photorealistic, 8k, cinematic lighting, ultra-detailed" },
  { id: "anime", label: "অ্যানিমে আর্ট", promptAdd: "anime studio ghibli style, vibrant colors, aesthetic masterpiece" },
  { id: "cyberpunk", label: "সাইবারপাঙ্ক", promptAdd: "cyberpunk neon glow, volumetric lighting, futuristic city" },
  { id: "oil_painting", label: "অয়েল পেইন্টিং", promptAdd: "classic oil painting, textured brushstrokes, artistic masterpiece" },
  { id: "3d_render", label: "3D রেন্ডার", promptAdd: "octane 3D render, raytracing, unreal engine 5, vivid" }
];

const ASPECT_RATIOS: Array<{ id: "1:1" | "16:9" | "9:16"; label: string; desc: string }> = [
  { id: "1:1", label: "১:১ (স্কয়ার)", desc: "বর্গাকার ছবি" },
  { id: "16:9", label: "১৬:৯ (ল্যান্ডস্কেপ)", desc: "পর্দার সাইজ" },
  { id: "9:16", label: "৯:১৬ (পোর্ট্রেট)", desc: "মোবাইল ওয়ালপেপার" },
];

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{
    imageUrl: string;
    watermarkedUrl: string;
    prompt: string;
    refinedPrompt?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = (customPrompt || prompt).trim();
    if (!textToUse || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const styleObj = STYLES.find((s) => s.id === selectedStyle);
      const combinedPrompt = styleObj ? `${textToUse}, ${styleObj.promptAdd}` : textToUse;

      const res = await generateAiImageApi({
        prompt: combinedPrompt,
        aspectRatio,
        style: selectedStyle,
      });

      const imgUrl = res.imageUrl || res.directUrl;
      if (!res.success || !imgUrl) {
        throw new Error(res.error || "ছবি তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
      }

      // Apply watermark
      const watermarked = await applySajjatAiWatermark(imgUrl, {
        logoText: "Sajjat AI",
        subText: "Official AI Artwork",
        position: "bottom-right",
      });

      setGeneratedImage({
        imageUrl: imgUrl,
        watermarkedUrl: watermarked,
        prompt: textToUse,
        refinedPrompt: res.refinedPrompt,
      });
    } catch (err: any) {
      const msg = err?.message || "";
      const displayError = msg.includes("<!doctype") || msg.includes("Unexpected token") || msg.includes("JSON")
        ? "ছবি তৈরিতে সংযোগ বিচ্ছিন্ন হয়েছিল। দয়া করে আবার চেষ্টা করুন।"
        : (msg || "ছবি তৈরি ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।");
      setError(displayError);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    downloadWatermarkedImage(generatedImage.watermarkedUrl, `Sajjat_AI_${Date.now()}.jpg`);
  };

  const handleSendToChat = () => {
    if (!generatedImage || !onSendToChat) return;
    onSendToChat(`ছবি তৈরি করো: ${generatedImage.prompt}`);
    onClose();
  };

  const handleCopyPrompt = () => {
    if (!generatedImage) return;
    navigator.clipboard.writeText(generatedImage.refinedPrompt || generatedImage.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-indigo-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Sajjat AI ছবি নির্মাতা
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ⚡ লোগোসহ তৈরি
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                যেকোনো বর্ণনায় নিখুঁত ছবি তৈরি করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Prompt Input Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>ছবির বর্ণনা লিখুন (বাংলা বা ইংরেজি):</span>
              <span className="text-[11px] text-cyan-400 font-normal">Sajjat AI হাই-কোয়ালিটি আর্ট</span>
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="যেমন: একটি সুন্দর সূর্যাস্তের নদীর পাড়, কাশফুল আর দূরে নৌকা..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-2xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-none transition-all"
              />
            </div>
          </div>

          {/* Sample Prompts */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">আইডিয়া প্রম্পটসমূহ:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(sp);
                    handleGenerate(sp);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 hover:text-indigo-300 text-slate-300 transition-all text-left truncate max-w-full"
                >
                  ⚡ {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Style & Aspect Ratio Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Style Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span>ছবির স্টাইল:</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all text-left ${
                      selectedStyle === st.id
                        ? "bg-indigo-600/30 border border-indigo-500 text-indigo-200 shadow-xs"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>ছবির অনুপাত (Aspect Ratio):</span>
              </label>
              <div className="space-y-1.5">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                      aspectRatio === ar.id
                        ? "bg-cyan-600/20 border border-cyan-500/50 text-cyan-200 shadow-xs"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="font-semibold">{ar.label}</span>
                    <span className="text-[10px] text-slate-500">{ar.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-rose-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Generated Result Display */}
          {generatedImage && (
            <div className="mt-4 p-3 bg-slate-950 border border-indigo-500/30 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-1 text-cyan-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>তৈরিকৃত ছবি (Sajjat AI লোগোযুক্ত)</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "কপি হয়েছে" : "প্রম্পট কপি"}</span>
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center max-h-80">
                <img
                  src={generatedImage.watermarkedUrl}
                  alt={generatedImage.prompt}
                  className="max-h-80 w-auto object-contain"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>লোগোসহ ডাউনলোড</span>
                  </button>

                  {onSendToChat && (
                    <button
                      type="button"
                      onClick={handleSendToChat}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-cyan-400" />
                      <span>চ্যাটে যুক্ত করুন</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/60 hover:border-indigo-500 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isGenerating ? "animate-spin" : ""}`} />
                  <span>পুনরায় তৈরি</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            ⚡ প্রতিটি ছবিতে স্বয়ংক্রিয়ভাবে Sajjat AI লোগো যুক্ত হবে
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              বন্ধ করুন
            </button>

            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isGenerating || !prompt.trim()
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>ছবি তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ছবি তৈরি করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

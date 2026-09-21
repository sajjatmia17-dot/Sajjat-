import React, { useState, useEffect } from "react";
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
  Copy,
  Zap,
  Camera,
  AlertCircle
} from "lucide-react";
import { generateAiImageApi } from "../api";
import { applySajjatAiWatermark, downloadWatermarkedImage } from "../utils/imageWatermark";
import { SystemSettingsConfig } from "../types";

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
  systemSettings?: SystemSettingsConfig | null;
}

const SAMPLE_PROMPTS = [
  "একটি সুন্দর বাংলাদেশি নদী, কাশফুল ও পালতোলা নৌকার দৃশ্য",
  "সূর্যাস্তের আলোয় বরফে ঢাকা সবুজ পাহাড়ি ঝর্ণা",
  "ভবিষ্যতের প্রযুক্তিনির্ভর ঢাকা শহর (২০৫০ সাল), নিয়ন লাইট",
  "ঐতিহাসিক রাজকীয় মুঘল প্রাসাদ ও বাগান",
  "মহাকাশে গ্যালাক্সির মাঝে ভাসমান একটি সুন্দর দ্বীপ",
  "একটি কিউট রিয়েলিস্টিক রোবট বিড়াল, ড্রিমলাইক লাইটিং"
];

const STYLES = [
  { 
    id: "photorealistic", 
    label: "📸 আসল বাস্তব ছবি (Real Photo)", 
    promptAdd: "authentic photography, 8k resolution, true-to-life natural lighting, crisp sharp focus, real life photo, lifelike details",
    badge: "আসল বাস্তব"
  },
  { 
    id: "portrait", 
    label: "👤 বাস্তবধর্মী প্রতিকৃতি (Realistic Portrait)", 
    promptAdd: "photorealistic portrait, natural skin texture, studio portrait lighting, 85mm lens, sharp eyes, cinematic depth of field",
    badge: "প্রতিকৃতি"
  },
  { 
    id: "anime", 
    label: "🎨 অ্যানিমে আর্ট (Anime)", 
    promptAdd: "anime studio ghibli style, vibrant colors, aesthetic masterpiece, detailed anime illustration",
    badge: "অ্যানিমে"
  },
  { 
    id: "cyberpunk", 
    label: "⚡ সাইবারপাঙ্ক (Cyberpunk)", 
    promptAdd: "cyberpunk neon glow, volumetric lighting, futuristic city, vivid neon reflections",
    badge: "সাইবার"
  },
  { 
    id: "oil_painting", 
    label: "🖌️ অয়েল পেইন্টিং (Oil Paint)", 
    promptAdd: "classic oil painting, textured brushstrokes, fine art masterpiece, rich pigments",
    badge: "চিত্রকর্ম"
  },
  { 
    id: "3d_render", 
    label: "💎 3D রেন্ডার (3D Render)", 
    promptAdd: "octane 3D render, raytracing, unreal engine 5, vivid volumetric lighting",
    badge: "3D"
  }
];

const ASPECT_RATIOS: Array<{ id: "1:1" | "16:9" | "9:16"; label: string; desc: string }> = [
  { id: "1:1", label: "১:১ (স্কয়ার)", desc: "বর্গাকার / আল্ট্রা ফাস্ট" },
  { id: "16:9", label: "১৬:৯ (ল্যান্ডস্কেপ)", desc: "ওয়াইড স্ক্রিন" },
  { id: "9:16", label: "৯:১৬ (পোর্ট্রেট)", desc: "মোবাইল ওয়ালপেপার" },
];

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
  systemSettings,
}) => {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">(
    (systemSettings?.imageDefaultAspectRatio as any) || "1:1"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDuration, setGenerationDuration] = useState<number | null>(null);
  const [generatedImage, setGeneratedImage] = useState<{
    imageUrl: string;
    watermarkedUrl: string;
    prompt: string;
    refinedPrompt?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    if (systemSettings?.imageDefaultAspectRatio) {
      setAspectRatio(systemSettings.imageDefaultAspectRatio as any);
    }
  }, [systemSettings?.imageDefaultAspectRatio]);

  if (!isOpen) return null;

  const isFeatureDisabled = systemSettings?.imageGenerationEnabled === false;
  const brandName = systemSettings?.aiBrandName || "Sajjat AI";
  const watermarkText = systemSettings?.imageWatermarkText || "Sajjat AI";
  const isWatermarkEnabled = systemSettings?.imageWatermarkEnabled !== false;

  const handleGenerate = async (customPrompt?: string) => {
    if (isFeatureDisabled) return;
    const textToUse = (customPrompt || prompt).trim();
    if (!textToUse || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGenerationDuration(null);
    const startTime = Date.now();

    try {
      const res = await generateAiImageApi({
        prompt: textToUse,
        aspectRatio,
        style: selectedStyle,
        engine: systemSettings?.imageModelPreset || "gemini-3.1-flash-image"
      });

      const imgUrl = res.imageUrl || res.directUrl;
      if (!res.success || !imgUrl) {
        throw new Error(res.error || "ছবি তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
      }

      const elapsed = Date.now() - startTime;
      setGenerationDuration(elapsed);

      // Apply watermark only if enabled in admin
      let finalDisplayUrl = imgUrl;
      if (isWatermarkEnabled) {
        try {
          finalDisplayUrl = await applySajjatAiWatermark(imgUrl, {
            logoText: watermarkText,
            subText: "Official Gemini AI Art",
            position: "bottom-right",
          });
        } catch {
          finalDisplayUrl = imgUrl;
        }
      }

      setGeneratedImage({
        imageUrl: imgUrl,
        watermarkedUrl: finalDisplayUrl,
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
    downloadWatermarkedImage(generatedImage.watermarkedUrl, `${brandName}_Gemini_Image_${Date.now()}.png`);
  };

  const handleResetForNew = () => {
    setGeneratedImage(null);
    setPrompt("");
    setError(null);
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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
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
                {brandName} ইমেজ স্টুডিও
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-semibold">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  Gemini 3.1 Flash Image
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                বাংলা বা ইংরেজি যেকোনো বর্ণনায় সরাসরি জেমিনি এআই দিয়ে আসল ছবি তৈরি করুন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Maintenance Banner if disabled */}
        {isFeatureDisabled && (
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold">ছবি তৈরির অপশন সাময়িকভাবে বন্ধ রয়েছে</p>
              <p className="text-slate-400 mt-0.5">
                {systemSettings?.imageGenerationNotice || "ছবি তৈরির সুবিধাটি বর্তমানে রক্ষণাবেক্ষণের কারণে স্থগিত রয়েছে।"}
              </p>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Prompt Input Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>ছবির সঠিক বর্ণনা লিখুন (বাংলা বা ইংরেজি):</span>
              <span className="text-[11px] text-cyan-400 font-normal flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Gemini Native 1K
              </span>
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isFeatureDisabled}
                placeholder="যেমন: একটি সুন্দর সূর্যাস্তের নদীর পাড়, কাশফুল আর দূরে নৌকা..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-2xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-none transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt.trim() || isFeatureDisabled}
                className="absolute right-3 bottom-3 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>তৈরি হচ্ছে...</span>
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

          {/* Quick Prompts */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              💡 দ্রুত আইডিয়া নির্বাচন করুন:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={`sample_prompt_${idx}`}
                  type="button"
                  disabled={isFeatureDisabled}
                  onClick={() => {
                    setPrompt(sample);
                    handleGenerate(sample);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Style & Aspect Ratio Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Style Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>ছবির স্টাইল ও রিয়েলিজম:</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    disabled={isFeatureDisabled}
                    onClick={() => setSelectedStyle(st.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                      selectedStyle === st.id
                        ? "bg-indigo-600/30 border border-indigo-500 text-indigo-200 shadow-xs ring-1 ring-indigo-500/50"
                        : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="font-semibold text-[11px]">{st.label}</div>
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
                    disabled={isFeatureDisabled}
                    onClick={() => setAspectRatio(ar.id)}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
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
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">ছবি তৈরি করা সম্ভব হয়নি</span>
                  <span className="text-rose-300 leading-relaxed whitespace-pre-line">{error}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-rose-200 p-1 rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isGenerating && (
            <div className="p-6 rounded-2xl bg-slate-950/90 border border-indigo-500/30 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-cyan-400 animate-spin"></div>
                <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Gemini এআই ছবি তৈরি করছে...</p>
                <p className="text-xs text-slate-400 mt-1">প্রম্পটের অর্থ বিশ্লেষণ ও 1K রেজোলিউশনে ছবি রেন্ডারিং হচ্ছে</p>
              </div>
            </div>
          )}

          {/* Result Display */}
          {generatedImage && !isGenerating && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>ছবি প্রস্তুত হয়েছে!</span>
                  </h4>
                  {generationDuration && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      ⚡ {(generationDuration / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetForNew}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
                    title="নতুন আরেকটি ছবি তৈরি করুন"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>নতুন ছবি</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLightbox(true)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                    title="বড় করে প্রিভিউ দেখুন"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>প্রিভিউ</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                    title="প্রম্পট কপি করুন"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "কপি হয়েছে" : "প্রম্পট"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ডাউনলোড</span>
                  </button>
                  {onSendToChat && (
                    <button
                      type="button"
                      onClick={handleSendToChat}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>চ্যাটে পাঠান</span>
                    </button>
                  )}
                </div>
              </div>

              <div 
                onClick={() => setShowLightbox(true)}
                className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group cursor-zoom-in"
              >
                <img
                  src={generatedImage.watermarkedUrl}
                  alt={generatedImage.prompt}
                  className="w-full max-h-[380px] object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="px-3 py-1.5 rounded-full bg-black/70 text-white text-xs flex items-center gap-1.5 backdrop-blur-sm">
                    <Maximize2 className="w-3.5 h-3.5" />
                    বড় করে দেখতে ক্লিক করুন
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Lightbox Preview Modal */}
        {showLightbox && generatedImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
            onClick={() => setShowLightbox(false)}
          >
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ডাউনলোড</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div 
              className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={generatedImage.watermarkedUrl}
                alt={generatedImage.prompt}
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center max-w-xl truncate">
              {generatedImage.prompt}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

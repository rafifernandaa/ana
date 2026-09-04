import React, { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  Upload, 
  X, 
  FileText, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Trash2, 
  Sparkles, 
  Check, 
  RefreshCw, 
  AlertCircle,
  Plus,
  ArrowRight,
  Lock
} from "lucide-react";

interface HandwrittenCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText: (transcribedText: string, attachedImages: string[]) => void;
  userId?: string;
}

interface OCRResponseData {
  transcribedText: string;
  redactedText: string;
  isRedacted: boolean;
  findingsCount: number;
  findings: Array<{ infoType: string; snippet: string }>;
  storageUrls: string[];
}

export const HandwrittenCaptureModal: React.FC<HandwrittenCaptureModalProps> = ({
  isOpen,
  onClose,
  onInsertText,
  userId = "anonymous",
}) => {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "review">("camera");
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [autoRedact, setAutoRedact] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResponseData | null>(null);
  const [revealRedacted, setRevealRedacted] = useState<boolean>(false);

  // Camera handling
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera when camera tab is open
  useEffect(() => {
    let active = true;

    if (isOpen && activeTab === "camera") {
      navigator.mediaDevices?.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      }).then((stream) => {
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }).catch((err) => {
        console.warn("Camera access denied or unavailable, switching to upload mode:", err);
        setActiveTab("upload");
      });
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Capture frame from live video
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImages(prev => [...prev, dataUrl]);
  };

  // Multi-file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setCapturedImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Trigger Google Cloud Vision / Gemini OCR & DLP pipeline
  const handleProcessOcr = async () => {
    if (capturedImages.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/journal/handwritten-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: capturedImages,
          autoRedact,
          userId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server responded with code ${res.status}`);
      }

      const data: OCRResponseData = await res.json();
      setOcrResult(data);
      setActiveTab("review");
    } catch (err: any) {
      console.error("OCR Error:", err);
      setError(err.message || "Failed to process handwritten image.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Insert final text into editor
  const handleConfirmInsert = () => {
    if (!ocrResult) return;
    const finalText = revealRedacted ? ocrResult.transcribedText : ocrResult.redactedText;
    onInsertText(finalText, capturedImages);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm select-none font-mono">
      <div className="w-full max-w-3xl bg-[#181818] border border-[#3D4028] rounded-xs shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="h-12 bg-[#1c1c1c] border-b border-[#3D4028] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-xs bg-[#262626] border border-[#3D4028] flex items-center justify-center text-[#A3A649]">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-white tracking-wider">
              HANDWRITTEN NOTE CAPTURE // GOOGLE CLOUD OCR &amp; DLP
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C8C8C] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[#3D4028] bg-[#141414] px-4">
          <button
            onClick={() => setActiveTab("camera")}
            className={`px-3 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "camera"
                ? "border-[#A3A649] text-[#A3A649]"
                : "border-transparent text-[#8C8C8C] hover:text-white"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>1. Snap Photo</span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "upload"
                ? "border-[#A3A649] text-[#A3A649]"
                : "border-transparent text-[#8C8C8C] hover:text-white"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>2. Upload Files ({capturedImages.length})</span>
          </button>

          {ocrResult && (
            <button
              onClick={() => setActiveTab("review")}
              className={`px-3 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "review"
                  ? "border-[#A3A649] text-[#A3A649]"
                  : "border-transparent text-[#8C8C8C] hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Review &amp; Insert</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: CAMERA VIEWFINDER */}
          {activeTab === "camera" && (
            <div className="space-y-4">
              <div className="relative aspect-video sm:aspect-4/3 w-full bg-black rounded-xs overflow-hidden border border-[#3D4028] flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Guide overlay */}
                <div className="absolute inset-4 border border-dashed border-[#A3A649]/40 pointer-events-none flex flex-col justify-between p-2">
                  <span className="text-[10px] text-[#A3A649] bg-black/60 px-1 py-0.5 rounded-xs self-start">
                    Align handwritten notebook page within frame
                  </span>
                </div>

                {/* Shutter Button */}
                <div className="absolute bottom-4 inset-x-0 flex justify-center">
                  <button
                    onClick={handleSnapPhoto}
                    className="w-14 h-14 rounded-full bg-white/20 border-2 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg group"
                    title="Snap Page Photo"
                  >
                    <div className="w-10 h-10 rounded-full bg-white group-hover:bg-[#A3A649] transition-colors" />
                  </button>
                </div>
              </div>

              {/* Thumbnails strip */}
              {capturedImages.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-[#8C8C8C] uppercase font-bold block">
                    Captured Pages ({capturedImages.length})
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {capturedImages.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xs border border-[#3D4028] overflow-hidden shrink-0 group">
                        <img src={img} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-xs bg-[#AD3D30] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-black/80 px-1 text-white">
                          P{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MULTI-FILE UPLOAD */}
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#3D4028] hover:border-[#A3A649] rounded-xs p-6 flex flex-col items-center justify-center gap-2 bg-[#141414] hover:bg-[#1a1a1a] transition-all cursor-pointer text-center"
              >
                <div className="w-10 h-10 rounded-full bg-[#262626] border border-[#3D4028] flex items-center justify-center text-[#A3A649]">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white font-bold">
                    Click to select handwritten journal images or drop files here
                  </p>
                  <p className="text-[11px] text-[#8C8C8C]">
                    Supports JPG, PNG, WEBP (Single page or multi-page notebook spreads)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Uploaded Thumbnails Grid */}
              {capturedImages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#8C8C8C]">
                    <span className="font-bold">Pages to Transcribe: {capturedImages.length}</span>
                    <button
                      onClick={() => setCapturedImages([])}
                      className="text-[#AD3D30] hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {capturedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-3/4 rounded-xs border border-[#3D4028] overflow-hidden group">
                        <img src={img} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-xs bg-[#AD3D30] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded-xs text-[9px] text-white">
                          Page {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REVIEW & REDACTION TOGGLE */}
          {activeTab === "review" && ocrResult && (
            <div className="space-y-4">
              {/* Sensitive Data Protection (DLP) Banner */}
              <div className="p-3 bg-[#262626] border border-[#3D4028] rounded-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                    <span>GOOGLE CLOUD SENSITIVE DATA PROTECTION (DLP)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                    ocrResult.isRedacted 
                      ? "bg-[#A3A649]/20 text-[#A3A649] border border-[#A3A649]/40" 
                      : "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40"
                  }`}>
                    {ocrResult.isRedacted ? `${ocrResult.findingsCount} SENSITIVE FINDINGS MASKED` : "CLEAN • NO PII DETECTED"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-[#8C8C8C]">
                    Protected against accidental exposure of personal emails, phone numbers, or private credentials.
                  </p>

                  <button
                    onClick={() => setRevealRedacted(!revealRedacted)}
                    className="px-2.5 py-1 bg-[#181818] hover:bg-[#3D4028] border border-[#3D4028] rounded-xs text-[10px] text-[#A3A649] hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {revealRedacted ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{revealRedacted ? "Mask Sensitive PII" : "Reveal / Unmask Text"}</span>
                  </button>
                </div>
              </div>

              {/* Transcribed Text Preview */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-[#8C8C8C] uppercase font-bold block">
                  Transcribed Prose (Gemini Multimodal OCR)
                </span>
                <div className="p-3 bg-[#121212] border border-[#3D4028] rounded-xs text-xs text-[#e2e8f0] font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {revealRedacted ? ocrResult.transcribedText : ocrResult.redactedText}
                </div>
              </div>
            </div>
          )}

          {/* Cloud DLP Option Toggle */}
          {activeTab !== "review" && (
            <div className="p-2.5 bg-[#141414] border border-[#3D4028] rounded-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#A3A649]" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Auto-Redact Sensitive Info with Google Cloud DLP
                  </span>
                  <span className="text-[10px] text-[#8C8C8C] block">
                    Automatically masks emails, phone numbers, and secrets in transcribed text
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoRedact}
                onChange={(e) => setAutoRedact(e.target.checked)}
                className="w-4 h-4 accent-[#A3A649] cursor-pointer"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-2.5 bg-[#AD3D30]/20 border border-[#AD3D30] rounded-xs text-xs text-[#e2e8f0] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#AD3D30] shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="h-14 bg-[#1c1c1c] border-t border-[#3D4028] px-4 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-[#8C8C8C] font-mono">
            {capturedImages.length} page(s) ready • Cloud Storage gs://ana-handwritten-archives/
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xs bg-[#262626] hover:bg-[#3D4028] text-white text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {activeTab !== "review" ? (
              <button
                onClick={handleProcessOcr}
                disabled={capturedImages.length === 0 || isProcessing}
                className="px-4 py-1.5 rounded-xs bg-[#A3A649] hover:bg-[#A3A649]/80 text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                <span>{isProcessing ? "Transcribing with Google Cloud..." : "Transcribe with Google Cloud OCR"}</span>
              </button>
            ) : (
              <button
                onClick={handleConfirmInsert}
                className="px-4 py-1.5 rounded-xs bg-[#10b981] hover:bg-[#10b981]/80 text-black text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Insert into Journal Buffer</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

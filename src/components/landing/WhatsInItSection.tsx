import React, { useState } from "react";
import { 
  Feather, 
  Wind, 
  Eye, 
  Sun, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Camera, 
  Activity, 
  Sheet 
} from "lucide-react";

interface WhatsInItSectionProps {
  onLaunchTool: () => void;
}

export const WhatsInItSection: React.FC<WhatsInItSectionProps> = ({ onLaunchTool }) => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: "aether-studio",
      title: "Aether Journal Studio & Telemetry",
      tag: "Cognitive Processing",
      icon: Feather,
      shortDesc: "Dual-pane journaling workstation with real-time empirical telemetry extraction.",
      longDesc:
        "Write freely or with guided prompts. Ana's background Gemini pipeline automatically evaluates somatic tension, sleep scores, mental clarity, and habit correlations, converting your prose into objective longitudinal health telemetry.",
      highlights: [
        "Automated sleep, tension, and clarity numerical scoring",
        "Multi-turn reflective conversational partner with conversation history",
        "Client-side DLP redaction for complete PII privacy",
      ],
    },
    {
      id: "reset-room",
      title: "3D Somatic Reset Room",
      tag: "Physiological Regulation",
      icon: Wind,
      shortDesc: "Full-screen immersive WebGL particle sanctuary with box breathing and binaural audio.",
      longDesc:
        "When cognitive writing is not enough, step directly into the Somatic Reset Room. Rhythmic visual pacing balls synchronize your breath with calming cycles while Web Audio synthesizes resonant alpha and theta frequencies to induce physiological calm.",
      highlights: [
        "Interactive SVG body mapping to localize physical tension",
        "Synthetic binaural audio (Alpha, Theta, and Delta waves)",
        "Pre and post tension delta measurement to record somatic release",
      ],
    },
    {
      id: "mindful-decentering",
      title: "Mindful Decentering Station",
      tag: "Metacognitive Defusion",
      icon: Eye,
      shortDesc: "ACT & IFS unblending station to step out of ruminative thought loops.",
      longDesc:
        "Mental tension increases when you fuse with your thoughts. Using Acceptance and Commitment Therapy (ACT) defusion principles, Ana unbundles intense self-talk into neutral observer-self insights, helping you see thoughts as transient mental events.",
      highlights: [
        "Cognitive fusion score assessment & unblending prompts",
        "Separation of raw sensory facts from projected internal narratives",
        "Permanent defusion anchor generation for future reassurance",
      ],
    },
    {
      id: "circadian-sync",
      title: "Circadian Closure & Google Sheets Sync",
      tag: "Autonomous Continuity",
      icon: Sun,
      shortDesc: "Circadian day-boundary guidance and dual-mode Google Workspace synchronization.",
      longDesc:
        "Paces your reflections according to human chronobiology: Morning Dopamine Priming, Midday Grounding, and Evening Loop Closure. Includes Cloud Scheduler inactivity email triggers and seamless two-way Google Sheets export.",
      highlights: [
        "Circadian phase pacing matching natural cortisol and melatonin cycles",
        "Direct transactional email notifications (SendGrid / Resend) on inactivity",
        "Dual-mode Google Sheets sync (Webhook bridge + REST API v4)",
      ],
    },
    {
      id: "handwritten-ocr",
      title: "Multimodal Handwritten OCR",
      tag: "Analogue to Digital",
      icon: Camera,
      shortDesc: "Photograph notebook pages and let Gemini vision digitize and telemetry-score them.",
      longDesc:
        "Honor your love for physical paper and ink. Snap a photo of your notebook or sketchbook; Ana's Gemini vision endpoint transcribes your handwriting, extracts emotional affect, and archives it directly into your sovereign vault.",
      highlights: [
        "High-fidelity cursive and shorthand transcription",
        "Preserves original uploaded scan alongside digital transcription",
        "Instantly generates AI executive summary and mood tags",
      ],
    },
  ];

  return (
    <section
      id="whats-in-it"
      className="relative min-h-screen py-24 px-6 sm:px-12 lg:px-16 bg-[#FAF9F6] text-[#262626] border-t border-[#3D4028]/10"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono font-bold tracking-[0.25em] text-[#3D4028] uppercase">
                03
              </span>
              <span className="text-xs font-mono tracking-[0.2em] text-[#8C8C8C] uppercase font-semibold">
                WHAT'S IN IT
              </span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#262626] leading-tight">
              The Somatic & Cognitive Toolkit
            </h2>
          </div>

          <div className="lg:col-span-7 lg:pl-12 lg:pt-8">
            <p className="font-serif text-lg sm:text-xl text-[#262626]/80 leading-relaxed max-w-2xl mb-4">
              More than a blank text editor. Ana is a complete somatic and mental health companion built with 
              evidence-based tools that guide you from acute emotional activation back into grounded equilibrium.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-[#3D4028] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#A3A649]" />
              <span>Integrated Neuroscience Modules • Available in Demo & Authenticated Mode</span>
            </div>
          </div>
        </div>

        {/* Feature Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-16">
          
          {/* Feature List (Left 5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const isActive = activeFeature === idx;

              return (
                <div
                  key={feature.id}
                  onClick={() => setActiveFeature(idx)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? "bg-white border-[#3D4028] shadow-md -translate-x-1"
                      : "bg-white/50 border-stone-200/80 hover:bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? "bg-[#3D4028] text-white" : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-[#A3A649] font-bold">
                        {feature.tag}
                      </div>
                      <h4 className="font-sans font-bold text-sm text-[#262626]">
                        {feature.title}
                      </h4>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      isActive ? "text-[#3D4028] translate-x-1" : "text-stone-300"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Feature Deep Dive & Artwork (Right 7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#3D4028]/15 p-8 sm:p-10 shadow-sm relative overflow-hidden flex flex-col justify-between">
            {/* Somatic Reset Artwork Accent */}
            <div className="relative rounded-xl overflow-hidden mb-6 aspect-[16/9] shadow-sm border border-stone-200 bg-stone-50">
              <img
                src="/assets/ana_somatic_reset.jpg"
                alt="Somatic Reset Room and Biometric Regulation Visual Art"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-white tracking-wider uppercase font-semibold">
                Somatic Vagal Sanctuary
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A3A649]/15 text-[#3D4028] font-mono text-xs font-semibold uppercase tracking-wider mb-3">
                {features[activeFeature].tag}
              </div>

              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#262626] mb-3">
                {features[activeFeature].title}
              </h3>

              <p className="font-serif text-base text-[#262626]/80 leading-relaxed mb-6">
                {features[activeFeature].longDesc}
              </p>

              <div className="space-y-2 mb-8 bg-stone-50/70 p-4 rounded-xl border border-stone-200/60">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#3D4028] mb-2">
                  Key Capabilities:
                </div>
                {features[activeFeature].highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-mono text-stone-700">
                    <Check className="w-3.5 h-3.5 text-[#3D4028] shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-mono text-[#8C8C8C]">
                Experience live in Ana Studio
              </span>
              <button
                onClick={onLaunchTool}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3D4028] text-white text-xs font-mono uppercase tracking-wider font-bold hover:bg-[#2d301e] transition-all cursor-pointer shadow-sm group"
              >
                <span>Try This Feature</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

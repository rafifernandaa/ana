import React, { useState } from "react";
import { ShieldCheck, Cloud, Cpu, Lock, RefreshCw, Key, Database, CheckCircle2 } from "lucide-react";

export const ArchitectureSection: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<number>(0);

  const pillars = [
    {
      id: "ai-studio",
      title: "Google AI Studio Constitution",
      subtitle: "Safety Directives & Grounded Empathy",
      icon: ShieldCheck,
      badge: "Security Constitution",
      description:
        "Ana runs on custom Google AI Studio directives engineered to provide deep polyvagal attunement without toxic positivity or hallucinated clinical diagnostics. The constitution strictly protects user agency and resists adversarial prompt injection.",
      specs: [
        "Defensive prompt boundaries prevent clinical medical claims",
        "Polyvagal somatic grounding instructions in model system prompt",
        "Strict JSON schema generation with fallback sanitizers",
      ],
    },
    {
      id: "gemini-ladder",
      title: "Resilient Gemini Fallback Ladder",
      subtitle: "gemini-3.8-flash → gemini-3.7-flash → gemini-3.6-flash",
      icon: Cpu,
      badge: "Strictly 3.6+ Ecosystem",
      description:
        "Every AI invocation on the Express proxy passes through a hardened resilient ladder. If the flagship 3.8 model faces latency or quota bounds, the engine seamlessly cascades down to 3.7 and 3.6 with zero user-visible disruption.",
      specs: [
        "Primary: gemini-3.8-flash (ultra-fast structured reasoning)",
        "Secondary: gemini-3.7-flash (high-fidelity fallback)",
        "Tertiary: gemini-3.6-flash (reliable base model)",
      ],
    },
    {
      id: "cloud-run",
      title: "Google Cloud Run & Secret Manager",
      subtitle: "Zero Client-Side Keys, Serverless Isolation",
      icon: Cloud,
      badge: "Zero-Trust Perimeter",
      description:
        "Client browsers never receive, store, or bundle Gemini API keys. The lightweight Node.js 24 Express backend operates in a serverless Google Cloud Run container with automated Google Secret Manager credential injection.",
      specs: [
        "Stateless Google Cloud Run container scaling to zero",
        "Google Secret Manager automated runtime environment binding",
        "Strict request payload sanitation and rate-limiting",
      ],
    },
    {
      id: "firestore-isolation",
      title: "Isolated Cloud Firestore",
      subtitle: "Per-User Subcollections & Cryptographic Rules",
      icon: Database,
      badge: "Data Sovereignty",
      description:
        "User entries, somatic reset records, and cognitive loops reside strictly in isolated subcollections under /users/{userId}/*. Firebase Security Rules enforce cryptographic ownership on every read and write.",
      specs: [
        "Granular security rule: request.auth.uid == userId",
        "Automatic stripUndefined() mutation sanitizer",
        "Dual-mode offline caching with real-time snapshot sync",
      ],
    },
  ];

  return (
    <section
      id="architecture"
      className="relative min-h-screen py-24 px-6 sm:px-12 lg:px-16 bg-[#F5F4EE] text-[#262626] border-t border-[#3D4028]/10"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono font-bold tracking-[0.25em] text-[#3D4028] uppercase">
                02
              </span>
              <span className="text-xs font-mono tracking-[0.2em] text-[#8C8C8C] uppercase font-semibold">
                SYSTEM ARCHITECTURE
              </span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#262626] leading-tight">
              Grounded in Neuroscience. Hardened on Cloud.
            </h2>
          </div>

          <div className="lg:col-span-7 lg:pl-12 lg:pt-8">
            <p className="font-serif text-lg sm:text-xl text-[#262626]/80 leading-relaxed max-w-2xl mb-4">
              Engineered as a neuroscience-grounded journaling and somatic reset companion. 
              Ana combines cutting-edge Google GenAI intelligence with a zero-trust enterprise security perimeter.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#3D4028]">
              <span className="px-2.5 py-1 bg-white rounded-md border border-[#3D4028]/20 font-semibold">
                Google AI Studio
              </span>
              <span className="px-2.5 py-1 bg-white rounded-md border border-[#3D4028]/20 font-semibold">
                Google Cloud Run
              </span>
              <span className="px-2.5 py-1 bg-white rounded-md border border-[#3D4028]/20 font-semibold">
                Cloud Firestore
              </span>
              <span className="px-2.5 py-1 bg-white rounded-md border border-[#3D4028]/20 font-semibold">
                Secret Manager
              </span>
            </div>
          </div>
        </div>

        {/* Center Grid: Architecture Diagram & Interactive Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          
          {/* Left: Generated Papercraft Architecture Artwork */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-[#3D4028]/20 bg-white aspect-[16/10] sm:aspect-[16/11]">
              <img
                src="/assets/ana_architecture_cloud.jpg"
                alt="Ana Google Cloud & Neuroscience Architecture Papercraft Art"
                className="w-full h-full object-cover object-center"
              />

              {/* Floating Cloud Node Tag */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#3D4028]/20 shadow-sm flex items-center gap-2">
                <Cloud className="w-3.5 h-3.5 text-[#3D4028]" />
                <span className="text-[11px] font-mono font-bold text-[#262626]">
                  Cloud Run Microservice
                </span>
              </div>

              {/* Floating Fallback Ladder Tag */}
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#3D4028]/20 shadow-sm flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-[#A3A649]" />
                <span className="text-[11px] font-mono font-bold text-[#262626]">
                  Gemini 3.8 → 3.7 → 3.6
                </span>
              </div>
            </div>
          </div>

          {/* Right: Interactive Pillars Navigator */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              const isSelected = selectedLayer === index;

              return (
                <div
                  key={pillar.id}
                  onClick={() => setSelectedLayer(index)}
                  className={`p-6 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-white border-[#3D4028] shadow-md -translate-y-0.5"
                      : "bg-white/60 border-stone-200/80 hover:bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? "bg-[#3D4028] text-white" : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-base text-[#262626]">
                          {pillar.title}
                        </h4>
                        <div className="font-mono text-xs text-[#8C8C8C]">
                          {pillar.subtitle}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-xs bg-stone-100 text-stone-600">
                      {pillar.badge}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-stone-100 animate-fadeIn">
                      <p className="font-serif text-sm text-[#262626]/80 leading-relaxed mb-4">
                        {pillar.description}
                      </p>
                      <ul className="space-y-2">
                        {pillar.specs.map((spec, sIdx) => (
                          <li key={sIdx} className="flex items-center gap-2 text-xs font-mono text-stone-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#3D4028] shrink-0" />
                            <span>{spec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Bottom Flow Architecture Banner */}
        <div className="bg-[#262626] text-white rounded-2xl p-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#A3A649] mb-1 font-bold">
                STAGE 1: INGESTION
              </div>
              <div className="font-sans font-bold text-sm text-white mb-1">
                Client-Side DLP Scrubbing
              </div>
              <p className="text-xs text-stone-400 font-serif">
                Regex & entity sanitizers strip PII and keys before leaving the user device.
              </p>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#A3A649] mb-1 font-bold">
                STAGE 2: ROUTING
              </div>
              <div className="font-sans font-bold text-sm text-white mb-1">
                Cloud Run Express Proxy
              </div>
              <p className="text-xs text-stone-400 font-serif">
                Validates authorization, loads secrets from Google Secret Manager securely.
              </p>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#A3A649] mb-1 font-bold">
                STAGE 3: COGNITION
              </div>
              <div className="font-sans font-bold text-sm text-white mb-1">
                Resilient Gemini Ladder
              </div>
              <p className="text-xs text-stone-400 font-serif">
                Multi-turn affective synthesis with 3.8/3.7/3.6 automatic failover.
              </p>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#A3A649] mb-1 font-bold">
                STAGE 4: PERSISTENCE
              </div>
              <div className="font-sans font-bold text-sm text-white mb-1">
                Isolated Cloud Firestore
              </div>
              <p className="text-xs text-stone-400 font-serif">
                Scoped /users/{'{uid}'}/* subcollections with zero cross-tenant visibility.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { SomaticZone, SomaticBodyMap } from "../types";
import { Sparkles, Activity, Check, Info } from "lucide-react";

interface BodyMapSelectorProps {
  value: SomaticBodyMap;
  onChange: (value: SomaticBodyMap) => void;
}

interface ZoneInfo {
  id: SomaticZone;
  label: string;
  description: string;
  x: number;
  y: number;
  radius: number;
}

const ZONES: ZoneInfo[] = [
  { 
    id: "head", 
    label: "Head & Temples", 
    description: "Racing thoughts, pressure, headache, or mental fatigue",
    x: 100, 
    y: 36, 
    radius: 20 
  },
  { 
    id: "jaw", 
    label: "Jaw & Throat", 
    description: "Clenched teeth, tight jaw, or throat constriction",
    x: 100, 
    y: 68, 
    radius: 12 
  },
  { 
    id: "shoulders", 
    label: "Shoulders & Traps", 
    description: "Carrying weight, tight muscles, or hunched tension",
    x: 100, 
    y: 95, 
    radius: 22 
  },
  { 
    id: "chest", 
    label: "Chest & Heart", 
    description: "Tight chest, shallow breathing, or fluttering pulse",
    x: 100, 
    y: 130, 
    radius: 18 
  },
  { 
    id: "gut", 
    label: "Gut & Stomach", 
    description: "Sinking knot, nervous butterflies, or clamped abdomen",
    x: 100, 
    y: 175, 
    radius: 18 
  },
  { 
    id: "hands", 
    label: "Hands & Arms", 
    description: "Restless fingers, clenched fists, or shaky limbs",
    x: 100, 
    y: 225, 
    radius: 20 
  },
];

const INTENSITY_DESCRIPTORS = [
  "",
  "1 · Faint whisper of tension",
  "2 · Noticeable mild stiffness",
  "3 · Distinct pressure or knot",
  "4 · Heavy constriction",
  "5 · Intense, consuming tension"
];

export const BodyMapSelector: React.FC<BodyMapSelectorProps> = ({
  value,
  onChange,
}) => {
  const toggleZone = (zone: SomaticZone) => {
    const isSelected = value.zones.includes(zone);
    const newZones = isSelected
      ? value.zones.filter(z => z !== zone)
      : [...value.zones, zone];
    onChange({
      ...value,
      zones: newZones.length > 0 ? newZones : [zone],
    });
  };

  const handleIntensityChange = (intensity: number) => {
    onChange({
      ...value,
      intensity,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Body Check-In: Where do you feel stress or tightness right now?</span>
          </label>
          <p className="text-[11px] text-slate-500">
            Tap the body zones where you physically notice tightness or pressure.
          </p>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
          {value.zones.length} {value.zones.length === 1 ? "zone" : "zones"} targeted
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
        {/* SVG Body Silhouette */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80">
          <div className="relative w-48 h-64 select-none">
            <svg
              viewBox="0 0 200 280"
              className="w-full h-full drop-shadow-xs"
            >
              {/* Silhouette Body Path */}
              <defs>
                <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Head Silhouette */}
              <circle cx="100" cy="36" r="22" fill="url(#bodyGrad)" />
              {/* Neck */}
              <rect x="93" y="56" width="14" height="16" rx="4" fill="url(#bodyGrad)" />
              {/* Torso & Shoulders */}
              <path
                d="M 50 82 Q 100 74 150 82 L 140 190 Q 100 196 60 190 Z"
                fill="url(#bodyGrad)"
              />
              {/* Arms */}
              <path
                d="M 50 82 Q 35 140 38 210 Q 42 220 50 215 Q 52 140 60 92 Z"
                fill="url(#bodyGrad)"
              />
              <path
                d="M 150 82 Q 165 140 162 210 Q 158 220 150 215 Q 148 140 140 92 Z"
                fill="url(#bodyGrad)"
              />
              {/* Lower Pelvis */}
              <path
                d="M 62 188 Q 100 196 138 188 L 130 250 L 70 250 Z"
                fill="url(#bodyGrad)"
                opacity="0.8"
              />

              {/* Interactive Zone Focus Nodes */}
              {ZONES.map(z => {
                const isSelected = value.zones.includes(z.id);
                return (
                  <g
                    key={z.id}
                    id={`somatic-svg-zone-${z.id}`}
                    onClick={() => toggleZone(z.id)}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing ring if selected */}
                    {isSelected && (
                      <circle
                        cx={z.x}
                        cy={z.y}
                        r={z.radius + (value.intensity * 2)}
                        fill="rgba(99, 102, 241, 0.2)"
                        className="animate-ping opacity-60"
                      />
                    )}
                    {/* Primary Node Target */}
                    <circle
                      cx={z.x}
                      cy={z.y}
                      r={z.radius}
                      fill={isSelected ? "#6366f1" : "rgba(255, 255, 255, 0.85)"}
                      stroke={isSelected ? "#4f46e5" : "#94a3b8"}
                      strokeWidth={isSelected ? "2.5" : "1.5"}
                      className="transition-all duration-200 group-hover:scale-110"
                      filter={isSelected ? "url(#glow)" : undefined}
                    />
                    {/* Inner indicator */}
                    <circle
                      cx={z.x}
                      cy={z.y}
                      r={isSelected ? 4 : 2.5}
                      fill={isSelected ? "#ffffff" : "#64748b"}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Tap circles on the body map
          </p>
        </div>

        {/* Zone Selector Chips & Intensity */}
        <div className="sm:col-span-7 space-y-4">
          {/* List of Zones */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-600 block">
              Active Tension Areas:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {ZONES.map(z => {
                const isSelected = value.zones.includes(z.id);
                return (
                  <button
                    key={z.id}
                    id={`body-zone-chip-${z.id}`}
                    type="button"
                    onClick={() => toggleZone(z.id)}
                    className={`flex items-start gap-2 p-2 rounded-xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/90 border-indigo-300 text-indigo-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-tight truncate">{z.label}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{z.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity Slider */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <span>Tension Intensity:</span>
                <span className="font-bold text-indigo-600">{value.intensity} / 5</span>
              </span>
              <span className="text-[11px] text-slate-500 italic">
                {INTENSITY_DESCRIPTORS[value.intensity] || ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(lvl => (
                <button
                  key={lvl}
                  id={`intensity-step-${lvl}`}
                  type="button"
                  onClick={() => handleIntensityChange(lvl)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    value.intensity === lvl
                      ? "bg-indigo-600 text-white shadow-xs scale-102"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

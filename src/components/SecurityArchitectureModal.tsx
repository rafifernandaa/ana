/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  KeyRound, 
  FileCode2, 
  X, 
  CheckCircle2, 
  Terminal, 
  AlertTriangle 
} from "lucide-react";

interface SecurityArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityArchitectureModal: React.FC<SecurityArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-slate-900">
                Security Architecture & Threat Defense
              </h2>
              <p className="text-xs text-slate-500">
                Adherence to OWASP Top 10, Zero Insecure Defaults, and Isolated Firestore
              </p>
            </div>
          </div>
          <button
            id="close-security-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Section 1: Threat Modeling Summary Table */}
          <div>
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>1. Structured 5-Zone Threat Summary Table</span>
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 font-semibold">Threat Zone</th>
                    <th className="p-2.5 font-semibold">Identified Risk</th>
                    <th className="p-2.5 font-semibold">Implemented Countermeasure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900">Input Surfaces</td>
                    <td className="p-2.5 text-slate-600">Prompt injection & malicious payloads</td>
                    <td className="p-2.5 text-emerald-700">Schema-constrained body parsing & type sanitization</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900">Planning & Reasoning</td>
                    <td className="p-2.5 text-slate-600">Model hallucination & API failover</td>
                    <td className="p-2.5 text-emerald-700">4-model resilient fallback ladder (<code className="font-mono">gemini-3.6-flash</code>)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900">Tool Execution</td>
                    <td className="p-2.5 text-slate-600">Privilege escalation & SSRF</td>
                    <td className="p-2.5 text-emerald-700">Zero-hardcoded secrets, proxy endpoints on Express backend</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900">Memory & State</td>
                    <td className="p-2.5 text-slate-600">Cross-user data leakage in Firestore</td>
                    <td className="p-2.5 text-emerald-700">Owner-bound Firestore rules (<code className="font-mono">request.auth.uid == userId</code>)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium text-slate-900">Inter-System Comm</td>
                    <td className="p-2.5 text-slate-600">Token leakage & API key exposure</td>
                    <td className="p-2.5 text-emerald-700">Server-side environment secrets; client never sees Gemini API key</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Firestore Security Rules Enforcement */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>2. Firestore User-Isolation Security Rules</span>
            </h3>
            <p className="text-xs text-slate-600">
              Every document query and mutation is bound strictly to the authenticated user's UID:
            </p>
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
              <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data isolation: only the authenticated owner can access
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}</pre>
            </div>
          </div>

          {/* Section 3: Secret Management & Fallback Strategy */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-violet-600" />
              <span>3. Secret Management & Fallback Protocol</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-semibold text-slate-900">Zero Hardcoded Strings</p>
                <p className="text-slate-600">
                  <code className="text-indigo-600 font-mono">GEMINI_API_KEY</code> is loaded via <code className="font-mono">process.env</code> on the Express server and never exposed to the client.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-semibold text-slate-900">Resilient Fallback Ladder</p>
                <p className="text-slate-600">
                  Calls sequentially chain: <code className="font-mono">gemini-3.6-flash</code> → <code className="font-mono">gemini-3.1-flash-lite</code> → <code className="font-mono">gemini-flash-latest</code> → <code className="font-mono">gemini-3.7-flash</code>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
          >
            Close Security Brief
          </button>
        </div>
      </div>
    </div>
  );
};

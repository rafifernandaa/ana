/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { User } from "firebase/auth";
import { 
  Sparkles, 
  LogOut, 
  LogIn, 
  PlusCircle, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  Clock 
} from "lucide-react";

interface NavbarProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onNewEntry: () => void;
  onToggleSecurityInfo: () => void;
  isSaving?: boolean;
  lastSavedAt?: number | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignIn,
  onSignOut,
  onNewEntry,
  onToggleSecurityInfo,
  isSaving = false,
  lastSavedAt = null,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg text-slate-900 tracking-tight">
                Gemini Reflection Journal
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">
              Encrypted user-isolated reflections powered by Cloud Firestore
            </p>
          </div>
        </div>

        {/* Action Controls & User Identity */}
        <div className="flex items-center gap-3">
          {/* Sync Status Badge */}
          {user && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
              {isSaving ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Syncing to Firestore...</span>
                </>
              ) : lastSavedAt ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Firestore Ready</span>
                </>
              )}
            </div>
          )}

          {/* Security & Architecture Info Toggle */}
          <button
            id="security-info-btn"
            onClick={onToggleSecurityInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-xs font-medium"
            title="View Security & Firestore Isolation Architecture"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Security Architecture</span>
          </button>

          {user ? (
            <>
              {/* New Entry Button */}
              <button
                id="navbar-new-entry-btn"
                onClick={onNewEntry}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-all shadow-sm active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Reflection</span>
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                    {user.displayName || "Authenticated User"}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
                <button
                  id="navbar-logout-btn"
                  onClick={onSignOut}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              id="navbar-login-btn"
              onClick={onSignIn}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm transition-all shadow-sm active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

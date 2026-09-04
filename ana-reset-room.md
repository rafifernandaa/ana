# Ana — The Reset Room (Phase 3 Build Plan)

## Problem Statement
How might we turn a "record and summarize" journal into an app that
intervenes — guiding a stressed young adult through a live, evidence-based
stress-reset in under 3 minutes, with the security story told at every layer?

## Recommended Direction
A guided stress-reset protocol as a fifth mode in the existing app.
It opens with a somatic body check-in (tap where you feel it), then walks
the user through four invisible-science phases: Name It (affect labeling),
Write It (timed, uninterrupted expressive writing), Reframe It (Gemini
extracts the darkest sentence and offers 3 healthier perspectives),
and Catch a Glimmer (the AI finds one micro-moment of good in the user's
own words). Two versions: Mini Reset (~3 min, the demo vehicle and daily
habit) and Full Reset (15 min, the real Pennebaker-style protocol).

The user never sees a neuroscience term. The science is the system prompt
and the session structure; it lives in the submission docs, demo script,
and a judge-facing "science under the hood" section. The body map and
before/after one-word check-in give the demo its visual wow without a
single fake measurement. Each session persists to a new
/users/{uid}/sessions collection with its own isolation rules — the
security story extends, not freezes.

---

## 0. Gate: Evaluation Criteria Mapping
- [ ] User pastes tutorial "7. Summary and Submissions Guideline"
      (evaluation criteria) + "Next Steps" — the local .txt is empty (0 bytes)
- [ ] Every build step below scored against the criteria; plan adjusted
      if any step fails a criterion

## 1. Baseline Next Steps (AI Studio UI — before Phase 3 code)
- [ ] AI Studio custom security instructions documented (Deliverable 1)
- [ ] Baseline app deployed through AI Studio, challenge verification
      label applied
- [ ] 8-step functional walkthrough passed (README §6)
- [ ] Owner-isolation test passed: second Google account sees zero entries
- [ ] GEMINI_API_KEY injected via AI Studio Secrets panel (not hardcoded)

## 2. Reframe Prompt Spike (highest risk first)
- [ ] New endpoint `/api/gemini/reframe` (server.ts, next to summarize):
      structured JSON `{ darkestSentence, reframes[3], glimmerCandidate }`
- [ ] System instruction encodes affect labeling + cognitive reframing +
      glimmer rationale (invisible to user, visible to judges in docs)
- [ ] Quality bar: run 10 genuinely dark sentences through it; iterate
      until every reframe passes "would I say this to a friend?" —
      zero "look on the bright side!" output
- [ ] Glimmer extraction test: finds a real micro-moment from the user's
      own words, not a saccharine generic

## 3. Data Model + Rules
- [ ] `ResetSession` type in src/types.ts (bodyMap, label, writing,
      originalSentence, chosenReframe, glimmer, beforeCheckIn,
      afterCheckIn, durationMs, mode: mini|full)
- [ ] journalService.ts: save/delete/subscribe sessions at
      `/users/{uid}/sessions/{sessionId}` (same assertAuthorizedUser guard)
- [ ] firestore.rules: explicit sessions block + owner-only rules

## 4. Body Map Component
- [ ] SVG silhouette with tap zones: head, jaw, chest, gut, shoulders
      + intensity slider
- [ ] Self-report framing only — no scores, no diagnostic language
- [ ] motion animation polish (library already installed)

## 5. Reset Room Flow Component
- [ ] Phase state machine: Intake → Name It → Write It → Reframe It →
      Glimmer → Close
- [ ] Write phase: countdown timer, backspace disabled, AI silent
- [ ] Mini Reset (~3 min) vs Full Reset (15 min) toggle; Mini is the demo
- [ ] Before/after one-word body check-in ("how does your chest feel now?")
- [ ] confetti close (canvas-confetti already installed)
- [ ] Entry point: new option in JournalEditor + Navbar

## 6. Session History
- [ ] Sessions list (sidebar section or Reset Room history view)
- [ ] Each session links to its source entry; per-user isolated

## 7. Security Story Update
- [ ] SecurityArchitectureModal: new "Reset Room & sessions" chapter
      (isolation path, rules, zero cross-user leakage)
- [ ] Live demo beat: Firestore console shows sessions under own uid only;
      second-account test re-run for sessions

## 8. Submission Artifacts
- [ ] README §7 "Reset Room: the science under the hood" — judge-facing
      explanation of each invisible mechanism and its evidence base
- [ ] Demo script (~3 min): stressed student → Mini Reset → reframe →
      glimmer → Firestore isolation check
- [ ] AI Studio custom instructions update (if required for deliverable 1)

## 9. Rehearsal
- [ ] Live 3-minute Mini Reset run-through; timing tuned
- [ ] Fallback verified: 4-model ladder covers a reframe API hiccup

---

## Key Assumptions to Validate
- [ ] Gemini reframe quality — the 10-sentence spike above; iterate the
      system instruction until it passes the friend bar
- [ ] Demo pacing — rehearse live; tighten Mini Reset to ~90s if the
      quiet writing phase drags
- [ ] Body map framing — confirm it reads as self-report awareness, not
      medical symptom tracking
- [ ] Invisible science lands with judges — write README §7 early and
      test it on someone who knows the terms

## MVP Scope
- Mini Reset (~3 min) + Full Reset (15 min) flows
- Body map intake (head / jaw / chest / gut / shoulders + intensity)
- Timed, no-backspace writing phase (AI silent)
- Reframe step via new /api/gemini/reframe endpoint (structured JSON)
- Glimmer close: AI surfaces a micro-moment from the user's own text
- Before/after one-word body check-in
- Session history + /users/{uid}/sessions collection with rules
- Judge-facing "science under the hood" README section

## Not Doing (and Why)
- Sealed Entries / client-side encryption — crypto UX build risk; the
  sessions collection + rules already extend the security story
- 28-Day Rewire — needs longitudinal data we can't honestly demo
- Cortisol / HRV / T-lymphocyte measurement — unmeasurable; fake metrics
  kill credibility with health-literate judges
- Glimmer as a standalone feature — folded into the Reset Room's
  closing beat
- Visible neuroscience in the UI — jargon belongs in the submission
  docs, not the product

## Open Questions
- Evaluation criteria content (blocked on user paste — Gate 0)
- Demo: live sign-in with a real account, or pre-authenticated demo account?
- Sessions as their own collection (chosen) — confirm vs embedding in entries

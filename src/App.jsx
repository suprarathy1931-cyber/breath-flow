import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================
// AUDIO ENGINE — synthesized tones via Web Audio API, no assets
// ============================================================
function useAudioEngine() {
  const ctxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const tone = useCallback((freq, duration, type = 'sine', volume = 0.18, delay = 0) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const startAt = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(volume, startAt + 0.04);
      gain.gain.linearRampToValueAtTime(0, startAt + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.05);
    } catch (e) {
      /* audio unsupported — fail silently */
    }
  }, [getCtx]);

  const sounds = {
    inhale: () => tone(440, 0.5, 'sine', 0.15),
    exhale: () => tone(280, 0.5, 'sine', 0.15),
    holdIn: () => tone(520, 0.35, 'sine', 0.12),
    holdOut: () => tone(220, 0.35, 'sine', 0.12),
    kapalabhatiExhale: () => tone(650, 0.08, 'triangle', 0.16),
    tick: () => tone(880, 0.06, 'sine', 0.06),
    roundComplete: () => {
      tone(523, 0.18, 'sine', 0.2, 0);
      tone(659, 0.18, 'sine', 0.2, 0.15);
      tone(784, 0.28, 'sine', 0.2, 0.3);
    },
    exerciseComplete: () => {
      tone(392, 0.2, 'sine', 0.22, 0);
      tone(523, 0.2, 'sine', 0.22, 0.18);
      tone(659, 0.2, 'sine', 0.22, 0.36);
      tone(784, 0.4, 'sine', 0.24, 0.54);
    },
    timeOver: () => {
      tone(330, 0.3, 'square', 0.1, 0);
      tone(330, 0.3, 'square', 0.1, 0.35);
    },
    start: () => tone(440, 0.3, 'sine', 0.18),
  };

  // Unlock audio context on first user gesture
  const unlock = useCallback(() => {
    getCtx();
  }, [getCtx]);

  return { sounds, unlock };
}

// ============================================================
// SHARED UI BITS
// ============================================================
function fmtTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function fmtMs(totalMs) {
  const totalSeconds = Math.floor(totalMs / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const ms = Math.floor((totalMs % 1000) / 10);
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function IconBack() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 5.5v13a1 1 0 0 0 1.53.85l11-6.5a1 1 0 0 0 0-1.7l-11-6.5A1 1 0 0 0 7 5.5z" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4.5" height="14" rx="1" />
      <rect x="13.5" y="5" width="4.5" height="14" rx="1" />
    </svg>
  );
}
function IconReset() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 12a9 9 0 1 0 3-6.7M3 12V5M3 12h7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 12.5l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSpeaker({ on }) {
  return on ? (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" fill="currentColor" />
      <path d="M16 9a4 4 0 0 1 0 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18.5 6.5a8 8 0 0 1 0 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  ) : (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z" fill="currentColor" />
      <path d="M16.5 9.5l4 4M20.5 9.5l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const PALETTE = {
  bg: '#fbf8f3',
  panel: '#ffffff',
  ink: '#1f2421',
  inkSoft: '#5b6660',
  line: '#e7e2d8',
  accentKapal: '#c4622d',
  accentAnulom: '#3c6e63',
  accentBox: '#3a5a8c',
  accentApnea: '#7a4a8c',
  accentRecovery: '#a8893a',
  cream: '#f4f0e6',
};

// ============================================================
// EXERCISE DEFINITIONS — the "what/how/why" content + structure
// ============================================================
const EXERCISES = [
  {
    id: 'kapalabhati',
    index: 1,
    name: 'Kapalabhati',
    subtitle: 'Brain Cleansing Breath',
    duration: 180,
    accent: PALETTE.accentKapal,
    what: 'Clears the lungs, energizes the mind, increases oxygen intake, and strengthens the diaphragm.',
    how: [
      'Sit upright with your spine straight.',
      'Take one normal deep breath in through your nose.',
      'Exhale sharply and forcefully through your nose — like blowing out a candle hard and fast.',
      'Let the inhale happen passively — it just occurs naturally as you relax after each sharp exhale.',
      'Repeat the sharp exhale / passive inhale cycle continuously.',
    ],
    why: 'A fast, forceful exhale pattern that wakes up the diaphragm and clears stale air before the slower work begins.',
    mode: 'kapalabhati',
    targetExhales: 30,
    rounds: 3,
    pauseBetweenRounds: 10,
  },
  {
    id: 'anulom-vilom',
    index: 2,
    name: 'Anulom Vilom',
    subtitle: 'Alternate Nostril Breathing',
    duration: 300,
    accent: PALETTE.accentAnulom,
    what: 'Balances the nervous system, improves oxygen–CO₂ management, calms the mind, and prepares you for freediving breath control.',
    how: [
      'Sit upright, spine straight.',
      'Close your right nostril with your thumb. Inhale through the left nostril for 4 counts.',
      'Close both nostrils. Hold for 4 counts.',
      'Release the right nostril, exhale through it for 4 counts, then pause for 1 count.',
      'Inhale through the right nostril for 4 counts, hold both closed for 4, then exhale through the left for 4. That is one full cycle.',
    ],
    why: 'This is the most important exercise for freediving prep — it trains balanced, controlled breathing on both sides.',
    mode: 'anulom-vilom',
    targetCycles: 10,
  },
  {
    id: 'box-breathing',
    index: 3,
    name: 'Box Breathing',
    subtitle: 'Sama Vritti',
    duration: 180,
    accent: PALETTE.accentBox,
    what: 'Teaches the mammalian dive reflex, trains breath control under pressure, calms the nervous system, and prepares the body for apnea training.',
    how: [
      'Inhale slowly through the nose for 4 counts.',
      'Hold the breath for 4 counts — the crucial part for the dive reflex.',
      'Exhale slowly through the nose for 4 counts.',
      'Hold the empty breath for 4 counts — this is where you train comfort with CO₂ buildup.',
      'Repeat: Inhale 4 · Hold 4 · Exhale 4 · Hold 4.',
    ],
    why: 'The hold-after-exhale phase trains your nervous system that the CO₂-buildup sensation — the main trigger for underwater panic — is safe.',
    mode: 'box',
    targetCycles: 8,
    phaseSeconds: 4,
  },
  {
    id: 'static-hold',
    index: 4,
    name: 'Static Breath Hold',
    subtitle: 'Apnea Training',
    duration: 120,
    accent: PALETTE.accentApnea,
    what: 'Trains the body to relax during breath-holding, builds CO₂ tolerance, and establishes your baseline breath-hold capacity.',
    how: [
      'Take one normal deep breath in through your nose.',
      'Breathe out about 30% of that air — not fully empty, not fully full.',
      'Hold the breath. Relax completely: shoulders loose, jaw loose, face relaxed.',
      'Hold until you feel a real urge to breathe — then stop and breathe normally.',
      'Write down exactly how many seconds you held. This is your main progress metric.',
    ],
    why: 'Exhaling 30% before the hold is the sweet spot — a full breath is too easy to train on, fully empty feels panicky.',
    mode: 'static-hold',
  },
  {
    id: 'recovery',
    index: 5,
    name: 'Recovery Breathing',
    subtitle: 'Transition',
    duration: 120,
    accent: PALETTE.accentRecovery,
    what: 'Clears any remaining CO₂, brings the nervous system back to baseline, and prepares you for the day ahead.',
    how: [
      'Breathe normally for about 30 seconds to recover from the hold.',
      'Then begin slow deep breathing: inhale through the nose for 5 counts.',
      'Exhale through the mouth for 6 counts — longer than the inhale.',
      'Repeat 10–12 times.',
    ],
    why: 'A longer exhale than inhale activates the parasympathetic "rest and digest" system, closing out the session calm.',
    mode: 'recovery',
    targetCycles: 11,
    inhaleSeconds: 5,
    exhaleSeconds: 6,
  },
];

// ============================================================
// SETTINGS BAR — sound toggle, shared across screens
// ============================================================
function TopBar({ onBack, title, accent, soundOn, setSoundOn }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 6px', position: 'sticky', top: 0, zIndex: 10,
      background: PALETTE.bg,
    }}>
      <button
        onClick={onBack}
        aria-label="Back"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, borderRadius: 12, border: `1px solid ${PALETTE.line}`,
          background: PALETTE.panel, color: PALETTE.ink, cursor: 'pointer',
        }}
      >
        <IconBack />
      </button>
      <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 16, fontWeight: 600, color: accent || PALETTE.ink, letterSpacing: 0.2 }}>
        {title}
      </div>
      <button
        onClick={() => setSoundOn(s => !s)}
        aria-label="Toggle sound"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, borderRadius: 12, border: `1px solid ${PALETTE.line}`,
          background: PALETTE.panel, color: soundOn ? PALETTE.ink : PALETTE.inkSoft, cursor: 'pointer',
        }}
      >
        <IconSpeaker on={soundOn} />
      </button>
    </div>
  );
}

// ============================================================
// HOME SCREEN
// ============================================================
function HomeScreen({ onSelect, completedToday, soundOn, setSoundOn, holdHistory }) {
  const bestHold = holdHistory.length ? Math.max(...holdHistory.map(h => h.seconds)) : null;
  const lastHold = holdHistory.length ? holdHistory[holdHistory.length - 1] : null;

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px 40px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 2px 8px',
      }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 600, color: PALETTE.ink, letterSpacing: 0.2 }}>
            Morning Breath
          </div>
          <div style={{ fontSize: 13, color: PALETTE.inkSoft, marginTop: 2 }}>
            15 minutes · five exercises · freediving prep
          </div>
        </div>
        <button
          onClick={() => setSoundOn(s => !s)}
          aria-label="Toggle sound"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 12, border: `1px solid ${PALETTE.line}`,
            background: PALETTE.panel, color: soundOn ? PALETTE.ink : PALETTE.inkSoft, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <IconSpeaker on={soundOn} />
        </button>
      </div>

      {/* Breath hold stat strip */}
      {bestHold !== null && (
        <div style={{
          display: 'flex', gap: 10, margin: '10px 2px 18px',
        }}>
          <div style={{ flex: 1, background: PALETTE.cream, borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: PALETTE.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>Best hold</div>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 600, color: PALETTE.ink }}>{bestHold}s</div>
          </div>
          <div style={{ flex: 1, background: PALETTE.cream, borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: PALETTE.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>Last hold</div>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 600, color: PALETTE.ink }}>{lastHold.seconds}s</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {EXERCISES.map(ex => {
          const done = completedToday.includes(ex.id);
          return (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: PALETTE.panel, border: `1px solid ${PALETTE.line}`,
                borderRadius: 16, padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div style={{
                width: 4, height: 40, borderRadius: 4, background: ex.accent, flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, fontWeight: 600, color: PALETTE.ink }}>
                    {ex.name}
                  </span>
                  <span style={{ fontSize: 12, color: PALETTE.inkSoft }}>{ex.subtitle}</span>
                </div>
                <div style={{ fontSize: 12.5, color: PALETTE.inkSoft, marginTop: 2 }}>
                  {Math.floor(ex.duration / 60)} min
                </div>
              </div>
              {done ? (
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', background: ex.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
                }}>
                  <IconCheck />
                </div>
              ) : (
                <div style={{ color: PALETTE.inkSoft, flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: 22, padding: '14px 16px', background: PALETTE.cream, borderRadius: 14,
        fontSize: 12.5, color: PALETTE.inkSoft, lineHeight: 1.55,
      }}>
        Never hold your breath in water or while lying down during this 8-week prep. Always do the static hold seated, alone-in-a-room is fine, and stop the moment it feels like real discomfort rather than a passing urge.
      </div>
    </div>
  );
}

// ============================================================
// INFO BLOCK — what/how/why, shown above Start
// ============================================================
function InfoBlock({ exercise }) {
  return (
    <div style={{
      background: PALETTE.panel, border: `1px solid ${PALETTE.line}`, borderRadius: 18,
      padding: '18px 18px 16px', marginBottom: 16,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6,
        color: exercise.accent, marginBottom: 4,
      }}>
        What it does
      </div>
      <div style={{ fontSize: 14, color: PALETTE.ink, lineHeight: 1.5, marginBottom: 14 }}>
        {exercise.what}
      </div>

      <div style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6,
        color: exercise.accent, marginBottom: 6,
      }}>
        How to do it
      </div>
      <ol style={{ margin: '0 0 14px', padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {exercise.how.map((step, i) => (
          <li key={i} style={{ fontSize: 13.5, color: PALETTE.ink, lineHeight: 1.5 }}>{step}</li>
        ))}
      </ol>

      <div style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6,
        color: exercise.accent, marginBottom: 4,
      }}>
        Why it matters
      </div>
      <div style={{ fontSize: 13.5, color: PALETTE.inkSoft, lineHeight: 1.5, fontStyle: 'italic' }}>
        {exercise.why}
      </div>
    </div>
  );
}

// ============================================================
// ROUND TRACKER — shown during/after sessions, with reset
// ============================================================
function RoundTracker({ current, total, onReset, accent, label = 'Round' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: PALETTE.cream, borderRadius: 14, padding: '10px 14px', marginBottom: 14,
    }}>
      <div style={{ fontSize: 13, color: PALETTE.inkSoft }}>
        {label} <span style={{ fontWeight: 700, color: PALETTE.ink, fontSize: 15 }}>{current}</span> / {total}
      </div>
      <button
        onClick={onReset}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: accent,
          background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 6px',
        }}
      >
        <IconReset /> Reset round
      </button>
    </div>
  );
}

// ============================================================
// COMPLETION SCREEN
// ============================================================
function CompletionScreen({ exercise, onDone, summary }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 24px 40px', textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: exercise.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 18,
      }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path d="M4 12.5l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 600, color: PALETTE.ink, marginBottom: 6 }}>
        {exercise.name} complete
      </div>
      {summary && (
        <div style={{ fontSize: 14, color: PALETTE.inkSoft, marginBottom: 28, maxWidth: 280, lineHeight: 1.5 }}>
          {summary}
        </div>
      )}
      <button
        onClick={onDone}
        style={{
          background: exercise.accent, color: '#fff', border: 'none', borderRadius: 14,
          padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: summary ? 0 : 28,
        }}
      >
        Back to session
      </button>
    </div>
  );
}

// ============================================================
// 1. KAPALABHATI — auto-advancing metronome, hands-free, 3 rounds of 30
// ============================================================
const KAPAL_PACES = [
  { id: 'slow', label: 'Slow', ms: 1000, hint: '1 exhale / sec' },
  { id: 'medium', label: 'Medium', ms: 800, hint: '~1.25 exhales / sec' },
  { id: 'fast', label: 'Fast', ms: 600, hint: '~1.7 exhales / sec' },
];

function KapalabhatiScreen({ exercise, soundOn, sounds, onComplete }) {
  const [phase, setPhase] = useState('ready'); // ready | active | resting | paused | done
  const [paceId, setPaceId] = useState('medium');
  const [round, setRound] = useState(1);
  const [exhaleCount, setExhaleCount] = useState(0);
  const [restSecondsLeft, setRestSecondsLeft] = useState(exercise.pauseBetweenRounds);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [pulseOn, setPulseOn] = useState(false);
  const beatRef = useRef(null);
  const restRef = useRef(null);
  const clockRef = useRef(null);
  const startedAtRef = useRef(null);
  const elapsedAccumRef = useRef(0);

  const pace = KAPAL_PACES.find(p => p.id === paceId) || KAPAL_PACES[1];

  useEffect(() => {
    return () => {
      clearInterval(beatRef.current);
      clearInterval(restRef.current);
      clearInterval(clockRef.current);
    };
  }, []);

  const startClock = () => {
    startedAtRef.current = Date.now();
    clockRef.current = setInterval(() => {
      setElapsedMs(elapsedAccumRef.current + (Date.now() - startedAtRef.current));
    }, 80);
  };
  const pauseClock = () => {
    elapsedAccumRef.current += Date.now() - startedAtRef.current;
    clearInterval(clockRef.current);
  };

  // Drives the metronome beat for the current round
  const runBeat = (msInterval) => {
    clearInterval(beatRef.current);
    beatRef.current = setInterval(() => {
      setPulseOn(true);
      if (soundOn) sounds.kapalabhatiExhale();
      setTimeout(() => setPulseOn(false), Math.min(160, msInterval * 0.35));
      setExhaleCount(prev => {
        const next = prev + 1;
        if (next >= exercise.targetExhales) {
          clearInterval(beatRef.current);
          pauseClock();
          setRound(r => {
            if (r >= exercise.rounds) {
              setPhase('done');
              if (soundOn) sounds.exerciseComplete();
            } else {
              if (soundOn) sounds.roundComplete();
              setPhase('resting');
              setRestSecondsLeft(exercise.pauseBetweenRounds);
            }
            return r;
          });
        }
        return next;
      });
    }, msInterval);
  };

  const handleStart = () => {
    setPhase('active');
    setExhaleCount(0);
    startClock();
    if (soundOn) sounds.start();
    // brief beat before the metronome kicks in so the first exhale isn't a surprise
    setTimeout(() => runBeat(pace.ms), 700);
  };

  const handlePauseToggle = () => {
    if (phase === 'active') {
      clearInterval(beatRef.current);
      pauseClock();
      setPhase('paused');
    } else if (phase === 'paused') {
      setPhase('active');
      startClock();
      runBeat(pace.ms);
    }
  };

  useEffect(() => {
    if (phase === 'resting') {
      restRef.current = setInterval(() => {
        setRestSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(restRef.current);
            setRound(r => r + 1);
            setExhaleCount(0);
            setPhase('active');
            startClock();
            if (soundOn) sounds.start();
            setTimeout(() => runBeat(pace.ms), 700);
            return exercise.pauseBetweenRounds;
          }
          if (prev <= 4 && soundOn) sounds.tick();
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(restRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleReset = () => {
    clearInterval(beatRef.current);
    clearInterval(restRef.current);
    pauseClock();
    elapsedAccumRef.current = 0;
    setElapsedMs(0);
    setExhaleCount(0);
    setRound(1);
    setPhase('ready');
  };

  const handleResetRound = () => {
    clearInterval(beatRef.current);
    setExhaleCount(0);
    if (soundOn) sounds.tick();
    if (phase === 'active') runBeat(pace.ms);
  };

  if (phase === 'done') {
    return (
      <CompletionScreen
        exercise={exercise}
        summary={`3 rounds of ${exercise.targetExhales} exhales · ${fmtMs(elapsedMs)} total`}
        onDone={onComplete}
      />
    );
  }

  return (
    <div style={{ padding: '4px 4px 30px' }}>
      {phase === 'ready' && <InfoBlock exercise={exercise} />}

      {phase !== 'ready' && (
        <RoundTracker
          current={round}
          total={exercise.rounds}
          onReset={handleResetRound}
          accent={exercise.accent}
          label="Round"
        />
      )}

      <div style={{
        background: PALETTE.panel, border: `1px solid ${PALETTE.line}`, borderRadius: 22,
        padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {phase === 'ready' && (
          <>
            <div style={{ fontSize: 13, color: PALETTE.inkSoft, marginBottom: 16, textAlign: 'center' }}>
              This one paces itself — a beat marks every exhale, so you can close your eyes and just follow along. It'll count to {exercise.targetExhales} across {exercise.rounds} rounds, with a 10-second rest between.
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: PALETTE.inkSoft, marginBottom: 8 }}>
              Pace
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
              {KAPAL_PACES.map(p => {
                const active = p.id === paceId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPaceId(p.id)}
                    style={{
                      padding: '9px 16px', borderRadius: 12, fontSize: 13.5, fontWeight: 600,
                      border: `1.5px solid ${active ? exercise.accent : PALETTE.line}`,
                      background: active ? `${exercise.accent}1a` : PALETTE.panel,
                      color: active ? exercise.accent : PALETTE.inkSoft,
                      cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11.5, color: PALETTE.inkSoft, marginBottom: 18 }}>{pace.hint} · change anytime before starting</div>

            <StartButton accent={exercise.accent} onClick={handleStart} />
          </>
        )}

        {(phase === 'active' || phase === 'paused') && (
          <>
            <div style={{ fontSize: 13, color: PALETTE.inkSoft, marginBottom: 6 }}>Elapsed</div>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 30, fontWeight: 600, color: PALETTE.ink, marginBottom: 22 }}>
              {fmtMs(elapsedMs)}
            </div>
            <div
              style={{
                width: 190, height: 190, borderRadius: '50%',
                background: exercise.accent,
                color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                transform: pulseOn ? 'scale(1.08)' : 'scale(1)',
                boxShadow: pulseOn
                  ? `0 0 0 14px ${exercise.accent}26, 0 8px 28px -8px ${exercise.accent}cc`
                  : `0 8px 28px -8px ${exercise.accent}99`,
                transition: 'transform 0.12s ease-out, box-shadow 0.12s ease-out',
              }}
            >
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 52, fontWeight: 700, lineHeight: 1 }}>
                {exhaleCount}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                of {exercise.targetExhales} {phase === 'paused' ? '· paused' : ''}
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: PALETTE.inkSoft, marginTop: 20, textAlign: 'center', maxWidth: 260 }}>
              {phase === 'paused'
                ? 'Tap resume when you\'re ready to continue.'
                : 'Exhale sharply on each pulse. Let the inhale happen on its own.'}
            </div>
            <button
              onClick={handlePauseToggle}
              style={{ ...ghostResetStyle, marginTop: 18, width: 'auto', padding: '10px 24px' }}
            >
              {phase === 'paused' ? <IconPlay /> : <IconPause />}
              {phase === 'paused' ? 'Resume' : 'Pause'}
            </button>
          </>
        )}

        {phase === 'resting' && (
          <>
            <div style={{ fontSize: 14, color: PALETTE.inkSoft, marginBottom: 10 }}>Rest before round {round + 1}</div>
            <div style={{
              width: 150, height: 150, borderRadius: '50%', border: `4px solid ${exercise.accent}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 48, fontWeight: 700, color: exercise.accent }}>
                {restSecondsLeft}
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: PALETTE.inkSoft, marginTop: 18 }}>Breathe normally</div>
          </>
        )}
      </div>

      {phase !== 'ready' && (
        <button onClick={handleReset} style={ghostResetStyle}>
          <IconReset /> Restart exercise
        </button>
      )}
    </div>
  );
}

// ============================================================
// 2. ANULOM VILOM — 4-4-4-1 alternating-nostril guided cycle
// ============================================================
const ANULOM_STEPS = [
  { key: 'inL', label: 'Inhale — left nostril', counts: 4, side: 'left', kind: 'in' },
  { key: 'holdB1', label: 'Hold — both closed', counts: 4, side: 'both', kind: 'hold' },
  { key: 'exR', label: 'Exhale — right nostril', counts: 4, side: 'right', kind: 'out' },
  { key: 'pause1', label: 'Pause', counts: 1, side: 'right', kind: 'pause' },
  { key: 'inR', label: 'Inhale — right nostril', counts: 4, side: 'right', kind: 'in' },
  { key: 'holdB2', label: 'Hold — both closed', counts: 4, side: 'both', kind: 'hold' },
  { key: 'exL', label: 'Exhale — left nostril', counts: 4, side: 'left', kind: 'out' },
  { key: 'pause2', label: 'Pause', counts: 1, side: 'left', kind: 'pause' },
];

function AnulomVilomScreen({ exercise, soundOn, sounds, onComplete }) {
  const [phase, setPhase] = useState('ready'); // ready | active | done
  const [cycle, setCycle] = useState(1);
  const [stepIdx, setStepIdx] = useState(0);
  const [countLeft, setCountLeft] = useState(ANULOM_STEPS[0].counts);
  const tickRef = useRef(null);
  const lastSoundKindRef = useRef(null);

  const playStepSound = (kind) => {
    if (!soundOn || lastSoundKindRef.current === kind) return;
    lastSoundKindRef.current = kind;
    if (kind === 'in') sounds.inhale();
    else if (kind === 'out') sounds.exhale();
    else if (kind === 'hold') sounds.holdIn();
  };

  useEffect(() => {
    if (phase !== 'active') return;
    playStepSound(ANULOM_STEPS[stepIdx].kind);
    tickRef.current = setInterval(() => {
      setCountLeft(prev => {
        if (prev <= 1) {
          // advance step
          setStepIdx(si => {
            const nextSi = (si + 1) % ANULOM_STEPS.length;
            if (nextSi === 0) {
              setCycle(c => {
                const nextCycle = c + 1;
                if (c >= exercise.targetCycles) {
                  clearInterval(tickRef.current);
                  setPhase('done');
                  if (soundOn) sounds.exerciseComplete();
                  return c;
                }
                if (soundOn) sounds.roundComplete();
                return nextCycle;
              });
            }
            lastSoundKindRef.current = null;
            return nextSi;
          });
          return ANULOM_STEPS[(stepIdx + 1) % ANULOM_STEPS.length].counts;
        }
        if (soundOn && prev <= 2) sounds.tick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stepIdx]);

  const handleStart = () => {
    setPhase('active');
    setCycle(1);
    setStepIdx(0);
    setCountLeft(ANULOM_STEPS[0].counts);
    lastSoundKindRef.current = null;
    if (soundOn) sounds.start();
  };

  const handleReset = () => {
    clearInterval(tickRef.current);
    setPhase('ready');
  };

  const handleResetRound = () => {
    setStepIdx(0);
    setCountLeft(ANULOM_STEPS[0].counts);
    lastSoundKindRef.current = null;
    if (soundOn) sounds.tick();
  };

  if (phase === 'done') {
    return (
      <CompletionScreen
        exercise={exercise}
        summary={`${exercise.targetCycles} complete cycles finished`}
        onDone={onComplete}
      />
    );
  }

  const step = ANULOM_STEPS[stepIdx];

  return (
    <div style={{ padding: '4px 4px 30px' }}>
      {phase === 'ready' && <InfoBlock exercise={exercise} />}

      {phase === 'active' && (
        <RoundTracker current={cycle} total={exercise.targetCycles} onReset={handleResetRound} accent={exercise.accent} label="Cycle" />
      )}

      <div style={{
        background: PALETTE.panel, border: `1px solid ${PALETTE.line}`, borderRadius: 22,
        padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {phase === 'ready' && (
          <>
            <div style={{ fontSize: 13, color: PALETTE.inkSoft, marginBottom: 18, textAlign: 'center' }}>
              We'll guide each phase with a count and a chime: inhale, hold, exhale, pause — alternating sides — for {exercise.targetCycles} cycles.
            </div>
            <StartButton accent={exercise.accent} onClick={handleStart} />
          </>
        )}

        {phase === 'active' && (
          <>
            <NostrilDiagram side={step.side} accent={exercise.accent} />
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 19, fontWeight: 600, color: PALETTE.ink, marginTop: 18, textAlign: 'center' }}>
              {step.label}
            </div>
            <div style={{
              width: 110, height: 110, borderRadius: '50%', border: `3px solid ${exercise.accent}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 14,
            }}>
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 38, fontWeight: 700, color: exercise.accent }}>
                {countLeft}
              </div>
            </div>
          </>
        )}
      </div>

      {phase === 'active' && (
        <button onClick={handleReset} style={ghostResetStyle}>
          <IconReset /> Restart exercise
        </button>
      )}
    </div>
  );
}

function NostrilDiagram({ side, accent }) {
  // simple face/nose schematic showing which nostril is open
  const leftOpen = side === 'left';
  const rightOpen = side === 'right';
  return (
    <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
      <path d="M60 8c-20 0-30 22-30 40 0 22 13 34 30 34s30-12 30-34c0-18-10-40-30-40z"
        stroke={PALETTE.line} strokeWidth="2" fill={PALETTE.cream} />
      {/* left nostril (viewer's left = subject's right, but keep simple/visual) */}
      <ellipse cx="48" cy="58" rx="7" ry={leftOpen ? 9 : 3} fill={leftOpen ? accent : PALETTE.inkSoft} opacity={leftOpen ? 1 : 0.35} />
      <ellipse cx="72" cy="58" rx="7" ry={rightOpen ? 9 : 3} fill={rightOpen ? accent : PALETTE.inkSoft} opacity={rightOpen ? 1 : 0.35} />
      {side === 'both' && (
        <>
          <ellipse cx="48" cy="58" rx="7" ry="3" fill={PALETTE.inkSoft} opacity="0.35" />
          <ellipse cx="72" cy="58" rx="7" ry="3" fill={PALETTE.inkSoft} opacity="0.35" />
        </>
      )}
    </svg>
  );
}

// ============================================================
// 3. BOX BREATHING — special 4-phase synchronized timer
// ============================================================
const BOX_PHASES = [
  { key: 'inhale', label: 'Inhale', kind: 'in' },
  { key: 'hold1', label: 'Hold', kind: 'hold' },
  { key: 'exhale', label: 'Exhale', kind: 'out' },
  { key: 'hold2', label: 'Hold (empty)', kind: 'hold' },
];

function BoxBreathingScreen({ exercise, soundOn, sounds, onComplete }) {
  const [phase, setPhase] = useState('ready'); // ready | active | done
  const [cycle, setCycle] = useState(1);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countLeft, setCountLeft] = useState(exercise.phaseSeconds);
  const tickRef = useRef(null);
  const lastSoundRef = useRef(null);

  const playPhaseSound = (kind) => {
    if (!soundOn || lastSoundRef.current === kind) return;
    lastSoundRef.current = kind;
    if (kind === 'in') sounds.inhale();
    else if (kind === 'out') sounds.exhale();
    else if (kind === 'hold') sounds.holdIn();
  };

  useEffect(() => {
    if (phase !== 'active') return;
    playPhaseSound(BOX_PHASES[phaseIdx].kind);
    tickRef.current = setInterval(() => {
      setCountLeft(prev => {
        if (prev <= 1) {
          setPhaseIdx(pi => {
            const nextPi = (pi + 1) % BOX_PHASES.length;
            if (nextPi === 0) {
              setCycle(c => {
                if (c >= exercise.targetCycles) {
                  clearInterval(tickRef.current);
                  setPhase('done');
                  if (soundOn) sounds.exerciseComplete();
                  return c;
                }
                if (soundOn) sounds.roundComplete();
                return c + 1;
              });
            }
            lastSoundRef.current = null;
            return nextPi;
          });
          return exercise.phaseSeconds;
        }
        if (soundOn && prev <= 2) sounds.tick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, phaseIdx]);

  const handleStart = () => {
    setPhase('active');
    setCycle(1);
    setPhaseIdx(0);
    setCountLeft(exercise.phaseSeconds);
    lastSoundRef.current = null;
    if (soundOn) sounds.start();
  };
  const handleReset = () => {
    clearInterval(tickRef.current);
    setPhase('ready');
  };
  const handleResetRound = () => {
    setPhaseIdx(0);
    setCountLeft(exercise.phaseSeconds);
    lastSoundRef.current = null;
    if (soundOn) sounds.tick();
  };

  if (phase === 'done') {
    return (
      <CompletionScreen
        exercise={exercise}
        summary={`${exercise.targetCycles} box cycles · ${exercise.phaseSeconds}s per side`}
        onDone={onComplete}
      />
    );
  }

  const curPhase = BOX_PHASES[phaseIdx];
  const cornerActive = phaseIdx; // 0=top,1=right,2=bottom,3=left progress

  return (
    <div style={{ padding: '4px 4px 30px' }}>
      {phase === 'ready' && <InfoBlock exercise={exercise} />}
      {phase === 'active' && (
        <RoundTracker current={cycle} total={exercise.targetCycles} onReset={handleResetRound} accent={exercise.accent} label="Cycle" />
      )}

      <div style={{
        background: PALETTE.panel, border: `1px solid ${PALETTE.line}`, borderRadius: 22,
        padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {phase === 'ready' && (
          <>
            <div style={{ fontSize: 13, color: PALETTE.inkSoft, marginBottom: 18, textAlign: 'center' }}>
              A square will trace itself as you breathe: inhale along the top, hold down the side, exhale along the bottom, hold up the other side — {exercise.phaseSeconds} seconds per edge, {exercise.targetCycles} cycles.
            </div>
            <StartButton accent={exercise.accent} onClick={handleStart} />
          </>
        )}

        {phase === 'active' && (
          <>
            <BoxTimer phaseIdx={phaseIdx} progress={(exercise.phaseSeconds - countLeft) / exercise.phaseSeconds} accent={exercise.accent} countLeft={countLeft} label={curPhase.label} />
          </>
        )}
      </div>

      {phase === 'active' && (
        <button onClick={handleReset} style={ghostResetStyle}>
          <IconReset /> Restart exercise
        </button>
      )}
    </div>
  );
}

function BoxTimer({ phaseIdx, progress, accent, countLeft, label }) {
  // Draw a square (200x200) with a dot traveling around the perimeter
  const size = 200;
  const pad = 14;
  const inner = size - pad * 2;
  // perimeter positions for 4 corners, dot moves along current edge based on phaseIdx + progress
  const corners = [
    { x: pad, y: pad },               // top-left
    { x: pad + inner, y: pad },        // top-right
    { x: pad + inner, y: pad + inner }, // bottom-right
    { x: pad, y: pad + inner },         // bottom-left
  ];
  const from = corners[phaseIdx];
  const to = corners[(phaseIdx + 1) % 4];
  const dotX = from.x + (to.x - from.x) * progress;
  const dotY = from.y + (to.y - from.y) * progress;

  const edgeActive = (edgeIdx) => edgeIdx === phaseIdx;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect x={pad} y={pad} width={inner} height={inner} rx="10" fill="none" stroke={PALETTE.line} strokeWidth="3" />
        {/* edge highlights */}
        <line x1={pad} y1={pad} x2={pad + inner} y2={pad} stroke={edgeActive(0) ? accent : 'transparent'} strokeWidth="4" strokeLinecap="round" />
        <line x1={pad + inner} y1={pad} x2={pad + inner} y2={pad + inner} stroke={edgeActive(1) ? accent : 'transparent'} strokeWidth="4" strokeLinecap="round" />
        <line x1={pad + inner} y1={pad + inner} x2={pad} y2={pad + inner} stroke={edgeActive(2) ? accent : 'transparent'} strokeWidth="4" strokeLinecap="round" />
        <line x1={pad} y1={pad + inner} x2={pad} y2={pad} stroke={edgeActive(3) ? accent : 'transparent'} strokeWidth="4" strokeLinecap="round" />
        <circle cx={dotX} cy={dotY} r="9" fill={accent} />
      </svg>
      <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 600, color: PALETTE.ink, marginTop: 14 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 44, fontWeight: 700, color: accent, marginTop: 4 }}>
        {countLeft}
      </div>
    </div>
  );
}

// ============================================================
// 4. STATIC BREATH HOLD — stopwatch counting up, manual stop
// ============================================================
function StaticHoldScreen({ exercise, soundOn, sounds, onComplete, holdHistory, addHoldRecord }) {
  const [phase, setPhase] = useState('ready'); // ready | holding | done
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef(null);
  const startedAtRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handleStart = () => {
    setPhase('holding');
    startedAtRef.current = Date.now();
    if (soundOn) sounds.start();
    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 80);
  };

  const handleStop = () => {
    clearInterval(intervalRef.current);
    const seconds = Math.round(elapsedMs / 1000);
    addHoldRecord(seconds);
    if (soundOn) sounds.exerciseComplete();
    setPhase('done');
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setElapsedMs(0);
    setPhase('ready');
  };

  const bestHold = holdHistory.length ? Math.max(...holdHistory.map(h => h.seconds)) : null;

  if (phase === 'done') {
    const seconds = Math.round(elapsedMs / 1000);
    return (
      <CompletionScreen
        exercise={exercise}
        summary={`You held for ${seconds} seconds${bestHold && seconds >= bestHold ? ' — a new best!' : ''}`}
        onDone={onComplete}
      />
    );
  }

  return (
    <div style={{ padding: '4px 4px 30px' }}>
      {phase === 'ready' && <InfoBlock exercise={exercise} />}

      <div style={{
        background: PALETTE.panel, border: `1px solid ${PALETTE.line}`, borderRadius: 22,
        padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {phase === 'ready' && (
          <>
            <div style={{ fontSize: 13, color: PALETTE.inkSoft, marginBottom: 18, textAlign: 'center' }}>
              Take your breath, exhale 30%, then tap start the moment you begin holding. Tap stop the moment you feel a real urge to breathe — not before.
            </div>
            {bestHold !== null && (
              <div style={{ fontSize: 12.5, color: PALETTE.inkSoft, marginBottom: 16 }}>
                Your best so far: <strong style={{ color: PALETTE.ink }}>{bestHold}s</strong>
              </div>
            )}
            <StartButton accent={exercise.accent} onClick={handleStart} label="Start hold" />
          </>
        )}

        {phase === 'holding' && (
          <>
            <div style={{ fontSize: 13, color: PALETTE.inkSoft, marginBottom: 8 }}>Holding…</div>
            <div style={{
              fontFamily: "'Fraunces', Georgia, serif", fontSize: 54, fontWeight: 700, color: exercise.accent,
              marginBottom: 26, fontVariantNumeric: 'tabular-nums',
            }}>
              {fmtMs(elapsedMs)}
            </div>
            <button
              onClick={handleStop}
              style={{
                width: 150, height: 150, borderRadius: '50%', background: exercise.accent, color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700,
                boxShadow: `0 8px 28px -8px ${exercise.accent}99`,
              }}
            >
              Stop
            </button>
            <div style={{ fontSize: 12, color: PALETTE.inkSoft, marginTop: 18, maxWidth: 240, textAlign: 'center' }}>
              Relax your jaw. Stop as soon as the urge becomes real — don't push for a number.
            </div>
          </>
        )}
      </div>

      {phase === 'holding' && (
        <button onClick={handleReset} style={ghostResetStyle}>
          <IconReset /> Cancel hold
        </button>
      )}

      {holdHistory.length > 0 && phase === 'ready' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: PALETTE.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 }}>
            Recent holds
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {holdHistory.slice(-7).reverse().map((h, i) => (
              <div key={i} style={{
                flexShrink: 0, background: PALETTE.cream, borderRadius: 12, padding: '10px 14px', textAlign: 'center', minWidth: 64,
              }}>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, fontWeight: 700, color: PALETTE.ink }}>{h.seconds}s</div>
                <div style={{ fontSize: 10.5, color: PALETTE.inkSoft, marginTop: 2 }}>{h.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 5. RECOVERY BREATHING — inhale 5 / exhale 6, asymmetric guided
// ============================================================
function RecoveryScreen({ exercise, soundOn, sounds, onComplete }) {
  const [phase, setPhase] = useState('ready'); // ready | resting | active | done
  const [restLeft, setRestLeft] = useState(30);
  const [cycle, setCycle] = useState(1);
  const [step, setStep] = useState('in'); // in | out
  const [countLeft, setCountLeft] = useState(exercise.inhaleSeconds);
  const tickRef = useRef(null);
  const lastKindRef = useRef(null);

  useEffect(() => {
    if (phase !== 'resting') return;
    tickRef.current = setInterval(() => {
      setRestLeft(prev => {
        if (prev <= 1) {
          clearInterval(tickRef.current);
          setPhase('active');
          setStep('in');
          setCountLeft(exercise.inhaleSeconds);
          lastKindRef.current = null;
          return 0;
        }
        if (soundOn && prev <= 4) sounds.tick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'active') return;
    if (soundOn && lastKindRef.current !== step) {
      lastKindRef.current = step;
      if (step === 'in') sounds.inhale(); else sounds.exhale();
    }
    tickRef.current = setInterval(() => {
      setCountLeft(prev => {
        if (prev <= 1) {
          if (step === 'in') {
            setStep('out');
            return exercise.exhaleSeconds;
          } else {
            // completed a full cycle
            setCycle(c => {
              if (c >= exercise.targetCycles) {
                clearInterval(tickRef.current);
                setPhase('done');
                if (soundOn) sounds.exerciseComplete();
                return c;
              }
              if (soundOn) sounds.roundComplete();
              return c + 1;
            });
            setStep('in');
            lastKindRef.current = null;
            return exercise.inhaleSeconds;
          }
        }
        if (soundOn && prev <= 2) sounds.tick();
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, step]);

  const handleStart = () => {
    setPhase('resting');
    setRestLeft(30);
    if (soundOn) sounds.start();
  };
  const handleSkipRest = () => {
    clearInterval(tickRef.current);
    setPhase('active');
    setStep('in');
    setCountLeft(exercise.inhaleSeconds);
    lastKindRef.current = null;
  };
  const handleReset = () => {
    clearInterval(tickRef.current);
    setPhase('ready');
  };
  const handleResetRound = () => {
    setStep('in');
    setCountLeft(exercise.inhaleSeconds);
    lastKindRef.current = null;
    if (soundOn) sounds.tick();
  };

  if (phase === 'done') {
    return (
      <CompletionScreen
        exercise={exercise}
        summary="Session complete. Write down today's breath hold time before you go."
        onDone={onComplete}
      />
    );
  }

  return (
    <div style={{ padding: '4px 4px 30px' }}>
      {phase === 'ready' && <InfoBlock exercise={exercise} />}
      {phase === 'active' && (
        <RoundTracker current={cycle} total={exercise.targetCycles} onReset={handleResetRound} accent={exercise.accent} label="Cycle" />
      )}

      <div style={{
        background: PALETTE.panel, border: `1px solid ${PALETTE.line}`, borderRadius: 22,
        padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {phase === 'ready' && (
          <>
            <div style={{ fontSize: 13, color: PALETTE.inkSoft, marginBottom: 18, textAlign: 'center' }}>
              First 30 seconds of normal breathing to recover, then {exercise.targetCycles} slow cycles — inhale {exercise.inhaleSeconds}, exhale {exercise.exhaleSeconds}.
            </div>
            <StartButton accent={exercise.accent} onClick={handleStart} />
          </>
        )}

        {phase === 'resting' && (
          <>
            <div style={{ fontSize: 14, color: PALETTE.inkSoft, marginBottom: 10 }}>Breathing normally</div>
            <div style={{
              width: 140, height: 140, borderRadius: '50%', border: `4px solid ${exercise.accent}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 42, fontWeight: 700, color: exercise.accent }}>
                {restLeft}
              </div>
            </div>
            <button onClick={handleSkipRest} style={{ ...ghostResetStyle, marginTop: 20, border: 'none' }}>
              Skip rest →
            </button>
          </>
        )}

        {phase === 'active' && (
          <BreathBubble step={step} countLeft={countLeft} total={step === 'in' ? exercise.inhaleSeconds : exercise.exhaleSeconds} accent={exercise.accent} />
        )}
      </div>

      {(phase === 'active' || phase === 'resting') && (
        <button onClick={handleReset} style={ghostResetStyle}>
          <IconReset /> Restart exercise
        </button>
      )}
    </div>
  );
}

function BreathBubble({ step, countLeft, total, accent }) {
  const isIn = step === 'in';
  const progress = (total - countLeft + 1) / total;
  const scale = isIn ? 0.7 + 0.3 * progress : 1.0 - 0.3 * progress;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: 160, height: 160, borderRadius: '50%',
        background: `${accent}22`, border: `3px solid ${accent}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${scale})`, transition: 'transform 0.9s ease-in-out',
      }}>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 36, fontWeight: 700, color: accent }}>
          {countLeft}
        </div>
      </div>
      <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 19, fontWeight: 600, color: PALETTE.ink, marginTop: 18 }}>
        {isIn ? 'Inhale through the nose' : 'Exhale through the mouth'}
      </div>
    </div>
  );
}

// ============================================================
// Shared small components
// ============================================================
function StartButton({ accent, onClick, label = 'Start' }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, background: accent, color: '#fff',
        border: 'none', borderRadius: 16, padding: '15px 38px', fontSize: 16, fontWeight: 600,
        cursor: 'pointer', boxShadow: `0 8px 22px -8px ${accent}aa`,
      }}
    >
      <IconPlay /> {label}
    </button>
  );
}

const ghostResetStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  width: '100%', marginTop: 14, padding: '11px 0', fontSize: 13, fontWeight: 600,
  color: PALETTE.inkSoft, background: 'transparent', border: `1px solid ${PALETTE.line}`,
  borderRadius: 12, cursor: 'pointer',
};

// ============================================================
// EXERCISE SCREEN ROUTER
// ============================================================
function ExerciseScreen({ exercise, soundOn, sounds, onComplete }) {
  const props = { exercise, soundOn, sounds, onComplete };
  switch (exercise.mode) {
    case 'kapalabhati': return <KapalabhatiScreen {...props} />;
    case 'anulom-vilom': return <AnulomVilomScreen {...props} />;
    case 'box': return <BoxBreathingScreen {...props} />;
    case 'recovery': return <RecoveryScreen {...props} />;
    default: return null;
  }
}

// ============================================================
// ROOT APP
// ============================================================
export default function BreathFlowApp() {
  const [screen, setScreen] = useState('home'); // home | exercise
  const [activeExercise, setActiveExercise] = useState(null);
  const [completedToday, setCompletedToday] = useState([]);
  const [soundOn, setSoundOn] = useState(true);
  const [holdHistory, setHoldHistory] = useState([]);
  const { sounds, unlock } = useAudioEngine();

  const handleSelect = (ex) => {
    unlock();
    setActiveExercise(ex);
    setScreen('exercise');
  };

  const handleBack = () => {
    setScreen('home');
    setActiveExercise(null);
  };

  const handleExerciseComplete = () => {
    if (activeExercise && !completedToday.includes(activeExercise.id)) {
      setCompletedToday(prev => [...prev, activeExercise.id]);
    }
    setScreen('home');
    setActiveExercise(null);
  };

  const addHoldRecord = (seconds) => {
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`;
    setHoldHistory(prev => [...prev, { seconds, date: dateStr }]);
  };

  return (
    <div style={{
      minHeight: '100vh', background: PALETTE.bg, color: PALETTE.ink,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        button { font-family: inherit; }
        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
      `}</style>

      {screen === 'home' && (
        <HomeScreen
          onSelect={handleSelect}
          completedToday={completedToday}
          soundOn={soundOn}
          setSoundOn={setSoundOn}
          holdHistory={holdHistory}
        />
      )}

      {screen === 'exercise' && activeExercise && (
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px' }}>
          <TopBar
            onBack={handleBack}
            title={activeExercise.name}
            accent={activeExercise.accent}
            soundOn={soundOn}
            setSoundOn={setSoundOn}
          />
          {activeExercise.mode === 'static-hold' ? (
            <StaticHoldScreen
              exercise={activeExercise}
              soundOn={soundOn}
              sounds={sounds}
              onComplete={handleExerciseComplete}
              holdHistory={holdHistory}
              addHoldRecord={addHoldRecord}
            />
          ) : (
            <ExerciseScreen
              exercise={activeExercise}
              soundOn={soundOn}
              sounds={sounds}
              onComplete={handleExerciseComplete}
            />
          )}
        </div>
      )}
    </div>
  );
}

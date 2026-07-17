import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

const INTRO_KEY = 'elamora_intro_seen_rose_gold_v1'
// Pink rose gold boutique intro video — blush envelope opening animation.
const VIDEO_SRC = '/intro/rose-intro-elamora-mobile.mp4'

// ─── Video timestamps in seconds ────────────────────────────────────────────
const HOME_REVEAL_START_TIME = 4    // homepage commence à apparaître dans la zone enveloppe
const VIDEO_PAUSE_TIME       = 4.5  // vidéo se met en pause sur ce frame (enveloppe ouverte)

// ─── Homepage animation ──────────────────────────────────────────────────────
const HOME_INITIAL_SCALE   = 0.92  // scale initial (homepage "posée" à l'intérieur)
const HOME_EXPAND_DURATION = 1.8   // secondes pour l'expansion clip + scale

// ─── Central area of the opened envelope ────────────────────────────────────
// clip-path: inset(top% side% bottom% side% round radius)
// Ajuste ces valeurs après test visuel — c'est l'objectif principal des constantes
const ENV_INSET_TOP    = 20   // % depuis le haut de l'écran
const ENV_INSET_BOTTOM = 16   // % depuis le bas de l'écran
const ENV_INSET_SIDE   = 10   // % depuis chaque côté
const ENV_RADIUS       = 14   // px — arrondi des coins du masque

// Precomputed clip paths
const CLIP_ENV  = `inset(${ENV_INSET_TOP}% ${ENV_INSET_SIDE}% ${ENV_INSET_BOTTOM}% ${ENV_INSET_SIDE}% round ${ENV_RADIUS}px)`
const CLIP_FULL = 'inset(0% 0% 0% 0% round 0px)'

// Expansion easing
const EXPAND_EASE = [0.33, 1, 0.68, 1] as const

type Phase = 'playing' | 'revealInsideEnvelope' | 'expandingHome' | 'done'

export function IntroEnvelope({ children }: { children: React.ReactNode }) {
  const [mounted,   setMounted]   = useState(false)
  const [showIntro, setShowIntro] = useState(false)
  const [phase,     setPhase]     = useState<Phase>('playing')

  const videoRef   = useRef<HTMLVideoElement>(null)
  const doneRef    = useRef(false)
  // phaseRef miroir de phase : évite les stale closures dans handleTimeUpdate
  const phaseRef   = useRef<Phase>('playing')
  const prefersReduced = useReducedMotion()

  // ── Mount ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const mobile = window.innerWidth < 768
    const homepage = window.location.pathname === '/'
    const forceIntroRequested =
      new URLSearchParams(window.location.search).get('intro') === '1'
    let seen = false
    try { seen = !!localStorage.getItem(INTRO_KEY) } catch {}
    const needs =
      homepage && mobile && (forceIntroRequested || !seen) && !prefersReduced
    setShowIntro(needs)
    setMounted(true)
    if (needs) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [prefersReduced])

  // ── complete : marque vu, passe à done ───────────────────────────────────────
  const complete = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    try { localStorage.setItem(INTRO_KEY, '1') } catch {}
    phaseRef.current = 'done'
    setPhase('done')
  }, [])

  // ── Video timestamp handling ─────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const t = video.currentTime

    // playing → revealInsideEnvelope : homepage apparaît dans la zone enveloppe
    if (t >= HOME_REVEAL_START_TIME && phaseRef.current === 'playing') {
      phaseRef.current = 'revealInsideEnvelope'
      setPhase('revealInsideEnvelope')
    }

    // revealInsideEnvelope → expandingHome : vidéo pause + expansion commence
    if (t >= VIDEO_PAUSE_TIME && phaseRef.current === 'revealInsideEnvelope') {
      phaseRef.current = 'expandingHome'
      setPhase('expandingHome')
      video.pause()
      // complete() après la fin de l'expansion (+ 200ms de marge)
      setTimeout(complete, HOME_EXPAND_DURATION * 1000 + 200)
    }
  }, [complete])

  // ── Desktop / visiteur revenant : rendu direct sans intro ────────────────────
  if (!mounted || !showIntro) return <>{children}</>

  const isDone = phase === 'done'

  // ── Cibles d'animation de la homepage ────────────────────────────────────────
  //
  //  playing              : opacity 0  | scale HOME_INITIAL_SCALE | clip CLIP_ENV  (invisible)
  //  revealInsideEnvelope : opacity 0→1| scale HOME_INITIAL_SCALE | clip CLIP_ENV  (apparaît dans la zone)
  //  expandingHome        : opacity 1  | scale HOME_INITIAL_SCALE→1| clip CLIP_ENV→CLIP_FULL (expansion)
  //  done                 : opacity 1  | scale 1                  | clip CLIP_FULL (plein écran)
  //
  const pageAnimate = (() => {
    if (isDone || phase === 'expandingHome') {
      return { opacity: 1, scale: 1, clipPath: CLIP_FULL }
    }
    if (phase === 'revealInsideEnvelope') {
      return { opacity: 1, scale: HOME_INITIAL_SCALE, clipPath: CLIP_ENV }
    }
    // playing
    return { opacity: 0, scale: HOME_INITIAL_SCALE, clipPath: CLIP_ENV }
  })()

  const pageTransition = (() => {
    if (phase === 'revealInsideEnvelope') {
      // Seul opacity anime (0 → 1 en 0.5s) — clip et scale sont déjà en place
      return {
        opacity:  { duration: 0.5, ease: 'easeOut' as const },
        scale:    { duration: 0 },
        clipPath: { duration: 0 },
      }
    }
    if (phase === 'expandingHome') {
      // Clip et scale animent vers plein écran — opacity reste 1 (instantané)
      return {
        opacity:  { duration: 0 },
        scale:    { duration: HOME_EXPAND_DURATION, ease: EXPAND_EASE as unknown as string },
        clipPath: { duration: HOME_EXPAND_DURATION, ease: EXPAND_EASE as unknown as string },
      }
    }
    return { duration: 0 }
  })()

  // ── Animation de l'overlay vidéo ─────────────────────────────────────────────
  // Fade out lors de l'expansion (en parallèle du clip-path)
  const overlayAnimate    = { opacity: phase === 'expandingHome' ? 0 : 1 }
  const overlayTransition = phase === 'expandingHome'
    ? { duration: HOME_EXPAND_DURATION, ease: 'easeInOut' as const }
    : { duration: 0.4 }

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          HOMEPAGE
          • Toujours rendue en dessous (z:10) — les données chargent pendant la vidéo
          • clip-path : zone enveloppe → plein écran
          • scale     : HOME_INITIAL_SCALE → 1
          • opacity   : 0 → 1 à revealInsideEnvelope
          • pointerEvents:none jusqu'à done (overlay capte les taps)
      ══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        style={{
          position:      'fixed',
          inset:         0,
          zIndex:        10,
          overflowY:     isDone ? 'auto' : 'hidden',
          overflowX:     'hidden',
          pointerEvents: isDone ? 'auto' : 'none',
        }}
        initial={false}
        animate={pageAnimate}
        transition={pageTransition}
      >
        {children}
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          OVERLAY VIDÉO
          • z:20, au-dessus de la homepage
          • Fade out lors de expandingHome (en parallèle de l'expansion clip)
          • Tap partout → complete() (skip)
          • Exit propre via AnimatePresence quand isDone
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isDone && (
          <motion.div
            key="intro-overlay"
            style={{
              position:   'fixed',
              inset:      0,
              zIndex:     20,
              background: '#000',
            }}
            initial={{ opacity: 1 }}
            animate={overlayAnimate}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            onClick={complete}
            onTouchEnd={(e) => { e.preventDefault(); complete() }}
          >
            {/* ── Video ── autoPlay, muted, playsInline ── */}
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              autoPlay
              muted
              playsInline
              preload="metadata"
              onTimeUpdate={handleTimeUpdate}
              onEnded={complete}
              style={{
                position:  'absolute',
                inset:     0,
                width:     '100%',
                height:    '100%',
                objectFit: 'cover',
              }}
            />

            {/* ── Skip button ── stopPropagation pour éviter le double appel ── */}
            <motion.button
              style={{
                position:             'absolute',
                top:                  18,
                right:                16,
                zIndex:               10,
                background:           'rgba(255,255,255,0.15)',
                backdropFilter:       'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border:               '1px solid rgba(255,255,255,0.3)',
                color:                'rgba(255,255,255,0.9)',
                fontSize:             '0.62rem',
                letterSpacing:        '0.2em',
                textTransform:        'uppercase',
                cursor:               'pointer',
                padding:              '5px 14px',
                borderRadius:         20,
                fontFamily:           'var(--font-sans, sans-serif)',
                touchAction:          'manipulation',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              onClick={(e) => { e.stopPropagation(); complete() }}
            >
              Passer
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

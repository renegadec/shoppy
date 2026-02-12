'use client'

import { useEffect, useMemo, useState } from 'react'

export default function RotatingWord({
  words = ['premium', 'trusted', 'secure', 'simple'],
  intervalMs = 2200,
  className = '',
}) {
  const safeWords = useMemo(() => (Array.isArray(words) && words.length ? words : ['premium']), [words])
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('in')

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (mq?.matches) return

    const fadeOutMs = 180
    const fadeInMs = 220
    const holdMs = Math.max(800, intervalMs - (fadeOutMs + fadeInMs))

    let t1
    let t2
    let t3

    const tick = () => {
      setPhase('out')
      t2 = setTimeout(() => {
        setIdx((v) => (v + 1) % safeWords.length)
        setPhase('in')
      }, fadeOutMs)

      t3 = setTimeout(() => {
        t1 = setTimeout(tick, holdMs)
      }, fadeOutMs + fadeInMs)
    }

    t1 = setTimeout(tick, holdMs)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [intervalMs, safeWords])

  const word = safeWords[idx] || safeWords[0]

  return (
    <span
      className={`inline-flex align-baseline transition-opacity duration-200 ${phase === 'out' ? 'opacity-0' : 'opacity-100'} ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {word}
    </span>
  )
}

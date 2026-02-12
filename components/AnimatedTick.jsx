'use client'

export default function AnimatedTick() {
  return (
    <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-emerald-700">
        <path
          d="M20 6L9 17l-5-5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="tick-path"
        />
      </svg>
      <style jsx>{`
        .tick-path {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: draw 700ms ease-out forwards;
        }
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import App from '@/App'

export const Route = createFileRoute('/app/')({
  head: () => ({
    meta: [
      { title: 'Market Radar Bot · Dual AI Trading Intelligence' },
      {
        name: 'description',
        content: 'Real-time market scanning, dual-AI analysis, risk controls, and broker-ready trade operations.',
      },
    ],
  }),
  component: MarketRadarRoute,
})

function MarketRadarRoute() {
  return (
    <BlinkClientBoundary
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#080d12] text-emerald-300">
          <div className="flex items-center gap-3 text-sm font-mono">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
            Initializing Market Radar…
          </div>
        </div>
      }
    >
      <App />
    </BlinkClientBoundary>
  )
}

'use client'

import { useEffect } from 'react'

type PortalThemeProps = {
  accentColor: string
  compactMode?: boolean
  children: React.ReactNode
}

function readableText(hex: string) {
  const value = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16))
  return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? '#5c2400' : '#ffffff'
}

export function PortalTheme({ accentColor, compactMode = false, children }: PortalThemeProps) {
  useEffect(() => {
    document.documentElement.style.setProperty('--agency-accent', accentColor)
    document.documentElement.style.setProperty('--agency-accent-foreground', readableText(accentColor))
    document.documentElement.dataset.portalDensity = compactMode ? 'compact' : 'comfortable'
  }, [accentColor, compactMode])

  return (
    <div
      className="agency-portal min-h-screen"
      style={{
        '--agency-accent': accentColor,
        '--agency-accent-foreground': readableText(accentColor),
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}


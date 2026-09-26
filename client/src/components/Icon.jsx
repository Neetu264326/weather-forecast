/**
 * One tiny inline-SVG icon set (24×24, feather-style strokes).
 * Keeps the bundle at 1 component instead of an icon library dependency.
 */
const PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  navigation: <path d="M3 11l19-9-9 19-2-8-8-2z" />,
  star: (
    <path d="M12 3.2l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2M20 12h2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  thermometer: (
    <path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z" />
  ),
  drop: <path d="M12 3s6 6.2 6 10.2A6 6 0 0 1 6 13.2C6 9.2 12 3 12 3z" />,
  wind: (
    <>
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
      <path d="M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  gauge: (
    <>
      <path d="M3.5 17a9 9 0 1 1 17 0" />
      <path d="M12 14.5 16 10" />
      <circle cx="12" cy="15" r="1.4" />
    </>
  ),
  cloud: (
    <path d="M18 10a5 5 0 0 0-9.6-1.5A4 4 0 1 0 7 18h11a4 4 0 0 0 0-8z" />
  ),
  arrowUp: <path d="M12 19V5M5 12l7-7 7 7" />,
  arrowDown: <path d="M12 5v14M19 12l-7 7-7-7" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <path d="M21 3v6h-6" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </>
  ),
  compare: (
    <>
      <path d="M12 3v18" />
      <path d="M8 7 4 11l4 4" />
      <path d="m16 7 4 4-4 4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16.5V11M12 7.6h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4M12 17.4h.01" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
  sunrise: (
    <>
      <path d="M12 8V2.5M9 5.5l3-3 3 3" />
      <path d="M4.9 9.9 6.3 11.3M2 16.5h2M20 16.5h2M17.7 11.3l1.4-1.4" />
      <path d="M8 16.5a4 4 0 0 1 8 0" />
      <path d="M2 20.5h20" />
    </>
  ),
  sunset: (
    <>
      <path d="M12 2.5V8M9 5.5l3 3 3-3" />
      <path d="M4.9 9.9 6.3 11.3M2 16.5h2M20 16.5h2M17.7 11.3l1.4-1.4" />
      <path d="M8 16.5a4 4 0 0 1 8 0" />
      <path d="M2 20.5h20" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 13 4 4L19 7" />,
  loader: (
    <path d="M12 3v4M12 17v4M5 12H1M23 12h-4M6.3 6.3 3.9 3.9M20.1 20.1l-2.4-2.4M6.3 17.7l-2.4 2.4M20.1 3.9l-2.4 2.4" />
  ),
  umbrella: (
    <>
      <path d="M12 12.5V19a2.2 2.2 0 0 0 4.4 0" />
      <path d="M2 12.5a10 10 0 0 1 20 0z" />
    </>
  ),
  trend: (
    <>
      <path d="M3 17.5 9.5 11l4 4L21 7.5" />
      <path d="M15 7.5h6v6" />
    </>
  ),
  bolt: <path d="M13 2.5 4 14h7l-1 7.5L20 10h-7z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </>
  ),
  location: (
    <>
      <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  city: (
    <>
      <path d="M3 21V8l6-4v17" />
      <path d="M9 21V11l7 3v7" />
      <path d="M16 21V13l5-2v10" />
      <path d="M6 11h.01M6 15h.01M12.5 16h.01M19 17h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7.5 3v6c0 4.5-3 7.9-7.5 9.5C7.5 19.9 4.5 16.5 4.5 12V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
}

export default function Icon({ name, size, filled = false, className = 'ico', ...rest }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {d}
    </svg>
  )
}

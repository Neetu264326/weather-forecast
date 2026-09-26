/* Full-viewport animated backdrop that reacts to condition + day/night */

const FLAKES = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${((i * 0.73) % 6).toFixed(2)}s`,
  duration: `${(6 + ((i * 1.7) % 6)).toFixed(1)}s`,
  dx: `${((i % 2 === 0 ? 1 : -1) * (10 + ((i * 7) % 30)))}px`,
  size: `${4 + (i % 4) * 2}px`,
}))

const STARS = Array.from({ length: 46 }, (_, i) => ({
  left: `${(i * 53 + 7) % 100}%`,
  top: `${(i * 29 + 3) % 62}%`,
  delay: `${((i * 0.41) % 4).toFixed(2)}s`,
}))

export default function WeatherBackground({ group = 'clear', isDay = true }) {
  let fx = ''
  if (group === 'rain' || group === 'drizzle' || group === 'thunderstorm') fx = 'rain'
  else if (group === 'snow') fx = 'snow'
  else if (group === 'clouds' || group === 'mist') fx = 'clouds'

  return (
    <div className="wx-bg" aria-hidden="true">
      <div className="wx-bg__orb wx-bg__orb--1" />
      <div className="wx-bg__orb wx-bg__orb--2" />

      {!isDay && (
        <div className="wx-bg__stars">
          {STARS.map((s, i) => (
            <i
              key={i}
              style={{
                left: s.left,
                top: s.top,
                animationDelay: s.delay,
                width: i % 5 === 0 ? 3 : 2,
                height: i % 5 === 0 ? 3 : 2,
              }}
            />
          ))}
        </div>
      )}

      {fx === 'rain' && <div className="wx-fx wx-fx--rain" />}

      {fx === 'clouds' && <div className="wx-fx wx-fx--clouds" />}

      {fx === 'snow' && (
        <div className="wx-fx wx-fx--snow">
          {FLAKES.map((f, i) => (
            <i
              key={i}
              style={{
                left: f.left,
                width: f.size,
                height: f.size,
                animationDuration: f.duration,
                animationDelay: f.delay,
                '--dx': f.dx,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

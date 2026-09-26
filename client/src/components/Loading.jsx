/* Skeletons shown while the first payload is in flight — never a blank screen */

export function CardSkeleton({ height = 96 }) {
  return <div className="sk" style={{ height }} aria-hidden="true" />
}

export default function Loading() {
  return (
    <div className="dash" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Fetching weather intelligence…</span>

      <section className="card col-7">
        <div className="sk-hero">
          <div className="sk-col">
            <div className="sk-line" style={{ width: '45%' }} />
            <div className="sk-line" style={{ width: '30%', height: 12 }} />
            <div className="sk-temp" />
            <div className="sk-line" style={{ width: '35%' }} />
            <div className="sk-line" style={{ width: '70%', height: 34, borderRadius: 14 }} />
          </div>
          <div className="sk sk-circle" />
        </div>
      </section>

      <section className="card col-5">
        <div className="sk-line" style={{ width: '55%' }} />
        <div className="sk" style={{ height: 96, marginTop: 14 }} />
        <div className="sk-line" style={{ width: '90%', marginTop: 16 }} />
        <div className="sk-line" style={{ width: '80%', marginTop: 10 }} />
        <div className="sk-line" style={{ width: '70%', marginTop: 10 }} />
      </section>

      <section className="card col-12">
        <div className="sk-line" style={{ width: 180, marginBottom: 16 }} />
        <div className="sk-grid">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </section>

      <section className="card col-12">
        <div className="sk-line" style={{ width: 160, marginBottom: 16 }} />
        <div className="sk-rail">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div className="sk" key={i} />
          ))}
        </div>
      </section>

      <section className="card col-4">
        <div className="sk-line" style={{ width: '60%', marginBottom: 14 }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="sk" key={i} style={{ height: 44, marginBottom: 8 }} />
        ))}
      </section>

      <section className="card col-4">
        <div className="sk-line" style={{ width: '50%', marginBottom: 14 }} />
        <div className="sk" style={{ height: 130 }} />
      </section>

      <section className="card col-4">
        <div className="sk-line" style={{ width: '55%', marginBottom: 14 }} />
        <div className="sk" style={{ height: 130 }} />
      </section>

      <section className="card col-6">
        <div className="sk-line" style={{ width: '45%', marginBottom: 14 }} />
        <div className="sk" style={{ height: 200 }} />
      </section>

      <section className="card col-3">
        <div className="sk-line" style={{ width: '50%', marginBottom: 14 }} />
        <div className="sk" style={{ height: 186, borderRadius: '50%', maxWidth: 186, margin: '0 auto' }} />
      </section>

      <section className="card col-3">
        <div className="sk-line" style={{ width: '60%', marginBottom: 14 }} />
        <div className="sk" style={{ height: 200 }} />
      </section>
    </div>
  )
}

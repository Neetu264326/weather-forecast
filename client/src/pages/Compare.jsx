import CompareCities from '../components/CompareCities'

export default function Compare({ unit }) {
  return (
    <main className="shell page" id="main">
      <header className="page-head reveal">
        <h1>Compare cities</h1>
        <p>
          Put two to four places side by side — temperature, feels-like, humidity, wind and
          pressure. One request to the backend fans out to OpenWeather for every city, so the
          browser only makes a single call.
        </p>
      </header>

      <div className="dash">
        <div className="col-12">
          <CompareCities unit={unit} />
        </div>
      </div>
    </main>
  )
}

import { Link } from 'react-router-dom'
import itmLogo from '../assets/itm-logo.png'

export default function Home() {
  return (
    <section className="walk-landing" aria-label="ITM Navigator home">
      <div className="walk-landing-media" aria-hidden="true">
        <img
          className="walk-landing-photo"
          src="/campus-walk.jpg"
          alt=""
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = '/kirloskar-block.jpg'
          }}
        />
        <div className="walk-landing-shade" />
        <div className="walk-path">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="walk-landing-content">
        <header className="walk-landing-top">
          <div className="walk-landing-logo" aria-label="ITM University Gwalior">
            <img
              className="walk-landing-logo-img"
              src={itmLogo}
              alt="ITM University Gwalior"
              width="160"
              height="60"
            />
          </div>
        </header>

        <div className="walk-landing-main">
          <h1 className="walk-landing-brand">
            ITM
            <br />
            NAVIGATOR
          </h1>
          <p className="walk-landing-tagline">
            Campus pe rasta, <em>live GPS</em> se
          </p>
        </div>

        <div className="walk-landing-cta-wrap">
          <Link to="/map" className="walk-cta">
            Start navigate <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

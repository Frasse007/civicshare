import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal.jsx';

const FLOATERS = ['🪜', '🔧', '🪚', '💦', '🌱', '🎨'];

const STEPS = [
  { icon: '🔎', title: 'Search nearby', text: 'Filter by category, condition, safety rating and availability.' },
  { icon: '📋', title: 'Check the safety sheet', text: 'Every tool lists operating rules and the gear you need.' },
  { icon: '🤝', title: 'Pick up from a neighbor', text: 'Collect from a local pickup station and return it when done.' },
];

const BENEFITS = [
  { stat: '1 in 10', text: 'homes own a pressure washer that is used a few hours a year.' },
  { stat: '$0', text: 'to join. Borrow what you need, share what you do not.' },
  { stat: '60s', text: 'is our goal from search to a complete request.' },
];

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="eyebrow">Neighborhood tool library</p>
          <h1 id="hero-title">
            Borrow the tool. <span className="hero__accent">Skip the garage clutter.</span>
          </h1>
          <p className="hero__lead">
            CivicShare helps neighbors share high-cost, single-use equipment - from pressure washers to tall
            ladders - with safety guides included.
          </p>
          <div className="hero__actions">
            <Link to="/catalog" className="btn btn--primary btn--lg">Browse tools</Link>
            <Link to="/register" className="btn btn--ghost btn--lg">Create a free account</Link>
          </div>
        </div>
        <div className="hero__art" aria-hidden="true">
          {FLOATERS.map((emoji, i) => (
            <span key={emoji} className={`floater floater--${i + 1}`}>{emoji}</span>
          ))}
          <div className="hero__orb" />
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          {[...Array(2)].map((_, copy) => (
            <span key={copy}>Pressure washers • Ladders • Miter saws • Aerators • Hedge trimmers • Floor sanders • Paint sprayers •&nbsp;</span>
          ))}
        </div>
      </div>

      <section className="section" aria-labelledby="how-title">
        <h2 id="how-title">How it works</h2>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 90} className="step">
              <span className="step__icon" aria-hidden="true">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="section section--tint" aria-labelledby="why-title">
        <h2 id="why-title">Why share?</h2>
        <div className="stats">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.stat} delay={i * 90} className="stat">
              <p className="stat__num">{b.stat}</p>
              <p>{b.text}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

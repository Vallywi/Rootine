import { Link } from 'react-router-dom';
import Plant, { PLANTS } from '../components/Plant.jsx';
import GrowingPlant from '../components/GrowingPlant.jsx';
import Reveal from '../components/Reveal.jsx';
import { useGrowLoop } from '../lib/useGrowLoop.js';

const STEPS = [
  { emoji: '🌰', title: 'Pick a seed', text: 'Choose a plant and the task you want to work on.', color: 'butter' },
  { emoji: '⏱️', title: 'Focus for 25 minutes', text: 'Your plant grows while you stay on task. No peeking at your phone!', color: 'sky' },
  { emoji: '🌻', title: 'Watch it bloom', text: 'Finish the session and the plant joins your garden. Give up and it wilts.', color: 'blush' },
];

const FEATURES = [
  { emoji: '🔒', title: 'A timer that keeps time', text: 'Refresh the page or close the tab. Rootine remembers exactly where you were.' },
  { emoji: '📝', title: 'Tasks that grow with you', text: 'Link sessions to tasks and see how many Pomodoros each one took.' },
  { emoji: '🏡', title: 'Your very own garden', text: 'Every finished session becomes a plant. Collect them all and keep your streak going.' },
  { emoji: '🎯', title: 'Daily goals and badges', text: 'Set a goal for the day, watch the ring fill up, and earn little badges.' },
  { emoji: '🌙', title: 'Light and dark', text: 'A sunny meadow by day and a sleepy night garden after dark.' },
  { emoji: '📱', title: 'Works on your phone', text: 'Open it in any browser and install it like an app from Chrome.' },
];

const STAGES = [
  { stage: 'seed', label: 'Seed' },
  { stage: 'sprout', label: 'Sprout' },
  { stage: 'small', label: 'Growing' },
  { stage: 'full', label: 'Bloom!' },
];

export default function Landing() {
  const grow = useGrowLoop();
  return (
    <div className="landing" id="top">
      <a className="skip-link" href="#landing-main">Skip to content</a>
      <header className="landing__nav">
        <Link to="/" className="brand"><span aria-hidden="true">🌿</span> Rootine</Link>
        <nav aria-label="Account" className="row">
          <Link to="/login" className="btn btn--ghost btn--small">Log in</Link>
          <Link to="/register" className="btn btn--small">Get started</Link>
        </nav>
      </header>

      <main id="landing-main" tabIndex={-1}>
        <section className="hero">
          <div className="hero__text">
            <p className="pill">🌱 A cozy Pomodoro timer</p>
            <h1 className="hero__title">Focus a little.<br /><span className="hero__grow">Grow a lot.</span></h1>
            <p className="hero__lead">
              Start a focus session and plant a seed. Stay on task and it grows into a plant for your garden. Rootine makes studying feel a little more like play.
            </p>
            <div className="row row--wrap hero__cta">
              <Link to="/register" className="btn btn--big">Plant your first seed</Link>
              <Link to="/login" className="btn btn--ghost btn--big-ghost">I have an account</Link>
            </div>
            <p className="small muted">Free to use. Works on phones and computers.</p>
          </div>

          <div className="hero__art" aria-hidden="true">
            <div className="hero__scene">
              <div className="hero__plants">
                <GrowingPlant type="sunflower" progress={grow} size={150} title="A sunflower growing" />
                <Plant type="tulip" stage="small" size={120} title="" />
                <Plant type="cactus" stage="full" size={130} title="" />
                <Plant type="sakura" stage="sprout" size={110} title="" />
              </div>
              <span className="hero__bubble hero__bubble--1">{grow < 1 ? `Growing… ${Math.round(grow * 100)}%` : 'Bloom! 🌻'}</span>
              <span className="hero__bubble hero__bubble--2">Keep going! ✨</span>
            </div>
          </div>
        </section>

        <Reveal as="section" className="section" aria-labelledby="how">
          <h2 id="how" className="section__title">How it works</h2>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`card step step--${s.color}`}>
                <span className="step__num" aria-hidden="true">{i + 1}</span>
                <span className="step__emoji" aria-hidden="true">{s.emoji}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal as="section" className="section" aria-labelledby="grow">
          <h2 id="grow" className="section__title">Watch your plant grow</h2>
          <p className="section__lead">Every plant goes through four little stages while you focus.</p>
          <ul className="stages">
            {STAGES.map((s) => (
              <li key={s.stage} className="card stage">
                <Plant type="sunflower" stage={s.stage} size={110} title={`${s.label} stage`} />
                <strong>{s.label}</strong>
              </li>
            ))}
          </ul>
          <p className="center muted">And that is only the start. <a href="#plants">Meet all {Object.keys(PLANTS).length} plants</a>.</p>
        </Reveal>

        <Reveal as="section" className="section" aria-labelledby="plants">
          <h2 id="plants" className="section__title">Meet the plants</h2>
          <p className="section__lead">Nine flowers and plants you can grow any time, plus four trees that grow when you focus for longer.</p>
          <h3 className="plants__group">Flowers and plants</h3>
          <ul className="showcase">
            {Object.values(PLANTS).filter((p) => p.kind === 'plant').map((p, i) => (
              <li key={p.id} className="card showcase__item" style={{ '--i': i }}>
                <Plant type={p.id} stage="full" size={78} title="" />
                <strong>{p.name}</strong>
              </li>
            ))}
          </ul>
          <h3 className="plants__group">Trees <span className="muted">(they take longer to grow)</span></h3>
          <ul className="showcase showcase--trees">
            {Object.values(PLANTS).filter((p) => p.kind === 'tree').map((p, i) => (
              <li key={p.id} className="card showcase__item" style={{ '--i': i }}>
                <Plant type={p.id} stage="full" size={92} title="" />
                <strong>{p.name}</strong>
                <span className="showcase__tag">{p.minMinutes}+ min focus</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="section" aria-labelledby="why">
          <h2 id="why" className="section__title">Everything you need to stay on track</h2>
          <ul className="features">
            {FEATURES.map((f) => (
              <li key={f.title} className="card feature">
                <span className="feature__emoji" aria-hidden="true">{f.emoji}</span>
                <div>
                  <h3>{f.title}</h3>
                  <p className="muted">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className="cta card" aria-labelledby="cta">
          <Plant type="sunflower" stage="full" size={120} title="" />
          <h2 id="cta">Ready to plant your first seed?</h2>
          <p className="muted">Create an account in under a minute and start your garden today.</p>
          <Link to="/register" className="btn btn--big">Create my account</Link>
        </Reveal>
      </main>

      <footer className="landing__footer">
        <div className="footer__card">
          <div className="footer__brand">
            <Link to="/" className="brand"><span aria-hidden="true">🌿</span> Rootine</Link>
            <p className="muted">Focus a little. Grow a lot. A cozy Pomodoro timer that grows a garden while you study.</p>
            <div className="footer__plants" aria-hidden="true">
              <Plant type="sunflower" stage="full" size={48} title="" />
              <Plant type="pine" stage="full" size={52} title="" />
              <Plant type="rose" stage="full" size={48} title="" />
              <Plant type="mushroom" stage="full" size={44} title="" />
            </div>
          </div>
          <nav aria-label="Explore" className="footer__col">
            <h2 className="footer__title">Explore</h2>
            <ul>
              <li><a href="#how">How it works</a></li>
              <li><a href="#grow">Watch it grow</a></li>
              <li><a href="#plants">Meet the plants</a></li>
              <li><a href="#why">Features</a></li>
            </ul>
          </nav>
          <nav aria-label="Get started" className="footer__col">
            <h2 className="footer__title">Get started</h2>
            <ul>
              <li><Link to="/register">Create an account</Link></li>
              <li><Link to="/login">Log in</Link></li>
            </ul>
          </nav>
          <div className="footer__col">
            <h2 className="footer__title">Good to know</h2>
            <ul>
              <li>Free to use</li>
              <li>Works on phones and computers</li>
              <li>Install it from Chrome like an app</li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} Rootine · Made with 🌱 for CS0053</p>
          <a href="#top" className="footer__top">Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}

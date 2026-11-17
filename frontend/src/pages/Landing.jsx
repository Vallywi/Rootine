import { Link } from 'react-router-dom';
import Plant, { PLANTS } from '../components/Plant.jsx';

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
  return (
    <div className="landing">
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
                <Plant type="sunflower" stage="full" size={150} title="" />
                <Plant type="tulip" stage="small" size={120} title="" />
                <Plant type="cactus" stage="full" size={130} title="" />
                <Plant type="sakura" stage="sprout" size={110} title="" />
              </div>
              <span className="hero__bubble hero__bubble--1">25:00 🍅</span>
              <span className="hero__bubble hero__bubble--2">Keep going! ✨</span>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="how">
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
        </section>

        <section className="section" aria-labelledby="grow">
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
          <p className="center muted">Choose from {Object.values(PLANTS).map((p) => p.name).join(', ')}.</p>
        </section>

        <section className="section" aria-labelledby="why">
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
        </section>

        <section className="cta card" aria-labelledby="cta">
          <Plant type="sunflower" stage="full" size={120} title="" />
          <h2 id="cta">Ready to plant your first seed?</h2>
          <p className="muted">Create an account in under a minute and start your garden today.</p>
          <Link to="/register" className="btn btn--big">Create my account</Link>
        </section>
      </main>

      <footer className="landing__footer">
        <p>Made with 🌱 for CS0053.</p>
      </footer>
    </div>
  );
}

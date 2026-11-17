// Badges grouped by theme. Each one shows its picture, name, what it needs, and how far along you are.
export default function Badges({ badges }) {
  const groups = [];
  for (const b of badges) {
    let g = groups.find((x) => x.name === b.group);
    if (!g) { g = { name: b.group, items: [] }; groups.push(g); }
    g.items.push(b);
  }
  const earned = badges.filter((b) => b.earned).length;
  return (
    <section aria-labelledby="badges-title" className="stack stack--tight">
      <div className="row row--between row--wrap">
        <h2 id="badges-title">Badges</h2>
        <p className="muted small" role="status">{earned} of {badges.length} earned</p>
      </div>
      {groups.map((g) => (
        <div key={g.name} className="bdg-group">
          <h3 className="bdg-group__title">{g.name}</h3>
          <ul className="bdg-list">
            {g.items.map((b) => (
              <li key={b.id} className={`bdg ${b.earned ? 'is-earned' : 'is-locked'}`}>
                <span className="bdg__icon" aria-hidden="true">{b.icon}</span>
                <strong className="bdg__name">{b.name}</strong>
                <span className="bdg__hint">{b.hint}</span>
                {b.earned ? (
                  <span className="bdg__status">Earned</span>
                ) : (
                  <>
                    <progress className="bdg__bar" max={b.target} value={b.progress} aria-label={`${b.name}: ${b.progress} of ${b.target}`} />
                    <span className="bdg__status">{b.progress} of {b.target}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

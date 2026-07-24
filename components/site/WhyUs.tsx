const ITEMS = [
  {
    title: 'Certified Experts',
    body: 'International certification with over 10+ years of luxury detailing expertise.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <path d="M9 12.5 7.5 21l4.5-2.5L16.5 21 15 12.5" />
      </svg>
    ),
  },
  {
    title: 'Premium Materials',
    body: 'Exclusively using imported films and coatings from USA and Germany.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 13 9 5 9-5" />
      </svg>
    ),
  },
  {
    title: 'Dust-Controlled Studio',
    body: 'Every film and coating is applied in a sealed, dust-free installation bay.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a4 4 0 0 1 8 0v2" />
        <path d="M3 12h18" />
      </svg>
    ),
  },
  {
    title: 'Written Warranty',
    body: 'Every installation is backed by a written, transferable product warranty.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c3 2 6 3 8 3 0 9-4 13-8 15-4-2-8-6-8-15 2 0 5-1 8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

export default function WhyUs() {
  return (
    <section id="why" className="site-section">
      <div className="eyebrow reveal" style={{ justifyContent: 'center' }}>
        The Standard
      </div>
      <h2 className="reveal r1">Why Z Lab Design?</h2>
      <div className="why-grid">
        {ITEMS.map((item, i) => (
          <div className={`why-item reveal r${i}`} key={item.title}>
            <div className="why-ico">{item.icon}</div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

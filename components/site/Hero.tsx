export default function Hero({
  eyebrow,
  heading,
  sub,
}: {
  eyebrow: string;
  heading: string;
  sub: string;
}) {
  const words = heading.split(' ');
  // Matches the prototype's 3-line stagger: "Luxury" / "Protection" / "For Machines"
  const lines =
    words.length >= 3
      ? [words[0], words[1], words.slice(2).join(' ')]
      : [heading];

  return (
    <section id="hero" className="site-section">
      <div className="hero-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1747229521023-5f89d2749fa3?auto=format&fit=crop&w=1800&q=80"
          alt="Luxury car in studio light"
          loading="eager"
        />
      </div>
      <div className="hero-inner">
        <div className="eyebrow" style={{ justifyContent: 'center' }}>
          {eyebrow}
        </div>
        <h1>
          {lines.map((line, i) => (
            <span className="hl" key={i}>
              <span>{line}</span>
            </span>
          ))}
        </h1>
        <p className="hero-sub">{sub}</p>
        <div className="hero-cta">
          <a className="btn solid hoverable" href="#services">
            Explore Services
          </a>
          <a className="btn ghost hoverable" href="#contact">
            Get a Quote
          </a>
        </div>
      </div>
      <div className="scrollcue">
        <span />
        Scroll
      </div>
    </section>
  );
}

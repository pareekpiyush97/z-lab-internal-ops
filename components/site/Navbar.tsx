'use client';

import { useEffect, useState } from 'react';

const LINKS = [
  { href: '#services', label: 'Services', spy: 'services' },
  { href: '#gallery', label: 'Gallery', spy: 'gallery' },
  { href: '#why', label: 'Why Us', spy: 'why' },
  { href: '#contact', label: 'Contact', spy: 'contact' },
];

export default function Navbar({ phoneDisplay, phoneE164 }: { phoneDisplay: string; phoneE164: string }) {
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.spy)).filter(
      (el): el is HTMLElement => !!el
    );
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { threshold: 0.4 }
    );
    sections.forEach((s) => spy.observe(s));
    return () => spy.disconnect();
  }, []);

  return (
    <nav className="topbar">
      <a className="brand hoverable" href="#hero">
        <span className="mark">Z</span>
        <span className="wordmark">Lab Design</span>
      </a>
      <div className="navlinks">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className={`hoverable ${active === l.spy ? 'active' : ''}`}>
            {l.label}
          </a>
        ))}
      </div>
      <div className="nav-right">
        <a className="nav-phone hoverable" href={`tel:+${phoneE164}`}>
          {phoneDisplay}
        </a>
        <a className="btn solid hoverable" href="#contact">
          Book Now
        </a>
      </div>
    </nav>
  );
}

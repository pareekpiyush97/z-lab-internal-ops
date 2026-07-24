'use client';

import { useEffect, useRef } from 'react';

/**
 * Page-wide cosmetic effects that don't belong to any one section:
 * the lerp-smoothed custom cursor, the film-grain overlay, the scroll
 * progress bar, hero parallax, and the reveal-on-scroll IntersectionObserver
 * that watches every `.reveal` element on the page. Ported 1:1 from the
 * original prototype's inline <script>.
 */
export default function SiteChrome() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let mx = 0,
      my = 0,
      cx = 0,
      cy = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener('mousemove', onMove);

    const loop = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Delegated hover detection instead of attaching a listener per element
    // -- works for any .hoverable element mounted by any section, including
    // ones that appear/disappear (like the service modal).
    const HOVER_SELECTOR = '.hoverable, a, .g-item, .svc-card, input, button, textarea';
    const onOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest?.(HOVER_SELECTOR)) cursor.classList.add('big');
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest?.(HOVER_SELECTOR)) cursor.classList.remove('big');
    };
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    // Reveal-on-scroll: watch every .reveal element currently in the DOM.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('in');
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    // Scroll progress bar + hero parallax + fast-scroll catch-up reveal.
    const progressEl = document.getElementById('scrollProgress');
    const heroBg = document.querySelector<HTMLElement>('.hero-bg');
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressEl) progressEl.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
      if (heroBg && window.scrollY < window.innerHeight) {
        heroBg.style.transform = `translate3d(0,${window.scrollY * 0.25}px,0)`;
      }
      document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
        if (el.getBoundingClientRect().bottom < 0) el.classList.add('in');
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <>
      <div className="cursor" id="cursor" ref={cursorRef} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="progress" id="scrollProgress" aria-hidden="true" />
    </>
  );
}

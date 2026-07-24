import type { GalleryItem } from '@/lib/types';

export default function Gallery({ items }: { items: GalleryItem[] }) {
  return (
    <section id="gallery" className="site-section">
      <div className="eyebrow reveal">Selected Work</div>
      <h2 className="reveal r1">Gallery</h2>
      <div className="gallery-grid">
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`g-item hoverable reveal ${item.wide ? 'wide' : ''}`}
            style={{ transitionDelay: `${(i % 4) * 0.08}s` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.caption} loading="lazy" />
            <span className="g-corner tl" />
            <span className="g-corner tr" />
            <span className="g-corner bl" />
            <span className="g-corner br" />
            <div className="g-cap">{item.caption}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

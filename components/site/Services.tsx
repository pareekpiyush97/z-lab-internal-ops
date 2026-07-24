'use client';

import { useState } from 'react';
import type { Service } from '@/lib/types';
import ServiceModal from './ServiceModal';

export default function Services({ services, phoneE164 }: { services: Service[]; phoneE164: string }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const selected = services.find((s) => s.key === openKey) ?? null;

  return (
    <section id="services" className="site-section">
      <div className="eyebrow reveal">Expertise</div>
      <h2 className="reveal r1">Signature Services</h2>
      <div className="svc-grid">
        {services.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`svc-card reveal hoverable r${i % 3}`}
            onClick={() => setOpenKey(s.key)}
          >
            <div className="svc-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.imageUrl} alt={s.title} loading="lazy" />
            </div>
            <div className="svc-body">
              <h3>{s.title}</h3>
              <p>{s.tagline}</p>
              <span className="svc-link">
                Explore Details <span aria-hidden="true">→</span>
              </span>
            </div>
          </button>
        ))}
      </div>
      <ServiceModal service={selected} phoneE164={phoneE164} onClose={() => setOpenKey(null)} />
    </section>
  );
}

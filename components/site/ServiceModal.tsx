'use client';

import { useEffect } from 'react';
import type { Service } from '@/lib/types';

function waLink(phoneE164: string, message: string): string {
  const digits = phoneE164.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function ServiceModal({
  service,
  phoneE164,
  onClose,
}: {
  service: Service | null;
  phoneE164: string;
  onClose: () => void;
}) {
  const open = !!service;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={`modal-overlay ${open ? 'open' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-hidden={!open}
    >
      {service && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle">
          <button className="modal-close hoverable" aria-label="Close" onClick={onClose}>
            ✕
          </button>
          <div className="modal-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={service.imageUrl} alt={service.title} />
            <div className="m-stats">
              <div className="m-stat">
                <small>Duration</small>
                <b>{service.duration}</b>
              </div>
              <div className="m-stat">
                <small>Warranty</small>
                <b>{service.warranty}</b>
              </div>
            </div>
          </div>
          <div className="modal-right">
            <h3 id="mTitle">{service.title}</h3>
            <p className="m-desc">{service.description}</p>
            <div className="m-label">The Process</div>
            <ul className="m-process">
              {service.process.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
            <div className="m-label">Key Benefits</div>
            <div className="m-pills">
              {service.benefits.map((b, i) => (
                <span key={i}>{b}</span>
              ))}
            </div>
            <a
              className="btn solid m-book hoverable"
              href={waLink(phoneE164, `Hi Z Lab Design, I'd like to book ${service.title}.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book This Service
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

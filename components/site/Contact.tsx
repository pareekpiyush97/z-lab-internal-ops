'use client';

import { useState } from 'react';

function waLink(phoneE164: string, message: string): string {
  const digits = phoneE164.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function Contact({
  addressLine,
  phoneDisplay,
  phoneE164,
}: {
  addressLine: string;
  phoneDisplay: string;
  phoneE164: string;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error' | 'success'>('idle');
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (!/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) {
      setError('Please enter a valid phone number.');
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Something went wrong. Please try again.');
      }
      setStatus('success');
    } catch (err) {
      // Even if we couldn't save the lead server-side, don't block the
      // customer from reaching the studio on WhatsApp -- just surface it.
      setError(err instanceof Error ? err.message : 'Could not reach the server, opening WhatsApp anyway.');
      setStatus('error');
    }

    const msg = `Hi Z Lab Design, I'd like an instant quote.\nName: ${name}\nPhone: ${phone}`;
    window.open(waLink(phoneE164, msg), '_blank', 'noopener');
  };

  return (
    <section id="contact" className="site-section">
      <div className="contact-grid">
        <div>
          <div className="eyebrow reveal">Book Your Slot</div>
          <h2 className="reveal r1">
            Visit the
            <br />
            Laboratory
          </h2>
          <div className="c-rows reveal r2">
            <div className="c-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <p>{addressLine}</p>
            </div>
            <div className="c-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2Z" />
              </svg>
              <a className="tel hoverable" href={`tel:+${phoneE164}`}>
                {phoneDisplay}
              </a>
            </div>
          </div>
        </div>
        <div className="quote-card reveal r2">
          <h3>Get an Instant Quote</h3>
          <form onSubmit={onSubmit} noValidate>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-label="Your name"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              aria-label="Your phone number"
            />
            {error && <p className="form-error">{error}</p>}
            {status === 'success' && <p className="form-success">Thanks — opening WhatsApp to confirm your slot.</p>}
            <button type="submit" className="btn cyan hoverable" style={{ justifyContent: 'center' }} disabled={status === 'submitting'}>
              <svg viewBox="0 0 32 32" style={{ width: 16, height: 16, fill: 'currentColor' }} aria-hidden="true">
                <path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.5c1.2.5 2.5.8 3.8.8 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.2 0-2.4-.3-3.5-.8l-.6-.3-4.9.9 1-4.7-.4-.6c-.9-1.5-1.4-3.2-1.4-4.9 0-5.4 4.4-9.8 9.8-9.8s9.8 4.4 9.8 9.8-4.4 9.4-9.8 9.4zm5.4-7.1c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.4-1.5-.9-.8-1.5-1.8-1.6-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
              </svg>
              {status === 'submitting' ? 'Sending…' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

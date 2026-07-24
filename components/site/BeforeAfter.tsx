'use client';

import { useRef, useState } from 'react';

export default function BeforeAfter({
  beforeImageUrl,
  afterImageUrl,
}: {
  beforeImageUrl: string;
  afterImageUrl: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(50);
  const [hinted, setHinted] = useState(false);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = clientX - r.left;
    setPct(Math.max(2, Math.min(98, (x / r.width) * 100)));
  };

  return (
    <div
      ref={wrapRef}
      className="ba-wrap reveal r2"
      id="baWrap"
      onPointerDown={(e) => {
        dragging.current = true;
        setHinted(true);
        move(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) move(e.clientX);
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ba-before" src={beforeImageUrl} alt="Before paint correction" />
      <div className="ba-after-clip" style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterImageUrl} alt="After paint correction" />
      </div>
      <span className="ba-tag before">Before</span>
      <span className="ba-tag after">After</span>
      <div className={`ba-handle ${hinted ? '' : 'hint'}`} style={{ left: `${pct}%` }} />
    </div>
  );
}

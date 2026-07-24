import BeforeAfter from './BeforeAfter';

export default function Transform({
  beforeImageUrl,
  afterImageUrl,
}: {
  beforeImageUrl: string;
  afterImageUrl: string;
}) {
  return (
    <section id="transform" className="site-section">
      <div className="t-copy">
        <div className="eyebrow reveal">The Transformation</div>
        <h2 className="reveal r1">
          Seeing is
          <br />
          Believing
        </h2>
        <p className="reveal r2">
          Drag the slider to see how our Paint Correction and Ceramic Coating revitalizes even the most neglected
          surfaces.
        </p>
      </div>
      <BeforeAfter beforeImageUrl={beforeImageUrl} afterImageUrl={afterImageUrl} />
    </section>
  );
}

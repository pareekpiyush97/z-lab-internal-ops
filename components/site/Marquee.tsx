const ITEMS = ['PPF', 'Ceramic Coating', 'Graphene', 'Detailing', 'Interior Spa', 'Paint Correction'];

export default function Marquee() {
  const row = (
    <>
      {ITEMS.map((item, i) => (
        <span key={i} className={i % 2 === 1 ? 'hi' : ''}>
          {item}
        </span>
      ))}
    </>
  );
  return (
    <div className="marquee">
      <div>
        {row}
        {row}
      </div>
    </div>
  );
}

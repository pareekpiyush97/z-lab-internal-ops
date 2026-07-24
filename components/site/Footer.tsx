export default function Footer({ businessName }: { businessName: string }) {
  const year = new Date().getFullYear();
  return <footer className="foot">© {year} {businessName} | Indirapuram</footer>;
}

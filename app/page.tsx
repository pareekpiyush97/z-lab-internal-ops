import type { Metadata } from 'next';
import { listServices, listGallery, getAllSettings } from '@/lib/repo';
import SiteChrome from '@/components/site/SiteChrome';
import Navbar from '@/components/site/Navbar';
import Hero from '@/components/site/Hero';
import Marquee from '@/components/site/Marquee';
import Services from '@/components/site/Services';
import Transform from '@/components/site/Transform';
import Gallery from '@/components/site/Gallery';
import WhyUs from '@/components/site/WhyUs';
import Contact from '@/components/site/Contact';
import Footer from '@/components/site/Footer';

export const dynamic = 'force-dynamic'; // always reflect the latest admin-edited content

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAllSettings();
  const businessName = settings.businessName || 'Z Lab Design';
  return {
    title: `${businessName} — Luxury Car Detailing Studio, Indirapuram`,
    description:
      settings.heroSub ||
      "World-class PPF, Ceramic Coating, and Graphene finishes for the world's most prestigious vehicles.",
  };
}

const FALLBACK_BEFORE_AFTER = 'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1400&q=80';

export default async function HomePage() {
  const [services, gallery, settings] = await Promise.all([
    listServices({ activeOnly: true }),
    listGallery({ activeOnly: true }),
    getAllSettings(),
  ]);

  const phoneDisplay = settings.phoneDisplay || '099105 03232';
  const phoneE164 = settings.phoneE164 || '919910503232';
  const addressLine =
    settings.addressLine ||
    'Plot No. 335, opposite St. Teresa School, Shakti Khand III, Indirapuram, Ghaziabad, UP 201014';

  return (
    <>
      <SiteChrome />
      <Navbar phoneDisplay={phoneDisplay} phoneE164={phoneE164} />
      <main>
        <Hero
          eyebrow={settings.heroEyebrow || 'Luxury Detailing Laboratory'}
          heading={settings.heroHeading || 'Luxury Protection For Machines'}
          sub={
            settings.heroSub ||
            "World-class PPF, Ceramic Coating, and Graphene finishes for the world's most prestigious vehicles."
          }
        />
        <Marquee />
        <Services services={services} phoneE164={phoneE164} />
        <Transform
          beforeImageUrl={settings.beforeImageUrl || FALLBACK_BEFORE_AFTER}
          afterImageUrl={settings.afterImageUrl || FALLBACK_BEFORE_AFTER}
        />
        <Gallery items={gallery} />
        <WhyUs />
        <Contact addressLine={addressLine} phoneDisplay={phoneDisplay} phoneE164={phoneE164} />
      </main>
      <Footer businessName={settings.businessName || 'Z Lab Design'} />
    </>
  );
}

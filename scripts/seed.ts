import 'dotenv/config';
import bcrypt from 'bcryptjs';
import {
  createService,
  createGalleryItem,
  createAdmin,
  setSetting,
  getAdminByUsername,
  listServices,
  listGallery,
} from '../lib/repo';

// Seeds the exact content from the original Z Lab Design prototype
// (https://pareekpiyush97.github.io/Z-Lab/) so the live system launches
// looking identical to it, then everything becomes editable from
// /admin instead of being hardcoded in the page.

const SERVICES = [
  {
    key: 'ppf',
    title: 'PPF Protection',
    tagline: 'Self-healing protection film for ultimate paint preservation.',
    description:
      "An invisible, self-healing polyurethane shield wrapped over your paintwork — the highest level of protection a finish can get.",
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    duration: '3–5 Days',
    warranty: '10 Years',
    process: [
      'Deep decontamination wash',
      'Panel-by-panel surface prep',
      'Computer pre-cut film application',
      'Edge wrapping & infrared curing',
    ],
    benefits: ['Self-Healing Film', 'Stone-Chip Proof', 'Invisible Finish'],
  },
  {
    key: 'ceramic',
    title: 'Ceramic Coating',
    tagline: '9H/10H nanotechnology for mirror-like gloss and hydrophobicity.',
    description:
      '9H/10H nano-ceramic layers bonded to the paint for mirror gloss, extreme hydrophobicity, and years of effortless washing.',
    imageUrl: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80',
    duration: '2–3 Days',
    warranty: '5 Years',
    process: [
      'Single-stage paint correction',
      'Panel wipe & degrease',
      'Layered 9H ceramic application',
      'Infrared lamp curing',
    ],
    benefits: ['Hydrophobic', 'Mirror Gloss', 'UV Resistant'],
  },
  {
    key: 'graphene',
    title: 'Graphene Coating',
    tagline: 'Advanced heat reduction and superior surface durability.',
    description:
      'Graphene-infused coating that runs cooler, resists water spotting, and outlasts conventional ceramics.',
    imageUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=900&q=80',
    duration: '2–3 Days',
    warranty: '7 Years',
    process: [
      'Surface decontamination',
      'Machine polish preparation',
      'Graphene-infused coat layering',
      '24-hour controlled cure',
    ],
    benefits: ['Heat Dissipation', 'Anti Water-Spot', 'Extreme Slickness'],
  },
  {
    key: 'detailing',
    title: 'Car Detailing',
    tagline: 'Complete restorative care for every inch of your vehicle.',
    description: 'A meticulous top-to-bottom restoration that returns your vehicle to showroom condition.',
    imageUrl: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=900&q=80',
    duration: '1–2 Days',
    warranty: 'Immediate Results',
    process: ['Engine bay cleaning', 'Trunk detailing', 'Chrome restoration', 'Sealant application'],
    benefits: ['Enhanced Resale Value', 'Interior Sanitation', 'Brand New Feel'],
  },
  {
    key: 'interior',
    title: 'Interior Spa',
    tagline: 'Luxury cabin rejuvenation and leather conditioning.',
    description:
      'Luxury cabin rejuvenation — steam extraction, leather conditioning, and trim restoration for a factory-fresh cabin.',
    imageUrl: 'https://images.unsplash.com/photo-1600661653561-629509216228?auto=format&fit=crop&w=900&q=80',
    duration: '1 Day',
    warranty: '6 Months',
    process: ['Steam-clean extraction', 'Leather clean & condition', 'Trim & console restoration', 'Cabin ozone treatment'],
    benefits: ['Allergen Removal', 'Leather Protection', 'Factory-Fresh Cabin'],
  },
  {
    key: 'correction',
    title: 'Paint Correction',
    tagline: 'Eliminating swirls and scratches to restore paint depth.',
    description:
      'Multi-stage machine polishing that eliminates swirls, scratches, and oxidation to restore true paint depth.',
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=900&q=80',
    duration: '1–2 Days',
    warranty: 'Lasting Finish',
    process: ['Paint depth mapping', 'Multi-stage machine polish', 'Swirl & scratch removal', 'Finishing gloss pass'],
    benefits: ['Showroom Depth', 'Swirl-Free', 'Gloss Revival'],
  },
];

const GALLERY = [
  { imageUrl: 'https://images.unsplash.com/photo-1747229521023-5f89d2749fa3?auto=format&fit=crop&w=1400&q=80', caption: 'Full-Body PPF — Coupe', wide: true },
  { imageUrl: 'https://images.unsplash.com/photo-1770834807387-820280f8270b?auto=format&fit=crop&w=1000&q=80', caption: 'Caliper Detail — Red', wide: false },
  { imageUrl: 'https://images.unsplash.com/photo-1760689033990-2462d7ab40d0?auto=format&fit=crop&w=1000&q=80', caption: 'Ceramic Finish — Wet Look', wide: false },
  { imageUrl: 'https://images.unsplash.com/photo-1550955346-32046005d17d?auto=format&fit=crop&w=1000&q=80', caption: 'Interior Spa — Cockpit', wide: false },
  { imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80', caption: 'Paint Correction — Gloss Red', wide: false },
  { imageUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1400&q=80', caption: 'Graphene Coat — Supercar', wide: true },
  { imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80', caption: 'Delivery Day — Dusk', wide: false },
  { imageUrl: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=1000&q=80', caption: 'In the Lab — Machine Polish', wide: false },
  { imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=80', caption: 'Track Spec — Full PPF', wide: false },
  { imageUrl: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1000&q=80', caption: 'Interior Spa — Leather', wide: false },
];

const SETTINGS: Record<string, string> = {
  businessName: 'Z Lab Design',
  addressLine: 'Plot No. 335, opposite St. Teresa School, Shakti Khand III, Indirapuram, Ghaziabad, UP 201014',
  phoneDisplay: '099105 03232',
  phoneE164: '919910503232',
  heroEyebrow: 'Luxury Detailing Laboratory',
  heroHeading: 'Luxury Protection For Machines',
  heroSub: "World-class PPF, Ceramic Coating, and Graphene finishes for the world's most prestigious vehicles.",
};

async function main() {
  const existingServices = await listServices();
  if (existingServices.length === 0) {
    for (let i = 0; i < SERVICES.length; i++) {
      await createService({ ...SERVICES[i], sortOrder: i, isActive: true });
    }
    console.log(`Seeded ${SERVICES.length} services.`);
  } else {
    console.log('Services already present, skipping.');
  }

  const existingGallery = await listGallery();
  if (existingGallery.length === 0) {
    for (let i = 0; i < GALLERY.length; i++) {
      await createGalleryItem({ ...GALLERY[i], sortOrder: i, isActive: true });
    }
    console.log(`Seeded ${GALLERY.length} gallery items.`);
  } else {
    console.log('Gallery already present, skipping.');
  }

  for (const [key, value] of Object.entries(SETTINGS)) {
    await setSetting(key, value);
  }
  console.log('Business settings written.');

  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const existingAdmin = await getAdminByUsername(username);
  if (!existingAdmin) {
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!password || password.length < 8) {
      throw new Error(
        'SEED_ADMIN_PASSWORD is missing or shorter than 8 characters. Set it in .env before seeding.'
      );
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await createAdmin(username, passwordHash);
    console.log(`Seeded admin user "${username}". Log in at /admin/login, then change this password immediately.`);
  } else {
    console.log(`Admin user "${username}" already exists, skipping.`);
  }
}

main()
  .then(() => {
    console.log('Seed complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });

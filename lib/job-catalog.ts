// The shop-floor job service menu -- ported verbatim from the
// z-lab-internal-ops prototype's CATEGORIES constant. Deliberately a fixed
// list (like the original) rather than admin-editable; it's the operational
// checklist staff use when creating/processing a job, distinct from the
// marketing-site "Services" catalog (lib/repo.ts services) shown to
// customers on the public page.

export interface JobCategory {
  label: string;
  icon: 'droplet' | 'shield' | 'layers' | 'sparkle' | 'sliders';
  services: string[];
}

export const JOB_CATEGORIES: JobCategory[] = [
  { label: 'Wash & Clean', icon: 'droplet', services: ['Car Wash', 'Dry Clean'] },
  {
    label: 'Coating',
    icon: 'shield',
    services: [
      'Ceramic Coating – Single Layer',
      'Ceramic Coating – Double Layer',
      'Ceramic Coating – Triple Layer',
      'Graphene Coating – Single Layer',
      'Graphene Coating – Double Layer',
      'Graphene Coating – Triple Layer',
    ],
  },
  { label: 'Protection', icon: 'layers', services: ['PPF 5 years', 'PPF 7 years', 'PPF 10 years', 'PPF 15 years'] },
  { label: 'Detailing', icon: 'sparkle', services: ['Car Detailing', 'Interior Detailing', 'Rubbing & Polishing'] },
  { label: 'Customization', icon: 'sliders', services: ['Custom Interior', 'Bodykits', 'Paint Job'] },
];

export const JOB_SERVICES: string[] = JOB_CATEGORIES.flatMap((c) => c.services);

export const STOCK_CATEGORIES = [
  'Coating Chemicals',
  'PPF & Films',
  'Wash Consumables',
  'Tools & Equipment',
  'Other',
] as const;

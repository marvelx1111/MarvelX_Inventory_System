export type BodyType = 'coupe' | 'sedan' | 'suv' | 'convertible' | 'hypercar';

export interface CarSpec {
  label: string;
  value: string;
}

export interface Car {
  id: string;
  name: string;
  brand: string;
  year: number;
  tagline: string;
  description: string;
  price: number;
  bodyType: BodyType;
  horsepower: number;
  torque: number;
  zeroToSixty: number;
  topSpeed: number;
  transmission: string;
  drivetrain: string;
  color: string;
  accentColor: string;
  featured: boolean;
  specs: CarSpec[];
}

export const cars: Car[] = [
  {
    id: 'aurora-gt',
    name: 'Aurora GT',
    brand: 'MARVELX',
    year: 2026,
    tagline: 'Where dawn meets velocity',
    description:
      'A sculptural grand tourer engineered for those who measure journeys in horizons, not miles. The Aurora GT channels Italian coachbuilding heritage through a carbon-titanium monocoque and a twin-turbo V8 that breathes like thunder.',
    price: 485000,
    bodyType: 'coupe',
    horsepower: 720,
    torque: 627,
    zeroToSixty: 3.1,
    topSpeed: 208,
    transmission: '8-Speed DCT',
    drivetrain: 'RWD',
    color: '#1a1a2e',
    accentColor: '#c9a962',
    featured: true,
    specs: [
      { label: 'Engine', value: '4.0L Twin-Turbo V8' },
      { label: 'Weight', value: '3,240 lbs' },
      { label: 'Aero', value: 'Active rear wing' },
    ],
  },
  {
    id: 'nocturne-s',
    name: 'Nocturne S',
    brand: 'MARVELX',
    year: 2025,
    tagline: 'Silence, then storm',
    description:
      'The Nocturne S is a midnight predator — low, wide, and deliberately understated until the pedal meets metal. Hand-stitched alcantara wraps a cockpit designed around the driver, not the passenger.',
    price: 312000,
    bodyType: 'sedan',
    horsepower: 580,
    torque: 553,
    zeroToSixty: 3.4,
    topSpeed: 195,
    transmission: '8-Speed Auto',
    drivetrain: 'AWD',
    color: '#0d1117',
    accentColor: '#4a6fa5',
    featured: true,
    specs: [
      { label: 'Engine', value: '3.8L Twin-Turbo V6' },
      { label: 'Weight', value: '4,120 lbs' },
      { label: 'Seats', value: '4 + 1' },
    ],
  },
  {
    id: 'eclipse-x',
    name: 'Eclipse X',
    brand: 'MARVELX',
    year: 2026,
    tagline: 'Total eclipse of ordinary',
    description:
      'Born on the track, refined for the boulevard. The Eclipse X wears its aero scars proudly — every vent, every crease, every millimeter of its widened stance serves a singular purpose: unrelenting forward motion.',
    price: 398000,
    bodyType: 'coupe',
    horsepower: 650,
    torque: 590,
    zeroToSixty: 2.9,
    topSpeed: 212,
    transmission: '7-Speed DCT',
    drivetrain: 'RWD',
    color: '#2d1b3d',
    accentColor: '#e85d4c',
    featured: true,
    specs: [
      { label: 'Engine', value: '5.2L Naturally Aspirated V10' },
      { label: 'Weight', value: '3,080 lbs' },
      { label: 'Downforce', value: '340 lbs @ 150mph' },
    ],
  },
  {
    id: 'terra-forte',
    name: 'Terra Forte',
    brand: 'MARVELX',
    year: 2025,
    tagline: 'Command every terrain',
    description:
      'An SUV that refuses to apologize for its ambition. Terra Forte pairs a hand-built interior with a quad-turbocharged powertrain and an adaptive air suspension that reads the road three seconds ahead.',
    price: 275000,
    bodyType: 'suv',
    horsepower: 612,
    torque: 664,
    zeroToSixty: 3.6,
    topSpeed: 180,
    transmission: '8-Speed Auto',
    drivetrain: 'AWD',
    color: '#1c2b1c',
    accentColor: '#8fbc8f',
    featured: true,
    specs: [
      { label: 'Engine', value: '4.4L Quad-Turbo V8' },
      { label: 'Weight', value: '5,450 lbs' },
      { label: 'Tow', value: '7,700 lbs' },
    ],
  },
  {
    id: 'solstice-spyder',
    name: 'Solstice Spyder',
    brand: 'MARVELX',
    year: 2024,
    tagline: 'Open sky, open throttle',
    description:
      'The Solstice Spyder is summer distilled into carbon fiber and leather. Its retractable hardtop vanishes in 14 seconds, revealing a cockpit bathed in golden-hour light and the symphony of a flat-plane crank.',
    price: 228000,
    bodyType: 'convertible',
    horsepower: 503,
    torque: 443,
    zeroToSixty: 3.7,
    topSpeed: 186,
    transmission: '7-Speed DCT',
    drivetrain: 'RWD',
    color: '#3d2b1f',
    accentColor: '#d4a574',
    featured: false,
    specs: [
      { label: 'Engine', value: '3.9L Twin-Turbo V6' },
      { label: 'Weight', value: '3,560 lbs' },
      { label: 'Roof', value: 'Retractable hardtop' },
    ],
  },
  {
    id: 'phantom-veil',
    name: 'Phantom Veil',
    brand: 'MARVELX',
    year: 2026,
    tagline: 'Presence without announcement',
    description:
      'The Phantom Veil moves through city streets like a shadow with purpose. Its electrochromic glass shifts from opaque to transparent at a touch, while a whisper-quiet hybrid powertrain delivers 900 lb-ft of instant torque.',
    price: 542000,
    bodyType: 'sedan',
    horsepower: 697,
    torque: 900,
    zeroToSixty: 2.8,
    topSpeed: 199,
    transmission: 'Single-Speed + 4-Motor',
    drivetrain: 'AWD',
    color: '#141414',
    accentColor: '#b8b8b8',
    featured: false,
    specs: [
      { label: 'Powertrain', value: 'Hybrid V8 + 4 Electric Motors' },
      { label: 'Weight', value: '4,890 lbs' },
      { label: 'Range', value: '42 mi electric' },
    ],
  },
  {
    id: 'apex-prima',
    name: 'Apex Prima',
    brand: 'MARVELX',
    year: 2025,
    tagline: 'The apex of everything',
    description:
      'Limited to 99 units worldwide, the Apex Prima is MARVELX\'s answer to the hypercar establishment. A carbon-ceramic chassis, active ground-effect aero, and a power-to-weight ratio that defies physics.',
    price: 2100000,
    bodyType: 'hypercar',
    horsepower: 1180,
    torque: 811,
    zeroToSixty: 2.3,
    topSpeed: 245,
    transmission: '7-Speed Sequential',
    drivetrain: 'RWD',
    color: '#0a0a0a',
    accentColor: '#ff2d2d',
    featured: false,
    specs: [
      { label: 'Engine', value: '6.5L Naturally Aspirated V12' },
      { label: 'Weight', value: '2,976 lbs' },
      { label: 'Production', value: '99 units' },
    ],
  },
  {
    id: 'meridian-rs',
    name: 'Meridian RS',
    brand: 'MARVELX',
    year: 2024,
    tagline: 'Precision is the luxury',
    description:
      'The Meridian RS is for drivers who find poetry in a perfectly executed heel-toe downshift. A naturally aspirated flat-six sings behind you while magnesium wheels and ceramic brakes keep every gram accountable.',
    price: 189000,
    bodyType: 'coupe',
    horsepower: 450,
    torque: 346,
    zeroToSixty: 3.9,
    topSpeed: 182,
    transmission: '6-Speed Manual',
    drivetrain: 'RWD',
    color: '#1e3a5f',
    accentColor: '#5b9bd5',
    featured: false,
    specs: [
      { label: 'Engine', value: '4.0L Flat-Six' },
      { label: 'Weight', value: '3,020 lbs' },
      { label: 'Chassis', value: 'Magnesium subframe' },
    ],
  },
  {
    id: 'obsidian-lx',
    name: 'Obsidian LX',
    brand: 'MARVELX',
    year: 2025,
    tagline: 'Forged in darkness',
    description:
      'Volcanic black paint infused with nano-ceramic particles catches light like obsidian glass. The LX variant adds a sport exhaust, lowered suspension, and a steering wheel pulled straight from our GT3 program.',
    price: 356000,
    bodyType: 'suv',
    horsepower: 567,
    torque: 590,
    zeroToSixty: 3.5,
    topSpeed: 174,
    transmission: '8-Speed Auto',
    drivetrain: 'AWD',
    color: '#0f0f0f',
    accentColor: '#6b6b6b',
    featured: false,
    specs: [
      { label: 'Engine', value: '4.0L Twin-Turbo V8' },
      { label: 'Weight', value: '5,200 lbs' },
      { label: 'Finish', value: 'Nano-ceramic obsidian' },
    ],
  },
  {
    id: 'cascade-gts',
    name: 'Cascade GTS',
    brand: 'MARVELX',
    year: 2026,
    tagline: 'Flow state, forever',
    description:
      'Named for the way light cascades across its fluid body lines at speed. The GTS bridges grand touring comfort with track-day capability — adaptive dampers, rear-wheel steering, and a sound system tuned by a Grammy-winning engineer.',
    price: 421000,
    bodyType: 'convertible',
    horsepower: 612,
    torque: 553,
    zeroToSixty: 3.2,
    topSpeed: 201,
    transmission: '8-Speed DCT',
    drivetrain: 'AWD',
    color: '#1a2838',
    accentColor: '#7eb8da',
    featured: false,
    specs: [
      { label: 'Engine', value: '4.2L Twin-Turbo V8' },
      { label: 'Weight', value: '3,780 lbs' },
      { label: 'Audio', value: 'Bespoke 18-speaker' },
    ],
  },
];

export const featuredCars = cars.filter((c) => c.featured);

export const bodyTypes: BodyType[] = ['coupe', 'sedan', 'suv', 'convertible', 'hypercar'];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

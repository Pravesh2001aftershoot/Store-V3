// Store catalog as configured by the photographer.
// mode: 'unit' → 1 photo per item (more photos = higher quantity of the same variant)
//       'set'  → N photos per item (e.g. a triptych takes 3)
//       'book' → one item holding a range of photos (albums / books)

const FRAME_COLORS = [
  { id: 'black-oak', label: 'Black Oak', hex: '#1d1d1d', delta: 0 },
  { id: 'natural-oak', label: 'Natural Oak', hex: '#c8a679', delta: 0 },
  { id: 'white-ash', label: 'White Ash', hex: '#efece6', delta: 0 },
  { id: 'walnut', label: 'Walnut', hex: '#5a3a25', delta: 12 },
]

export const categories = [
  {
    id: 'wall-art',
    name: 'Wall Art',
    blurb: 'Framed prints, canvas and metal — made to be lived with.',
    hero: 'p1011',
  },
  {
    id: 'albums',
    name: 'Albums & Books',
    blurb: 'Heirloom albums and layflat books that tell the whole story.',
    hero: 'p1027',
  },
  {
    id: 'prints',
    name: 'Fine Prints',
    blurb: 'Archival papers, printed by hand in small batches.',
    hero: 'p1043',
  },
  {
    id: 'desk-gifts',
    name: 'Desk & Gifts',
    blurb: 'Small keepsakes for shelves, desks and the people you love.',
    hero: 'p64',
  },
]

export const products = [
  {
    id: 'framed-print',
    name: 'Framed Print',
    category: 'wall-art',
    style: 'frame',
    mode: 'unit',
    badge: 'Bestseller',
    allowOrientation: true,
    tagline: 'Solid wood frame, archival print, ready to hang.',
    description:
      'Your photograph printed on archival lustre paper and hand-framed in solid hardwood. Every frame arrives with hanging hardware fitted and a dust-sealed back.',
    details: [
      'Solid FSC-certified hardwood, 1" profile',
      'Archival lustre paper, rated 100+ years',
      'Shatter-resistant acrylic glazing as standard',
      'Ready to hang, hardware included',
    ],
    options: [
      {
        id: 'size',
        label: 'Size',
        type: 'size',
        values: [
          { id: '8x10', label: '8 × 10"', w: 8, h: 10, price: 65 },
          { id: '11x14', label: '11 × 14"', w: 11, h: 14, price: 95 },
          { id: '16x20', label: '16 × 20"', w: 16, h: 20, price: 145 },
          { id: '20x30', label: '20 × 30"', w: 20, h: 30, price: 225 },
        ],
      },
      { id: 'frame', label: 'Frame', type: 'swatch', values: FRAME_COLORS },
      {
        id: 'mat',
        label: 'Mat',
        type: 'segmented',
        values: [
          { id: 'none', label: 'No mat', delta: 0 },
          { id: 'white', label: 'White mat', delta: 15 },
        ],
      },
      {
        id: 'glazing',
        label: 'Glazing',
        type: 'card',
        values: [
          { id: 'acrylic', label: 'Standard acrylic', note: 'Shatter-resistant', delta: 0 },
          { id: 'museum', label: 'Museum glass', note: '99% UV protection, anti-glare', delta: 35 },
        ],
      },
    ],
  },
  {
    id: 'canvas',
    name: 'Gallery Canvas',
    category: 'wall-art',
    style: 'canvas',
    mode: 'unit',
    allowOrientation: true,
    tagline: 'Hand-stretched on solid pine bars.',
    description:
      'Printed on a museum-grade cotton canvas with a soft satin coating, then hand-stretched over kiln-dried pine stretcher bars. No frame needed.',
    details: ['Cotton-poly blend canvas, 400gsm', 'Satin UV-protective coating', 'Kiln-dried pine stretcher bars', 'Arrives ready to hang'],
    options: [
      {
        id: 'size',
        label: 'Size',
        type: 'size',
        values: [
          { id: '12x16', label: '12 × 16"', w: 12, h: 16, price: 85 },
          { id: '16x20', label: '16 × 20"', w: 16, h: 20, price: 115 },
          { id: '24x36', label: '24 × 36"', w: 24, h: 36, price: 185 },
          { id: '30x40', label: '30 × 40"', w: 30, h: 40, price: 245 },
        ],
      },
      {
        id: 'depth',
        label: 'Depth',
        type: 'segmented',
        values: [
          { id: 'gallery', label: '0.75" Gallery', delta: 0 },
          { id: 'thick', label: '1.5" Thick', delta: 25 },
        ],
      },
      {
        id: 'edge',
        label: 'Edge',
        type: 'swatch',
        values: [
          { id: 'mirror', label: 'Mirror', hex: 'linear-gradient(135deg,#9ca3af,#4b5563)', delta: 0 },
          { id: 'white', label: 'White', hex: '#f4f4f5', delta: 0 },
          { id: 'black', label: 'Black', hex: '#18181b', delta: 0 },
        ],
      },
    ],
  },
  {
    id: 'metal',
    name: 'Metal Print',
    category: 'wall-art',
    style: 'metal',
    mode: 'unit',
    badge: 'New',
    allowOrientation: true,
    tagline: 'Infused into aluminium for vivid depth.',
    description:
      'Dye-sublimated directly into a sheet of aluminium for luminous colour and a modern, frameless look. Floats 1/2" off the wall.',
    details: ['1/16" aluminium sheet', 'Dye-sublimation process', 'Waterproof & scratch-resistant', 'Float mount included'],
    options: [
      {
        id: 'size',
        label: 'Size',
        type: 'size',
        values: [
          { id: '8x12', label: '8 × 12"', w: 8, h: 12, price: 70 },
          { id: '12x18', label: '12 × 18"', w: 12, h: 18, price: 110 },
          { id: '20x30', label: '20 × 30"', w: 20, h: 30, price: 195 },
        ],
      },
      {
        id: 'finish',
        label: 'Finish',
        type: 'segmented',
        values: [
          { id: 'gloss', label: 'High gloss', delta: 0 },
          { id: 'satin', label: 'Satin', delta: 0 },
        ],
      },
      {
        id: 'mount',
        label: 'Mount',
        type: 'card',
        values: [
          { id: 'float', label: 'Float mount', note: 'Sits 1/2" off the wall', delta: 0 },
          { id: 'easel', label: 'Easel back', note: 'Stands on a shelf or desk', delta: 10 },
        ],
      },
    ],
  },
  {
    id: 'triptych',
    name: 'Framed Triptych',
    category: 'wall-art',
    style: 'triptych',
    mode: 'set',
    setSize: 3,
    tagline: 'Three moments, one story.',
    description:
      'A set of three matching framed prints designed to hang together. Choose photos in multiples of three — every three photos make one triptych.',
    details: ['Three matching frames', 'Hanging template included', 'Archival lustre paper', 'Choose 3 photos per set'],
    options: [
      {
        id: 'size',
        label: 'Panel size',
        type: 'size',
        values: [
          { id: '8x10', label: '3 × 8 × 10"', w: 8, h: 10, price: 165 },
          { id: '11x14', label: '3 × 11 × 14"', w: 11, h: 14, price: 245 },
          { id: '16x20', label: '3 × 16 × 20"', w: 16, h: 20, price: 365 },
        ],
      },
      { id: 'frame', label: 'Frame', type: 'swatch', values: FRAME_COLORS },
    ],
  },
  {
    id: 'heirloom-album',
    name: 'Heirloom Album',
    category: 'albums',
    style: 'album',
    mode: 'book',
    book: { min: 20, max: 60, perExtra: 4 },
    badge: 'Signature',
    tagline: 'Thick layflat pages bound in linen or leather.',
    description:
      'Our signature album. Thick, rigid layflat pages bound by hand in a cover of your choosing. Includes 20 photos; add up to 60 for a small per-photo fee.',
    details: ['Rigid 1.2mm layflat pages', 'Hand-bound in Italy', 'Includes 20 photos, up to 60', 'Presentation box included'],
    options: [
      {
        id: 'size',
        label: 'Size',
        type: 'size',
        values: [
          { id: '8x8', label: '8 × 8"', w: 8, h: 8, price: 395 },
          { id: '10x10', label: '10 × 10"', w: 10, h: 10, price: 495 },
          { id: '12x12', label: '12 × 12"', w: 12, h: 12, price: 625 },
        ],
      },
      {
        id: 'cover',
        label: 'Cover',
        type: 'swatch',
        values: [
          { id: 'charcoal-linen', label: 'Charcoal Linen', hex: '#3b3b3b', delta: 0 },
          { id: 'sand-linen', label: 'Sand Linen', hex: '#d6ccbb', delta: 0 },
          { id: 'ivory-leather', label: 'Ivory Leather', hex: '#efe8dc', delta: 60 },
          { id: 'black-leather', label: 'Black Leather', hex: '#151515', delta: 60 },
        ],
      },
      {
        id: 'paper',
        label: 'Paper',
        type: 'card',
        values: [
          { id: 'lustre', label: 'Lustre', note: 'Subtle sheen, rich colour', delta: 0 },
          { id: 'matte', label: 'Fine art matte', note: 'Velvet texture, no glare', delta: 40 },
        ],
      },
    ],
  },
  {
    id: 'layflat-book',
    name: 'Layflat Photo Book',
    category: 'albums',
    style: 'photobook',
    mode: 'book',
    book: { min: 20, max: 80, perExtra: 2 },
    tagline: 'A photo-wrapped hardcover for every shelf.',
    description:
      'A lighter, more affordable layflat book with your favourite photo wrapped around the cover. Includes 20 photos; add up to 80.',
    details: ['Photo-wrap hardcover', 'Seamless layflat binding', 'Includes 20 photos, up to 80', 'Great as parent copies'],
    options: [
      {
        id: 'size',
        label: 'Size',
        type: 'size',
        values: [
          { id: '8x8', label: '8 × 8"', w: 8, h: 8, price: 120 },
          { id: '10x10', label: '10 × 10"', w: 10, h: 10, price: 160 },
          { id: '12x12', label: '12 × 12"', w: 12, h: 12, price: 210 },
        ],
      },
      {
        id: 'cover',
        label: 'Cover',
        type: 'segmented',
        values: [
          { id: 'photo', label: 'Photo wrap', delta: 0 },
          { id: 'linen', label: 'Linen', delta: 20 },
        ],
      },
    ],
  },
  {
    id: 'fine-art-print',
    name: 'Fine Art Print',
    category: 'prints',
    style: 'print',
    mode: 'unit',
    allowOrientation: true,
    tagline: 'Archival prints in every size you need.',
    description:
      'Professional prints on the paper of your choice, packed flat between acid-free tissue. Select as many photos as you like — each becomes its own print.',
    details: ['Professional lab printed', 'Acid-free tissue packaging', '1/8" white border optional', 'From 4 × 6" to 16 × 20"'],
    options: [
      {
        id: 'size',
        label: 'Size',
        type: 'size',
        values: [
          { id: '4x6', label: '4 × 6"', w: 4, h: 6, price: 6 },
          { id: '5x7', label: '5 × 7"', w: 5, h: 7, price: 9 },
          { id: '8x10', label: '8 × 10"', w: 8, h: 10, price: 18 },
          { id: '11x14', label: '11 × 14"', w: 11, h: 14, price: 34 },
          { id: '16x20', label: '16 × 20"', w: 16, h: 20, price: 58 },
        ],
      },
      {
        id: 'paper',
        label: 'Paper',
        type: 'card',
        values: [
          { id: 'lustre', label: 'Lustre', note: 'Our everyday favourite', delta: 0 },
          { id: 'matte', label: 'Matte', note: 'Soft, zero glare', delta: 0 },
          { id: 'metallic', label: 'Metallic', note: 'Pearlescent shimmer', delta: 4 },
          { id: 'cotton', label: 'Cotton rag', note: 'Museum fine art', delta: 12 },
        ],
      },
      {
        id: 'border',
        label: 'Border',
        type: 'segmented',
        values: [
          { id: 'none', label: 'Borderless', delta: 0 },
          { id: 'white', label: 'White border', delta: 0 },
        ],
      },
    ],
  },
  {
    id: 'acrylic-block',
    name: 'Acrylic Block',
    category: 'desk-gifts',
    style: 'acrylic',
    mode: 'unit',
    allowOrientation: true,
    tagline: 'A crystal-clear keepsake that stands on its own.',
    description:
      'Your photo face-mounted behind a solid block of polished acrylic. Freestanding, with luminous depth from every angle.',
    details: ['Solid polished acrylic', 'Freestanding — no stand needed', 'Gift boxed', 'Wipes clean'],
    options: [
      {
        id: 'size',
        label: 'Size',
        type: 'size',
        values: [
          { id: '4x6', label: '4 × 6"', w: 4, h: 6, price: 45 },
          { id: '5x7', label: '5 × 7"', w: 5, h: 7, price: 59 },
          { id: '8x10', label: '8 × 10"', w: 8, h: 10, price: 89 },
        ],
      },
      {
        id: 'thickness',
        label: 'Thickness',
        type: 'segmented',
        values: [
          { id: '075', label: '0.75"', delta: 0 },
          { id: '1', label: '1"', delta: 12 },
        ],
      },
    ],
  },
  {
    id: 'desk-frame',
    name: 'Desk Frame',
    category: 'desk-gifts',
    style: 'frame',
    mode: 'unit',
    allowOrientation: true,
    tagline: 'A small wooden frame with an easel back.',
    description: 'A petite solid-wood frame with a fold-out easel, perfect for desks, nightstands and gifting.',
    details: ['Solid hardwood', 'Fold-out easel back', 'Gift boxed', 'Wall hanging tab included'],
    options: [
      {
        id: 'size',
        label: 'Size',
        type: 'size',
        values: [
          { id: '4x6', label: '4 × 6"', w: 4, h: 6, price: 38 },
          { id: '5x7', label: '5 × 7"', w: 5, h: 7, price: 48 },
        ],
      },
      { id: 'frame', label: 'Frame', type: 'swatch', values: FRAME_COLORS },
    ],
  },
]

export const productById = Object.fromEntries(products.map((p) => [p.id, p]))

// Packages: curated bundles at a discounted price.
export const packages = [
  {
    id: 'the-keepsake',
    name: 'The Keepsake',
    tagline: 'A framed favourite and a stack of prints to share.',
    discount: 0.15,
    hero: 'p1043',
    slots: [
      { id: 's1', productId: 'framed-print', qty: 1, variant: { size: '11x14', frame: 'natural-oak' } },
      { id: 's2', productId: 'fine-art-print', qty: 4, variant: { size: '5x7' } },
    ],
  },
  {
    id: 'the-heirloom',
    name: 'The Heirloom',
    tagline: 'Our signature album with wall art to match.',
    discount: 0.22,
    popular: true,
    hero: 'p1027',
    slots: [
      { id: 's1', productId: 'heirloom-album', qty: 1, variant: { size: '10x10' } },
      { id: 's2', productId: 'framed-print', qty: 1, variant: { size: '16x20', mat: 'white' } },
      { id: 's3', productId: 'fine-art-print', qty: 2, variant: { size: '8x10' } },
    ],
  },
  {
    id: 'gallery-wall',
    name: 'Gallery Wall',
    tagline: 'Five pieces, styled to hang together.',
    discount: 0.2,
    hero: 'p1011',
    slots: [
      { id: 's1', productId: 'canvas', qty: 1, variant: { size: '16x20' } },
      { id: 's2', productId: 'framed-print', qty: 2, variant: { size: '11x14' } },
      { id: 's3', productId: 'metal', qty: 2, variant: { size: '8x12' } },
    ],
  },
  {
    id: 'family-share',
    name: 'Family Share',
    tagline: 'A book for the shelf and gifts for the grandparents.',
    discount: 0.18,
    hero: 'p64',
    slots: [
      { id: 's1', productId: 'layflat-book', qty: 1, variant: { size: '8x8' } },
      { id: 's2', productId: 'acrylic-block', qty: 2, variant: { size: '5x7' } },
      { id: 's3', productId: 'fine-art-print', qty: 10, variant: { size: '4x6' } },
    ],
  },
]

export const packageById = Object.fromEntries(packages.map((p) => [p.id, p]))

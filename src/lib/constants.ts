// Room categories
export const CATEGORIES = [
  'Bedroom',
  'Living Room',
  'Kitchen',
  'Dining Room',
  'Bathroom',
  'Home Office',
  'Kids Room',
  'Balcony',
  'Reading Room',
  'Gaming Room',
  'Guest Room',
  'Luxury Hall'
] as const;

// Design styles
export const STYLES = [
  'Scandinavian',
  'Japandi',
  'Minimalist',
  'Luxury Modern',
  'Rustic',
  'Industrial',
  'Contemporary Indian',
  'Futuristic',
  'Smart Home',
  'Eco/Natural',
  'Warm Cozy',
  'Budget Friendly'
] as const;

// Lighting moods
export const LIGHTING_MOODS = [
  'Golden hour sunlight',
  'Rainy evening',
  'Soft daylight',
  'Warm ambient lamp light',
  'Cool luxury lighting',
  'Festival lighting',
  'Candle-lit mood',
  'Monsoon atmosphere'
] as const;

// Camera motions
export const CAMERA_MOTIONS = [
  'cinematic walkthrough',
  'slow dolly-in',
  'subtle pan',
  'floating cinematic camera',
  'corner reveal',
  'room sweep',
  'elegant tracking shot'
] as const;

// Room composition mapping to prevent incoherent generation (e.g. bathroom sink in a bedroom)
export interface RoomItemsMap {
  mandatory: string[];
  optional: string[];
  decor: string[];
}

export const CATEGORY_ITEMS: Record<string, RoomItemsMap> = {
  'Bedroom': {
    mandatory: ['king-size bed', 'luxury wardrobe', 'wooden bed frame'],
    optional: ['walnut bedside tables', 'comfy velvet armchair', 'soft bouclé rug', 'cushioned bed bench', 'minimalist chest of drawers'],
    decor: ['potted fiddle-leaf fig', 'warm bedside lamps', 'abstract oil painting', 'oversized round mirror', 'linen throwing blanket']
  },
  'Living Room': {
    mandatory: ['curved modular sofa', 'minimalist coffee table', 'sleek media console'],
    optional: ['comfy accent lounge chairs', 'floating wall bookshelves', 'marble fireplace', 'slatted wood accent wall', 'woven area rug'],
    decor: ['designer linen cushions', 'tall fiddle-leaf fig plant', 'ceramic sculpture collection', 'modern floor lamp', 'wool throwing blankets']
  },
  'Kitchen': {
    mandatory: ['seamless flat-panel cabinets', 'quartz kitchen island', 'integrated under-cabinet lighting'],
    optional: ['leather counter stools', 'brushed brass faucets', 'built-in double oven', 'exposed wooden floating shelves', 'marble backsplashes'],
    decor: ['aesthetic cutting boards', 'fresh herbal planters', 'minimalist ceramic spice jars', 'brass pendant lighting', 'glass jars with grains']
  },
  'Dining Room': {
    mandatory: ['solid oak dining table', 'ergonomic dining chairs', 'sculptural pendant chandelier'],
    optional: ['modern wooden sideboard', 'built-in wine rack', 'floor-to-ceiling sheer curtains', 'slatted wood room divider'],
    decor: ['artistic ceramic centerpiece vase', 'dramatic canvas wall art', 'ambient warm wall sconces', 'minimalist candle holders', 'dried pampas grass']
  },
  'Bathroom': {
    mandatory: ['freestanding soaking tub', 'floating double vanity', 'frameless backlit mirror'],
    optional: ['walk-in rainfall shower', 'marble tiled walls', 'floating walnut shelving', 'heated towel racks', 'glass partition'],
    decor: ['rolled waffle-weave cotton towels', 'potted eucalyptus branch', 'organic luxury soap dispensers', 'warm hidden LED strip lighting', 'scented candle']
  },
  'Home Office': {
    mandatory: ['solid wood writing desk', 'ergonomic leather desk chair', 'integrated shelving unit'],
    optional: ['cozy reading corner armchair', 'magnetic pinboard', 'adjustable task light', 'noise-cancelling acoustical felt panels', 'wood file organizer'],
    decor: ['small succulent planters', 'inspirational framed print', 'chic ceramic pencil holder', 'geometric desk clock', 'monstera plant in clay pot']
  },
  'Kids Room': {
    mandatory: ['playful loft bed', 'colorful toy storage bins', 'integrated children study desk'],
    optional: ['soft pastel beanbag chair', 'interactive wall blackboard', 'play tent canopy', 'climbing wall grips', 'modular play rug'],
    decor: ['starry night sky projector lamp', 'cute framed animal prints', 'plush organic cotton cushions', 'wooden block sculpture', 'hanging paper cloud mobiles']
  },
  'Balcony': {
    mandatory: ['weatherproof rattan lounge set', 'wooden decking tiles', 'vertical herb garden wall'],
    optional: ['outdoor hanging egg chair', 'small folding teak table', 'warm outdoor string lights', 'waterproof floor cushions', 'canvas privacy screen'],
    decor: ['potted cascading petunias', 'terracotta planters', 'citronella candle in ceramic jar', 'bohemian throw rug', 'solar-powered lanterns']
  },
  'Reading Room': {
    mandatory: ['plush overstuffed chaise lounge', 'floor-to-ceiling built-in bookcases', 'warm high-CRI reading lamp'],
    optional: ['cozy wood fireplace', 'hand-knotted Persian rug', 'sliding library ladder', 'soft leather footrest', 'acoustic wall panels'],
    decor: ['vintage magnifying glass', 'stacked leather-bound classic novels', 'antique globe', 'potted snake plant', 'cup of hot tea on coaster']
  },
  'Gaming Room': {
    mandatory: ['ergonomic racing gaming chair', 'carbon-fiber L-shaped desk', 'dual ultra-wide monitor mount'],
    optional: ['custom addressable RGB LED light strips', 'soundproofing wall tiles', 'next-gen console cabinet', 'lazy-boy beanbag sofa', 'PC tower with custom cooling loop'],
    decor: ['neon game icon wall sign', 'action figure display glass cabinet', 'custom desk mat', 'headset stand with charging base', 'wall-mounted controller holders']
  },
  'Guest Room': {
    mandatory: ['queen-sized platform bed', 'minimalist luggage rack', 'smart wardrobe closets'],
    optional: ['compact working desk with chair', 'accent armchair', 'full-length arched floor mirror', 'bedside floating nightstands'],
    decor: ['freshly folded linen set', 'small vase of white tulips', 'welcome carafe with glasses', 'warm table lamp', 'woven bedside basket']
  },
  'Luxury Hall': {
    mandatory: ['soaring double-height ceilings', 'grand spiral staircase', 'oversized crystal chandelier'],
    optional: ['polished white marble flooring', 'floor-to-ceiling glass windows', 'indoor architectural water fountain', 'massive grand piano', 'slatted timber ceilings'],
    decor: ['monolithic stone sculpture', 'oversized museum-grade art canvas', 'towering indoor olive tree', 'architectural uplighting', 'sunlight streaming patterns']
  }
};

// Style adjectives for visual enrichment
export const STYLE_ADJECTIVES: Record<string, { material: string; details: string; feeling: string }> = {
  'Scandinavian': {
    material: 'light ash wood, clean white plaster, light gray wool textiles, blonde oak',
    details: 'functional minimal furniture, clean organic silhouettes, warm textiles, high efficiency',
    feeling: 'bright, airy, peaceful, functional, hygge'
  },
  'Japandi': {
    material: 'dark walnut, raw textured clay, natural linen, shoji-inspired screens, bamboo, stone',
    details: 'low-profile platform furniture, handcrafted ceramic details, delicate organic branches, wabi-sabi aesthetics',
    feeling: 'zen-like calm, slow-living luxury, deeply mindful, organic harmony'
  },
  'Minimalist': {
    material: 'microcement, brushed stainless steel, matte black metal, white marble, seamless glass',
    details: 'hidden storage, monolithic architectural forms, sharp linear profiles, zero clutter',
    feeling: 'pure, silent, ultra-clean, architectural, spacious'
  },
  'Luxury Modern': {
    material: 'polished calacatta marble, brushed brass accents, rich velvet, dark oak, gold trim',
    details: 'statement custom lighting, double-height spaces, bespoke Italian furniture, floating ceiling details',
    feeling: 'opulent, high-end, premium, elite, sophisticated'
  },
  'Rustic': {
    material: 'reclaimed barn wood, rugged natural stone, wrought iron, thick woven hides, copper',
    details: 'exposed ceiling beams, hand-carved details, stone fireplaces, vintage heirloom pieces',
    feeling: 'warm, historic, grounded, ruggedly cozy, timeless'
  },
  'Industrial': {
    material: 'exposed red brick, distressed concrete, structural steel beams, dark leather, copper pipes',
    details: 'warehouse windows, open floor plan, visible ductwork, repurposed vintage machinery furniture',
    feeling: 'raw, edgy, urban, bold, textured'
  },
  'Contemporary Indian': {
    material: 'polished teak wood, local marble, woven cane, hand-loomed silk and cotton, brass',
    details: 'modernized traditional archways, custom carved wood accents, intricate jali screens, subtle heritage colors',
    feeling: 'culturally rich, sophisticatedly vibrant, earthy yet modern, majestic'
  },
  'Futuristic': {
    material: 'glowing polymethyl methacrylate, carbon fiber, seamless liquid metal, curved fiberglass',
    details: 'biomorphic curved walls, integrated holographic interfaces, smooth organic contours, neon light piping',
    feeling: 'sci-fi, avant-garde, ultra-modern, high-tech, dreamlike'
  },
  'Smart Home': {
    material: 'brushed anodized aluminum, tinted smart glass, corian surfaces, high-gloss composites',
    details: 'voice-activated motorized panels, concealed linear speakers, adaptive interactive display walls, hidden sensor bezels',
    feeling: 'high-tech, convenient, responsive, intelligent, sleek'
  },
  'Eco/Natural': {
    material: 'cork tiles, recycled bamboo flooring, raw hemp, local clay plaster, live-edge wood',
    details: 'integrated indoor green walls, sunlight tubes, solar passive design features, biophilic textures',
    feeling: 'organic, refreshing, earth-friendly, carbon-conscious, vital'
  },
  'Warm Cozy': {
    material: 'thick bouclé yarns, honey oak wood, soft sheepskin, warm terracotta, textured knit blankets',
    details: 'soft rounded corners, layered lighting, fireplace glows, low plush seating, intimate small nooks',
    feeling: 'inviting, protected, deeply relaxing, emotionally safe, comfortable'
  },
  'Budget Friendly': {
    material: 'durable birch plywood, painted MDF, affordable flat-pack steel, jute rugs, canvas cotton',
    details: 'smart multi-functional furniture, creative paint blocks, open storage racks, space-saving layouts',
    feeling: 'youthful, clever, airy, practical, optimistic'
  }
};

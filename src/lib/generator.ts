import { Video } from './types';
import {
  CATEGORIES,
  STYLES,
  LIGHTING_MOODS,
  CAMERA_MOTIONS,
  CATEGORY_ITEMS,
  STYLE_ADJECTIVES
} from './constants';

interface GeneratedConfig {
  category: string;
  style: string;
  lighting: string;
  cameraMotion: string;
  selectedItems: string[];
  prompt: string;
  title: string;
}

// Selects items and generates a beautifully descriptive cinematic prompt and title
export function generateRoomConfig(
  category: typeof CATEGORIES[number],
  style: typeof STYLES[number],
  lighting: typeof LIGHTING_MOODS[number],
  cameraMotion: typeof CAMERA_MOTIONS[number]
): { title: string; prompt: string; selectedItems: string[]; heroItem: string } {
  const itemsMap = CATEGORY_ITEMS[category];
  const styleAdjs = STYLE_ADJECTIVES[style];

  // Pick hero item (first mandatory item)
  const heroItem = itemsMap.mandatory[0];

  // Coherent selection of 10-15 items
  // 1. All mandatory items (2-3)
  const selected: string[] = [...itemsMap.mandatory];

  // 2. Select 4-6 optional items
  const optionalCount = Math.floor(Math.random() * 3) + 4; // 4 to 6
  const shuffledOptional = [...itemsMap.optional].sort(() => 0.5 - Math.random());
  selected.push(...shuffledOptional.slice(0, optionalCount));

  // 3. Select 4-6 decor items
  const decorCount = Math.floor(Math.random() * 3) + 4; // 4 to 6
  const shuffledDecor = [...itemsMap.decor].sort(() => 0.5 - Math.random());
  selected.push(...shuffledDecor.slice(0, decorCount));

  // Ensure unique items and format them
  const uniqueItems = Array.from(new Set(selected));

  // Build high-fidelity cinematic prompt
  // Example: "Luxury Japandi bedroom interior with king-size bed, walnut bedside tables, textured rug, indoor plants, floating shelves, warm sunset lighting, cinematic slow dolly walkthrough, photorealistic architectural visualization, elegant atmosphere, ultra realistic interior render."
  const itemString = uniqueItems.join(', ');
  const prompt = `${style} ${category.toLowerCase()} interior with ${itemString}, ${lighting.toLowerCase()}, ${cameraMotion.toLowerCase()}, photorealistic architectural visualization, curated with ${styleAdjs.material}, evoking a ${styleAdjs.feeling} feeling, elegant atmosphere, ultra realistic interior render.`;

  // Make a premium title
  const title = `Elegant ${style} ${category}`;

  return {
    title,
    prompt,
    selectedItems: uniqueItems,
    heroItem
  };
}

// High-fidelity generation engine with controlled randomness validation rules
export function generateNextRoomConfig(recentVideos: Video[]): GeneratedConfig {
  let attempts = 0;
  const maxAttempts = 100;

  // Extract recent categories, styles, and hero items for constraints
  const recentCategories = recentVideos.slice(0, 8).map(v => v.category);
  const recentStyles = recentVideos.slice(0, 5).map(v => v.style);
  
  // Hero item is assumed to be the first selected item in our database
  const recentHeroItems = recentVideos.slice(0, 10).map(v => v.selectedItems[0]).filter(Boolean);

  while (attempts < maxAttempts) {
    attempts++;

    // 1. Choose random category (constraint: no repeat in last 8)
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    if (recentCategories.includes(category) && CATEGORIES.length > recentCategories.length) {
      continue;
    }

    // 2. Choose random style (constraint: no repeat in last 5)
    const style = STYLES[Math.floor(Math.random() * STYLES.length)];
    if (recentStyles.includes(style) && STYLES.length > recentStyles.length) {
      continue;
    }

    // 3. Choose random lighting & camera motion
    const lighting = LIGHTING_MOODS[Math.floor(Math.random() * LIGHTING_MOODS.length)];
    const cameraMotion = CAMERA_MOTIONS[Math.floor(Math.random() * CAMERA_MOTIONS.length)];

    // 4. Generate room configuration & check hero item constraint (no repeat in last 10)
    const config = generateRoomConfig(category, style, lighting, cameraMotion);
    
    if (recentHeroItems.includes(config.heroItem) && recentHeroItems.length > 0) {
      continue;
    }

    // Found a valid, coherent layout!
    return {
      category,
      style,
      lighting,
      cameraMotion,
      selectedItems: config.selectedItems,
      prompt: config.prompt,
      title: config.title
    };
  }

  // Fallback: If we couldn't find a configuration after 100 attempts (e.g. database size is small or constraint overflow),
  // return a randomized configuration without strict constraints to avoid infinite loops.
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const style = STYLES[Math.floor(Math.random() * STYLES.length)];
  const lighting = LIGHTING_MOODS[Math.floor(Math.random() * LIGHTING_MOODS.length)];
  const cameraMotion = CAMERA_MOTIONS[Math.floor(Math.random() * CAMERA_MOTIONS.length)];
  const config = generateRoomConfig(category, style, lighting, cameraMotion);

  return {
    category,
    style,
    lighting,
    cameraMotion,
    selectedItems: config.selectedItems,
    prompt: config.prompt,
    title: config.title
  };
}

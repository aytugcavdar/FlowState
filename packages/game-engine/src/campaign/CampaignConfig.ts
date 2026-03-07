import { CampaignLevel } from '@flowstate/shared-types';

/**
 * 100 bölümlük kampanya (Saga Map) konfigürasyonu.
 * Bölümler ilerledikçe zorluk ve gridSize progresif olarak artar.
 */
export const CAMPAIGN_LEVELS: CampaignLevel[] = Array.from({ length: 100 }, (_, i) => {
  const levelIndex = i + 1;
  
  // Grid size progression smoothly from 5x5 to 10x10
  let gridSize = 5;
  if (levelIndex > 10) gridSize = 6;
  if (levelIndex > 25) gridSize = 7;
  if (levelIndex > 45) gridSize = 8;
  if (levelIndex > 65) gridSize = 9;
  if (levelIndex > 85) gridSize = 10;
  
  // Difficulty ramps up within each grid size tier
  // e.g., level 1 -> diff 1. level 10 -> diff 5
  const baseDiff = 1;
  const maxDiffForTier = 7 + (gridSize - 5); 
  const progressInTier = (levelIndex % 20) / 20; // reset the ramp every 20 levels roughly
  let difficulty = Math.max(1, Math.min(10, Math.floor(baseDiff + progressInTier * maxDiffForTier)));
  
  // Ensure difficulty strictly scales up at higher levels
  if (levelIndex > 80) difficulty = Math.max(difficulty, 8);
  if (levelIndex >= 95) difficulty = 10;

  let unlockedMechanics: string[] | undefined = undefined;

  // Milestone mechanic unlocks
  if (levelIndex === 1) unlockedMechanics = ['Basic Flow'];
  if (levelIndex === 15) unlockedMechanics = ['Cross Tiles'];
  if (levelIndex === 30) unlockedMechanics = ['Multi-color Mixers', 'Purple Flow'];
  if (levelIndex === 60) unlockedMechanics = ['Orange Flow'];
  if (levelIndex === 85) unlockedMechanics = ['Green Flow'];

  return {
    id: levelIndex,
    gridSize,
    difficulty,
    pointsReward: 50 + (gridSize * 5) + (difficulty * 2),
    unlockedMechanics
  };
});

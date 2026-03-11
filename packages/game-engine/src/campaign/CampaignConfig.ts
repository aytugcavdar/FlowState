import { CampaignLevel } from '@flowstate/shared-types';

/**
 * 100 bölümlük kampanya (Saga Map) konfigürasyonu.
 * Bölümler ilerledikçe zorluk ve gridSize progresif olarak artar.
 */
export const CAMPAIGN_LEVELS: CampaignLevel[] = Array.from({ length: 100 }, (_, i) => {
  const levelIndex = i + 1;
  
  // Grid size progression smoothly from 5x5 to 10x10
  let gridSize = 5;
  if (levelIndex > 8) gridSize = 6;
  if (levelIndex > 18) gridSize = 7;
  if (levelIndex > 35) gridSize = 8;
  if (levelIndex > 55) gridSize = 9;
  if (levelIndex > 75) gridSize = 10;
  
  // Difficulty ramps up more aggressively
  // Start at difficulty 2 (not 1) and scale up faster
  let difficulty = 2;
  
  if (levelIndex <= 10) {
    // Levels 1-10: difficulty 2-4
    difficulty = 2 + Math.floor((levelIndex - 1) / 3);
  } else if (levelIndex <= 25) {
    // Levels 11-25: difficulty 4-6
    difficulty = 4 + Math.floor((levelIndex - 11) / 5);
  } else if (levelIndex <= 50) {
    // Levels 26-50: difficulty 6-8
    difficulty = 6 + Math.floor((levelIndex - 26) / 12);
  } else if (levelIndex <= 75) {
    // Levels 51-75: difficulty 8-9
    difficulty = 8 + Math.floor((levelIndex - 51) / 25);
  } else {
    // Levels 76-100: difficulty 9-10
    difficulty = 9 + Math.floor((levelIndex - 76) / 25);
  }
  
  // Cap at 10
  difficulty = Math.min(10, difficulty);

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

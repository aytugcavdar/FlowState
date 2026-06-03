import type { TileType, CampaignLevel } from '@flowstate/shared-types';

// Her level için allowedTileTypes hesapla
function getAllowedTiles(levelId: number): TileType[] {
  if (levelId <= 15)  return ['SOURCE','SINK','STRAIGHT','ELBOW'];
  if (levelId <= 30)  return ['SOURCE','SINK','STRAIGHT','ELBOW','T_JUNCTION','CROSS'];
  if (levelId <= 45)  return ['SOURCE','SINK','STRAIGHT','ELBOW','T_JUNCTION','CROSS','MIXER'];
  if (levelId <= 60)  return ['SOURCE','SINK','STRAIGHT','ELBOW','T_JUNCTION','CROSS','MIXER','ONE_WAY','FILTER'];
  if (levelId <= 80)  return ['SOURCE','SINK','STRAIGHT','ELBOW','T_JUNCTION','CROSS','MIXER','ONE_WAY','FILTER','SPLITTER'];
  return ['SOURCE','SINK','STRAIGHT','ELBOW','T_JUNCTION','CROSS','MIXER','ONE_WAY','FILTER','SPLITTER','PORTAL'];
}

// Her level için difficulty düzelt (şu an çok yavaş artıyor)
function getDifficulty(id: number): number {
  if (id<=3)  return id;
  if (id<=8)  return 3+Math.floor((id-3)/2);
  if (id<=15) return 5+Math.floor((id-8)/3);
  if (id<=25) return 6+Math.floor((id-15)/3);
  if (id<=40) return 7+Math.floor((id-25)/8);
  if (id<=60) return 8+Math.floor((id-40)/12);
  if (id<=80) return 9;
  return 10;
}

const BOSS = new Set([15,30,45,60,80,100]);

export const CAMPAIGN_LEVELS: CampaignLevel[] = Array.from({ length: 100 }, (_, i) => {
  const levelId = i + 1;
  // gridSize mevcut mantık korunsun ama allowedTileTypes ekle
  let gridSize = 5;
  if (levelId > 8) gridSize = 6;
  if (levelId > 18) gridSize = 7;
  if (levelId > 35) gridSize = 8;
  if (levelId > 55) gridSize = 9;
  if (levelId > 75) gridSize = 10;
  
  const difficulty = getDifficulty(levelId);

  return {
    id: levelId,
    gridSize,
    difficulty,
    pointsReward: (BOSS.has(levelId)?200:50) + (gridSize * 5) + (difficulty * 3),
    allowedTileTypes: getAllowedTiles(levelId),
    isBoss: BOSS.has(levelId)
  };
});

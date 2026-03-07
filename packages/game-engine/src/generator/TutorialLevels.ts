import type { PuzzleDefinition } from '@flowstate/shared-types';

export interface TutorialLevel {
  id: string;
  title: string;
  hint: string;
  definition: PuzzleDefinition;
}

export const TUTORIAL_LEVELS: TutorialLevel[] = [
  {
    id: 'tutorial-1',
    title: 'Temel Akış',
    hint: 'Mavi akışı (Source) hedefe (Sink) ulaştırmak için boruları döndürün.',
    definition: {
      gridSize: 3,
      sources: [{ row: 0, col: 0, color: 'cyan' }],
      sinks: [{ row: 2, col: 2, requiredColors: ['cyan'] }],
      tiles: [
        [
          { type: 'SOURCE', rotation: 0, locked: true }, // Points East
          { type: 'STRAIGHT', rotation: 0 }, // Needs 90 (E-W)
          { type: 'ELBOW', rotation: 0 } // Needs 180 (S-W)
        ],
        [
          { type: 'STRAIGHT', rotation: 90 }, // Filler
          { type: 'ELBOW', rotation: 90 }, // Filler
          { type: 'STRAIGHT', rotation: 90 } // Needs 0 (N-S)
        ],
        [
          { type: 'ELBOW', rotation: 180 }, // Filler
          { type: 'STRAIGHT', rotation: 0 }, // Filler
          { type: 'SINK', rotation: 90, locked: true } // Base W, Needs N, so W+90 = N
        ]
      ]
    }
  },
  {
    id: 'tutorial-2',
    title: 'Renkleri Karıştır',
    hint: 'Mor (Purple) rengi elde etmek için Mavi (Cyan) ve Pembe (Magenta) akışları Mixer borusunda birleştirin.',
    definition: {
      gridSize: 4,
      sources: [
        { row: 0, col: 0, color: 'cyan' },
        { row: 0, col: 3, color: 'magenta' }
      ],
      sinks: [
        { row: 3, col: 2, requiredColors: ['purple'] }
      ],
      tiles: [
        [
          { type: 'SOURCE', rotation: 90, locked: true }, // E+90=S (Points Down)
          { type: 'STRAIGHT', rotation: 0 },
          { type: 'ELBOW', rotation: 90 },
          { type: 'SOURCE', rotation: 90, locked: true } // E+90=S (Points Down)
        ],
        [
          { type: 'ELBOW', rotation: 180 }, // Needs 0 (N-E)
          { type: 'STRAIGHT', rotation: 0 }, // Needs 90 (E-W)
          { type: 'MIXER', rotation: 90 }, // Needs 0 (W,E in -> S out)
          { type: 'ELBOW', rotation: 0 } // Needs 270 (N-W)
        ],
        [
          { type: 'CROSS', rotation: 0 },
          { type: 'ELBOW', rotation: 90 },
          { type: 'STRAIGHT', rotation: 90 }, // Needs 0 (N-S)
          { type: 'ELBOW', rotation: 180 }
        ],
        [
          { type: 'ELBOW', rotation: 270 },
          { type: 'STRAIGHT', rotation: 0 },
          { type: 'SINK', rotation: 90, locked: true }, // Needs N (rotation 90)
          { type: 'ELBOW', rotation: 90 }
        ]
      ]
    }
  },
  {
    id: 'tutorial-3',
    title: 'Uzay Zamanda Sıçrama',
    hint: 'Sarı akışı yarıktan atlatmak için iki Portalı borularla birbirine bağlayın.',
    definition: {
        gridSize: 4,
        sources: [{ row: 0, col: 0, color: 'yellow' }],
        sinks: [{ row: 2, col: 3, requiredColors: ['yellow'] }],
        tiles: [
            [
                { type: 'SOURCE', rotation: 0, locked: true }, // Points East
                { type: 'STRAIGHT', rotation: 0 }, // Needs 90
                { type: 'ELBOW', rotation: 90 }, // Needs 180 (S-W)
                { type: 'STRAIGHT', rotation: 0 }
            ],
            [
                { type: 'ELBOW', rotation: 90 },
                { type: 'ELBOW', rotation: 0 },
                { type: 'PORTAL', rotation: 90, portalId: 1 },
                { type: 'ELBOW', rotation: 180 }
            ],
            [
                { type: 'STRAIGHT', rotation: 0 },
                { type: 'PORTAL', rotation: 180, portalId: 1 },
                { type: 'STRAIGHT', rotation: 0 }, // Needs 90 (E-W)
                { type: 'SINK', rotation: 0, locked: true } // Base W, Needs W, so 0
            ],
            [
                { type: 'ELBOW', rotation: 0 },
                { type: 'STRAIGHT', rotation: 90 },
                { type: 'ELBOW', rotation: 270 },
                { type: 'CROSS', rotation: 0 }
            ]
        ]
    }
  }
];

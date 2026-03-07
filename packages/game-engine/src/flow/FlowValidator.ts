// ============================================================
// FlowValidator — Kazanma koşulu kontrolü
// Tüm sink'ler gerekli renkleri alıyorsa puzzle çözülmüş sayılır.
// ============================================================

import type { FlowColor } from '@flowstate/shared-types';
import { Board } from '../board/Board';
import { FlowCalculator } from './FlowCalculator';
import type { FlowResult } from './FlowCalculator';

/** Tek bir sink'in durumu */
export interface SinkStatus {
  position: string;          // "satır,sütun"
  requiredColors: FlowColor[];
  receivedColors: FlowColor[];
  satisfied: boolean;
}

/** Doğrulama sonucu */
export interface ValidationResult {
  /** Puzzle çözüldü mü? */
  solved: boolean;
  /** Her sink'in ayrı durumu */
  sinkStatuses: SinkStatus[];
  /** Kaç sink tatmin oldu */
  satisfiedCount: number;
  /** Toplam sink sayısı */
  totalSinks: number;
}

/**
 * Kazanma koşulu doğrulayıcı.
 *
 * Kural: TÜM sink tile'ları, gerektirdiği TÜM renkleri eş zamanlı
 * olarak aldığında puzzle çözülmüş sayılır.
 */
export class FlowValidator {
  /**
   * Board'un kazanma koşulunu kontrol eder.
   * Önce FlowCalculator ile akışları hesaplar, sonra sink'leri doğrular.
   */
  static checkWin(board: Board, flowResult?: FlowResult): ValidationResult {
    // Akış henüz hesaplanmadıysa hesapla
    const flows = flowResult ?? FlowCalculator.calculate(board);
    const sinks = board.getSinks();
    const sinkStatuses: SinkStatus[] = [];
    let satisfiedCount = 0;

    for (const sink of sinks) {
      const key = `${sink.pos.row},${sink.pos.col}`;
      const tileFlow = flows.tileFlows.get(key);
      const receivedColors = tileFlow?.colors ?? [];

      // Gerekli tüm renkler alındı mı?
      const satisfied = sink.requiredColors.every(
        reqColor => receivedColors.includes(reqColor)
      );

      if (satisfied) satisfiedCount++;

      sinkStatuses.push({
        position: key,
        requiredColors: sink.requiredColors,
        receivedColors: [...receivedColors],
        satisfied,
      });
    }

    return {
      solved: sinks.length > 0 && satisfiedCount === sinks.length,
      sinkStatuses,
      satisfiedCount,
      totalSinks: sinks.length,
    };
  }
}

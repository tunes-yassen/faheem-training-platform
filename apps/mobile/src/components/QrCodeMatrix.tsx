import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/theme';

interface QrCodeMatrixProps {
  value: string;
  size?: number;
}

const GRID = 15;

/**
 * Deterministic visual QR-style matrix generated from a certificate serial code.
 * Renders crisp finder patterns + hashed data modules with zero native SVG dependencies.
 */
export function QrCodeMatrix({ value, size = 150 }: QrCodeMatrixProps) {
  const matrix = useMemo(() => {
    let seed = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      seed ^= value.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }

    const isFinder = (r: number, c: number) => {
      const inTopLeft = r < 5 && c < 5;
      const inTopRight = r < 5 && c >= GRID - 5;
      const inBottomLeft = r >= GRID - 5 && c < 5;
      if (!inTopLeft && !inTopRight && !inBottomLeft) return null;

      const lr = r >= GRID - 5 ? r - (GRID - 5) : r;
      const lc = c >= GRID - 5 ? c - (GRID - 5) : c;
      if (lr === 0 || lr === 4 || lc === 0 || lc === 4) return true;
      if (lr === 2 && lc === 2) return true;
      return false;
    };

    const rows: boolean[][] = [];
    for (let r = 0; r < GRID; r += 1) {
      const row: boolean[] = [];
      for (let c = 0; c < GRID; c += 1) {
        const finder = isFinder(r, c);
        if (finder !== null) {
          row.push(finder);
        } else {
          seed = Math.imul(seed ^ (r * 31 + c * 17), 1664525) + 1013904223;
          row.push(((seed >>> 24) & 1) === 1);
        }
      }
      rows.push(row);
    }
    return rows;
  }, [value]);

  const cellSize = Math.floor((size - 20) / GRID);

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <View>
        {matrix.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((filled, cIdx) => (
              <View
                key={cIdx}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: filled ? colors.textPrimary : colors.surface,
                  borderRadius: filled ? 1.5 : 0,
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  row: {
    flexDirection: 'row',
  },
});

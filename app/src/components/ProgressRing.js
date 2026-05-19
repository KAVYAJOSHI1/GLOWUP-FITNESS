import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, FONTS } from '../theme';

/**
 * ProgressRing — pure React Native (no SVG dependency).
 * Uses two half-circle rotations to simulate an arc.
 */
const ProgressRing = ({
  progress = 0,
  total = 1,
  size = 120,
  strokeWidth = 11,
  color = COLORS.violet,
  label,
}) => {
  const pct = total > 0 ? Math.min(progress / total, 1) : 0;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const percent = Math.round(pct * 100);
  const outerRadius = size / 2;
  const innerRadius = outerRadius - strokeWidth;

  // Rotation for left half (0-50%) and right half (50-100%)
  const leftRotation = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg'],
  });
  const rightRotation = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '0deg', '180deg'],
  });

  const halfStyle = {
    width: outerRadius,
    height: size,
    overflow: 'hidden',
    position: 'absolute',
  };

  const arcStyle = {
    width: size,
    height: size,
    borderRadius: outerRadius,
    borderWidth: strokeWidth,
    borderColor: color,
    position: 'absolute',
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background track */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: outerRadius,
          borderWidth: strokeWidth,
          borderColor: 'rgba(255,255,255,0.07)',
          position: 'absolute',
        }}
      />

      {/* Right half (first 50%) */}
      <View style={[halfStyle, { right: 0 }]}>
        <Animated.View
          style={[
            arcStyle,
            {
              borderLeftColor: 'transparent',
              borderBottomColor: 'transparent',
              transform: [{ rotate: rightRotation }],
            },
          ]}
        />
      </View>

      {/* Left half (50–100%) */}
      <View style={[halfStyle, { left: 0 }]}>
        <Animated.View
          style={[
            arcStyle,
            {
              borderRightColor: pct > 0.5 ? color : 'transparent',
              borderTopColor: pct > 0.5 ? color : 'transparent',
              borderLeftColor: 'transparent',
              borderBottomColor: 'transparent',
              transform: [{ rotate: leftRotation }],
            },
          ]}
        />
      </View>

      {/* Center label */}
      <View style={styles.center}>
        <Text style={[styles.percent, { color }]}>{percent}%</Text>
        <Text style={styles.fraction}>{progress}/{total}</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', position: 'absolute' },
  percent: { fontSize: FONTS.lg, fontWeight: '900', fontVariant: ['tabular-nums'] },
  fraction: { color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 1 },
  label: { color: COLORS.textSecondary, fontSize: FONTS.xs, marginTop: 2 },
});

export default ProgressRing;

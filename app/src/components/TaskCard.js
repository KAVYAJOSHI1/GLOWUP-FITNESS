import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Switch,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS, getCategoryStyle } from '../theme';

const TaskCard = ({ task, completed, onToggle, onEdit }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(checkAnim, {
      toValue: completed ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (completed) {
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ]).start();
    }
  }, [completed]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onToggle(task.id);
  };

  const catStyle = getCategoryStyle(task.category);
  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.06)', COLORS.successLight],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        { transform: [{ scale: scaleAnim }] },
        { borderColor: completed ? COLORS.success + '40' : 'rgba(255,255,255,0.06)' },
        completed && { backgroundColor: '#0D1F18' },
      ]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: catStyle.color }]} />

      {/* Main content */}
      <TouchableOpacity style={styles.content} onPress={handlePress} activeOpacity={0.8}>
        {/* Checkbox */}
        <Animated.View
          style={[
            styles.checkbox,
            {
              backgroundColor: checkAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', COLORS.success],
              }),
              borderColor: checkAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [COLORS.textMuted, COLORS.success],
              }),
            },
          ]}
        >
          {completed && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </Animated.View>

        {/* Icon + info */}
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.icon}>{task.icon}</Text>
            <Text style={[styles.title, completed && styles.titleDone]}>
              {task.title}
            </Text>
          </View>
          <Text style={styles.description} numberOfLines={1}>
            {task.description}
          </Text>
          <View style={styles.meta}>
            <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}>
              <Text style={[styles.categoryText, { color: catStyle.color }]}>
                {task.category}
              </Text>
            </View>
            {task.alarm && (
              <View style={styles.alarmBadge}>
                <Text style={styles.alarmText}>🔔 alarm</Text>
              </View>
            )}
          </View>
        </View>

        {/* Time */}
        <View style={styles.timeContainer}>
          <Text style={styles.time}>{task.time}</Text>
          <TouchableOpacity onPress={() => onEdit(task)} style={styles.editBtn}>
            <Text style={styles.editBtnText}>✎</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  accentBar: {
    width: 3,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    gap: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: FONTS.sm,
    fontWeight: '900',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: FONTS.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.base,
    fontWeight: '700',
    flex: 1,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xs,
    marginLeft: 22,
  },
  meta: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: 4,
    marginLeft: 22,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alarmBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  alarmText: {
    fontSize: 10,
    color: COLORS.warning,
    fontWeight: '600',
  },
  timeContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  time: {
    color: COLORS.violet,
    fontSize: FONTS.base,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.base,
  },
});

export default TaskCard;

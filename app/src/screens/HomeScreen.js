import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, RefreshControl, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import TaskCard from '../components/TaskCard';
import ProgressRing from '../components/ProgressRing';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import {
  getDateKey, saveCompleted, loadCompleted,
  loadStreak, saveStreak, saveLastCompletedDate, loadLastCompletedDate,
  loadWater, saveWater, loadProfile,
} from '../utils/storage';
import { MOTIVATIONAL_QUOTES, DAILY_WATER_GOAL } from '../data/routine';
import { useStepCounter } from '../hooks/useStepCounter';
import { sendWaterReminderNotification, sendStepGoalNotification } from '../utils/notifications';

const HomeScreen = ({ routine, navigation }) => {
  const [completed, setCompleted] = useState({});
  const [streak, setStreak] = useState(0);
  const [quote, setQuote] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [water, setWater] = useState(0);
  const [profile, setProfile] = useState({ name: 'Champion', stepGoal: 8000, waterGoal: 8, weight: 70 });
  const [stepGoalNotifSent, setStepGoalNotifSent] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const dateKey = getDateKey();
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateString = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]}`;

  const completedCount = Object.values(completed).filter(Boolean).length;
  const totalTasks = routine.length;

  const { steps, calories, progress: stepProgress, km } = useStepCounter(
    profile.stepGoal || 8000,
    profile.weight || 70
  );

  // Notify at 80% step goal
  useEffect(() => {
    if (steps >= (profile.stepGoal || 8000) * 0.8 && !stepGoalNotifSent) {
      sendStepGoalNotification(steps);
      setStepGoalNotifSent(true);
    }
  }, [steps]);

  const loadTodayData = useCallback(async () => {
    const [data, str, w, prof] = await Promise.all([
      loadCompleted(dateKey),
      loadStreak(),
      loadWater(dateKey),
      loadProfile(),
    ]);
    setCompleted(data);
    setStreak(str);
    setWater(w);
    setProfile(prof);
  }, [dateKey]);

  useEffect(() => {
    loadTodayData();
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

    Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }).start();

    const clockInterval = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // Update streak when all tasks completed
  useEffect(() => {
    const checkStreak = async () => {
      if (completedCount === totalTasks && totalTasks > 0) {
        const lastDate = await loadLastCompletedDate();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = getDateKey(yesterday);
        const newStreak = lastDate === yesterdayKey ? streak + 1 : 1;
        if (newStreak !== streak) {
          setStreak(newStreak);
          await saveStreak(newStreak);
          await saveLastCompletedDate(dateKey);
        }
      }
    };
    checkStreak();
  }, [completedCount]);

  const handleToggle = async (taskId) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const updated = { ...completed, [taskId]: !completed[taskId] };
    setCompleted(updated);
    await saveCompleted(updated, dateKey);
  };

  const handleWater = async () => {
    if (water >= (profile.waterGoal || DAILY_WATER_GOAL)) {
      Alert.alert('💧 Hydration Goal Met!', "You've hit your daily water goal! Amazing! 🎉");
      return;
    }
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    const newWater = water + 1;
    setWater(newWater);
    await saveWater(newWater, dateKey);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodayData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return `Good Morning, ${profile.name}! ☀️`;
    if (h < 17) return `Good Afternoon, ${profile.name}! 🌤️`;
    if (h < 21) return `Good Evening, ${profile.name}! 🌆`;
    return `Good Night, ${profile.name}! 🌙`;
  };

  const getNextTask = () => {
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    for (const task of routine) {
      const [h, m] = task.time.split(':').map(Number);
      if (h * 60 + m > cur && !completed[task.id]) return task;
    }
    return null;
  };

  const nextTask = getNextTask();
  const waterGoal = profile.waterGoal || DAILY_WATER_GOAL;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.violet} />}
      >
        {/* Header */}
        <LinearGradient colors={['#1A0A3A', '#0D0A1F', COLORS.bg]} style={styles.header}>
          <View style={styles.topRow}>
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.dateText}>{dateString}</Text>
            </Animated.View>
            <View style={styles.rightCol}>
              <Text style={styles.clock}>{currentTime}</Text>
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streak} day streak</Text>
              </View>
            </View>
          </View>

          {/* Progress Hero */}
          <View style={styles.heroCard}>
            <ProgressRing progress={completedCount} total={totalTasks} size={120} strokeWidth={11} color={COLORS.violet} />
            <View style={styles.heroRight}>
              <Text style={styles.heroTitle}>
                {completedCount === totalTasks && totalTasks > 0 ? '🎉 Day Complete!' : `${totalTasks - completedCount} tasks left`}
              </Text>
              <Text style={styles.quoteText} numberOfLines={2}>{quote}</Text>
              {nextTask && (
                <View style={styles.nextChip}>
                  <Text style={styles.nextLabel}>NEXT UP</Text>
                  <Text style={styles.nextTask} numberOfLines={1}>{nextTask.icon} {nextTask.title}</Text>
                  <Text style={styles.nextTime}>{nextTask.time}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Step Counter Widget */}
        <View style={styles.widgetRow}>
          <View style={[styles.widget, styles.widgetSteps]}>
            <LinearGradient colors={['#1A0A3A', '#120D25']} style={styles.widgetGrad}>
              <Text style={styles.widgetIcon}>👟</Text>
              <Text style={styles.widgetBig}>{steps.toLocaleString()}</Text>
              <Text style={styles.widgetLabel}>Steps Today</Text>
              <View style={styles.widgetBar}>
                <View style={[styles.widgetBarFill, { width: `${Math.min(stepProgress * 100, 100)}%`, backgroundColor: COLORS.violet }]} />
              </View>
              <Text style={styles.widgetSub}>{km} km • {calories} kcal</Text>
            </LinearGradient>
          </View>

          <View style={styles.widgetCol}>
            {/* Calories */}
            <View style={[styles.widgetSmall, { borderColor: COLORS.orangeGlow }]}>
              <Text style={styles.widgetSmallIcon}>🔥</Text>
              <Text style={[styles.widgetSmallBig, { color: COLORS.orange }]}>{calories}</Text>
              <Text style={styles.widgetSmallLabel}>kcal burned</Text>
            </View>
            {/* Streak */}
            <View style={[styles.widgetSmall, { borderColor: COLORS.violetGlow }]}>
              <Text style={styles.widgetSmallIcon}>⚡</Text>
              <Text style={[styles.widgetSmallBig, { color: COLORS.warning }]}>{streak}</Text>
              <Text style={styles.widgetSmallLabel}>day streak</Text>
            </View>
          </View>
        </View>

        {/* Water Tracker */}
        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <Text style={styles.waterTitle}>💧 Hydration</Text>
            <Text style={styles.waterCount}>{water}/{waterGoal} glasses</Text>
          </View>
          <View style={styles.glassRow}>
            {Array.from({ length: waterGoal }).map((_, i) => (
              <TouchableOpacity key={i} onPress={handleWater} activeOpacity={0.7}>
                <Text style={[styles.glass, i < water && styles.glassFilled]}>
                  {i < water ? '🥛' : '🫙'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.waterBar}>
            <View style={[styles.waterBarFill, { width: `${(water / waterGoal) * 100}%` }]} />
          </View>
        </View>

        {/* Task List */}
        <View style={styles.taskList}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Routine</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('EditTask', {
                task: { id: String(Date.now()), time: '07:00', title: '', description: '', icon: '🎯', category: 'wellness', notificationEnabled: true, alarm: false },
                isNew: true,
              })}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {routine.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              completed={!!completed[task.id]}
              onToggle={handleToggle}
              onEdit={(t) => navigation.navigate('EditTask', { task: t })}
            />
          ))}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  header: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.base,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  greeting: { color: COLORS.textPrimary, fontSize: FONTS.md, fontWeight: '800' },
  dateText: { color: COLORS.textSecondary, fontSize: FONTS.sm, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  clock: { color: COLORS.violet, fontSize: FONTS.xxl, fontWeight: '900', fontVariant: ['tabular-nums'] },
  streakBadge: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  streakText: { color: COLORS.warning, fontSize: 11, fontWeight: '700' },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    gap: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.violetGlow,
    ...SHADOWS.violet,
  },
  heroRight: { flex: 1, justifyContent: 'center', gap: 6 },
  heroTitle: { color: COLORS.textPrimary, fontSize: FONTS.md, fontWeight: '800' },
  quoteText: { color: COLORS.textSecondary, fontSize: FONTS.xs, fontStyle: 'italic', lineHeight: 17 },
  nextChip: {
    backgroundColor: COLORS.violetGlow2,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.violetGlow,
  },
  nextLabel: { color: COLORS.violetLight, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  nextTask: { color: COLORS.textPrimary, fontSize: FONTS.sm, fontWeight: '700' },
  nextTime: { color: COLORS.violet, fontSize: 11, fontWeight: '700' },
  // Widget row
  widgetRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    gap: SPACING.sm,
  },
  widget: { flex: 1.3, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.violetGlow },
  widgetSteps: { ...SHADOWS.violet },
  widgetGrad: { padding: SPACING.md, alignItems: 'center' },
  widgetIcon: { fontSize: 26, marginBottom: 2 },
  widgetBig: { color: COLORS.textPrimary, fontSize: FONTS.xxl, fontWeight: '900', fontVariant: ['tabular-nums'] },
  widgetLabel: { color: COLORS.textSecondary, fontSize: FONTS.xs, marginBottom: 6 },
  widgetBar: { width: '100%', height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  widgetBarFill: { height: '100%', borderRadius: 2 },
  widgetSub: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  widgetCol: { flex: 1, gap: SPACING.sm },
  widgetSmall: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...SHADOWS.card,
  },
  widgetSmallIcon: { fontSize: 20, marginBottom: 2 },
  widgetSmallBig: { fontSize: FONTS.xl, fontWeight: '900', fontVariant: ['tabular-nums'] },
  widgetSmallLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  // Water
  waterCard: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
    ...SHADOWS.cyan,
  },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  waterTitle: { color: COLORS.textPrimary, fontSize: FONTS.base, fontWeight: '800' },
  waterCount: { color: COLORS.cyan, fontSize: FONTS.sm, fontWeight: '700' },
  glassRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginBottom: SPACING.sm },
  glass: { fontSize: 22, opacity: 0.3 },
  glassFilled: { opacity: 1 },
  waterBar: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  waterBarFill: { height: '100%', backgroundColor: COLORS.cyan, borderRadius: 2 },
  // Task list
  taskList: { paddingHorizontal: SPACING.base, paddingTop: SPACING.base },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  sectionTitle: { color: COLORS.textPrimary, fontSize: FONTS.lg, fontWeight: '900' },
  addBtn: {
    backgroundColor: COLORS.violetGlow,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderActive,
  },
  addBtnText: { color: COLORS.violetLight, fontSize: FONTS.sm, fontWeight: '700' },
});

export default HomeScreen;

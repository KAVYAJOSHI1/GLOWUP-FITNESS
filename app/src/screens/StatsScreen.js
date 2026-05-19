import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ProgressRing from '../components/ProgressRing';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import {
  loadStepsHistory, loadWaterHistory, loadStreak, loadWorkoutHistory,
  loadCompleted, getDateKey, loadProfile,
} from '../utils/storage';
import { DAILY_STEP_GOAL } from '../data/routine';
import { useStepCounter } from '../hooks/useStepCounter';

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const StatCard = ({ icon, label, value, unit, color, sub }) => (
  <View style={[styles.statCard, { borderColor: color + '40' }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statUnit}>{unit}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
  </View>
);

const StatsScreen = ({ routine }) => {
  const [stepsHistory, setStepsHistory] = useState([]);
  const [waterHistory, setWaterHistory] = useState([]);
  const [streak, setStreak] = useState(0);
  const [weekCompleted, setWeekCompleted] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [profile, setProfile] = useState({ stepGoal: 8000, weight: 70 });

  const { steps, calories, km } = useStepCounter(profile.stepGoal, profile.weight);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [sh, wh, str, wkh, prof] = await Promise.all([
      loadStepsHistory(7),
      loadWaterHistory(7),
      loadStreak(),
      loadWorkoutHistory(),
      loadProfile(),
    ]);
    setStepsHistory(sh);
    setWaterHistory(wh);
    setStreak(str);
    setWorkoutHistory(wkh.slice(0, 7));
    setProfile(prof);

    // Load last 7 days task completion
    const completed7 = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dk = getDateKey(date);
      const c = await loadCompleted(dk);
      const completedCount = Object.values(c).filter(Boolean).length;
      completed7.push({ date, completedCount, total: routine.length });
    }
    setWeekCompleted(completed7);
  };

  const maxSteps = Math.max(...stepsHistory.map(s => s.steps || 0), 1);
  const totalWeekSteps = stepsHistory.reduce((a, s) => a + (s.steps || 0), 0);
  const totalWeekCal = Math.round(totalWeekSteps * 0.04 * ((profile.weight || 70) / 70));
  const totalWeekWorkouts = workoutHistory.filter(w => {
    const d = new Date(w.date);
    const now = new Date();
    return (now - d) < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const avgWater = (waterHistory.reduce((a, w) => a + (w.glasses || 0), 0) / 7).toFixed(1);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#0A1A1F', '#08080F']} style={styles.header}>
          <Text style={styles.title}>📊 Your Stats</Text>
          <Text style={styles.sub}>This week's performance overview</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Today's Ring */}
          <View style={styles.todayCard}>
            <LinearGradient colors={['#1A0A3A', '#120D25']} style={styles.todayGrad}>
              <Text style={styles.todayTitle}>Today</Text>
              <View style={styles.todayRow}>
                <ProgressRing
                  progress={Math.min(steps, profile.stepGoal || 8000)}
                  total={profile.stepGoal || 8000}
                  size={110}
                  strokeWidth={10}
                  color={COLORS.violet}
                />
                <View style={styles.todayStats}>
                  <View style={styles.todayStat}>
                    <Text style={styles.todayStatVal}>{steps.toLocaleString()}</Text>
                    <Text style={styles.todayStatLabel}>steps</Text>
                  </View>
                  <View style={styles.todayStat}>
                    <Text style={[styles.todayStatVal, { color: COLORS.orange }]}>{calories}</Text>
                    <Text style={styles.todayStatLabel}>kcal burned</Text>
                  </View>
                  <View style={styles.todayStat}>
                    <Text style={[styles.todayStatVal, { color: COLORS.cyan }]}>{km}</Text>
                    <Text style={styles.todayStatLabel}>km walked</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Weekly stats grid */}
          <View style={styles.statGrid}>
            <StatCard icon="🔥" label="Week streak" value={streak} unit="days" color={COLORS.warning} />
            <StatCard icon="👟" label="Week steps" value={totalWeekSteps.toLocaleString()} unit="steps" color={COLORS.violet} />
            <StatCard icon="💪" label="Workouts" value={totalWeekWorkouts} unit="sessions" color={COLORS.success} />
            <StatCard icon="💧" label="Avg water" value={avgWater} unit="glasses/day" color={COLORS.cyan} />
            <StatCard icon="🏃" label="Week distance" value={(totalWeekSteps * 0.000762).toFixed(1)} unit="km" color={COLORS.pink} />
            <StatCard icon="⚡" label="Week calories" value={totalWeekCal} unit="kcal" color={COLORS.orange} />
          </View>

          {/* Step chart (7 days) */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>👟 Steps This Week</Text>
            <View style={styles.barChart}>
              {stepsHistory.map((item, i) => {
                const h = maxSteps > 0 ? (item.steps / maxSteps) * 100 : 0;
                const dayDate = new Date(item.date);
                const dayIdx = (dayDate.getDay() + 6) % 7; // Mon=0
                const isToday = i === stepsHistory.length - 1;
                return (
                  <View key={i} style={styles.barCol}>
                    <Text style={styles.barValue}>{item.steps > 999 ? `${(item.steps / 1000).toFixed(1)}k` : item.steps}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${Math.max(h, 3)}%`, backgroundColor: isToday ? COLORS.violet : COLORS.violetGlow }]} />
                    </View>
                    <Text style={[styles.barLabel, isToday && { color: COLORS.violet }]}>{DAY_SHORT[dayIdx]}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.goalLine}>
              <View style={styles.goalDash} />
              <Text style={styles.goalLineText}>Goal: {(profile.stepGoal || DAILY_STEP_GOAL).toLocaleString()}</Text>
            </View>
          </View>

          {/* Water chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>💧 Water Intake (7 days)</Text>
            <View style={styles.barChart}>
              {waterHistory.map((item, i) => {
                const h = Math.max((item.glasses / 8) * 100, 3);
                const dayDate = new Date(item.date);
                const dayIdx = (dayDate.getDay() + 6) % 7;
                const isToday = i === waterHistory.length - 1;
                return (
                  <View key={i} style={styles.barCol}>
                    <Text style={styles.barValue}>{item.glasses}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${h}%`, backgroundColor: isToday ? COLORS.cyan : 'rgba(6,182,212,0.35)' }]} />
                    </View>
                    <Text style={[styles.barLabel, isToday && { color: COLORS.cyan }]}>{DAY_SHORT[dayIdx]}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Routine completion heatmap */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>✅ Routine Completion (7 days)</Text>
            <View style={styles.heatmapRow}>
              {weekCompleted.map((day, i) => {
                const pct = day.total > 0 ? day.completedCount / day.total : 0;
                const isToday = i === weekCompleted.length - 1;
                const dayDate = new Date(day.date);
                const dayIdx = (dayDate.getDay() + 6) % 7;
                let bg = COLORS.bgGlass2;
                if (pct >= 1) bg = COLORS.success;
                else if (pct >= 0.5) bg = COLORS.successGlow;
                else if (pct > 0) bg = 'rgba(16,185,129,0.15)';
                return (
                  <View key={i} style={styles.heatCell}>
                    <View style={[styles.heatBox, { backgroundColor: bg }, isToday && styles.heatBoxToday]}>
                      <Text style={styles.heatPct}>{Math.round(pct * 100)}%</Text>
                    </View>
                    <Text style={[styles.heatLabel, isToday && { color: COLORS.violet }]}>{DAY_SHORT[dayIdx]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: SPACING.xl, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.base },
  title: { color: COLORS.textPrimary, fontSize: FONTS.xl, fontWeight: '900' },
  sub: { color: COLORS.textMuted, fontSize: FONTS.sm, marginTop: 4 },
  content: { paddingHorizontal: SPACING.base, paddingTop: SPACING.base },
  todayCard: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.base, borderWidth: 1, borderColor: COLORS.violetGlow, ...SHADOWS.violet },
  todayGrad: { padding: SPACING.base },
  todayTitle: { color: COLORS.textSecondary, fontSize: FONTS.sm, fontWeight: '700', marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 1 },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.base },
  todayStats: { flex: 1, gap: SPACING.md },
  todayStat: {},
  todayStatVal: { color: COLORS.textPrimary, fontSize: FONTS.xl, fontWeight: '900', fontVariant: ['tabular-nums'] },
  todayStatLabel: { color: COLORS.textMuted, fontSize: FONTS.xs },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.base },
  statCard: {
    width: '31%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.card,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: FONTS.lg, fontWeight: '900', fontVariant: ['tabular-nums'] },
  statUnit: { color: COLORS.textMuted, fontSize: 9, marginTop: 1 },
  statLabel: { color: COLORS.textSecondary, fontSize: 10, marginTop: 2, textAlign: 'center' },
  statSub: { color: COLORS.textMuted, fontSize: 9 },
  chartCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  chartTitle: { color: COLORS.textPrimary, fontSize: FONTS.base, fontWeight: '800', marginBottom: SPACING.base },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValue: { color: COLORS.textMuted, fontSize: 8, marginBottom: 3 },
  barTrack: { width: '100%', height: '75%', backgroundColor: COLORS.bgGlass2, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4 },
  barLabel: { color: COLORS.textMuted, fontSize: 9, marginTop: 4 },
  goalLine: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  goalDash: { flex: 1, height: 1, borderWidth: 1, borderColor: COLORS.violet, borderStyle: 'dashed' },
  goalLineText: { color: COLORS.violet, fontSize: 10, fontWeight: '600' },
  heatmapRow: { flexDirection: 'row', gap: 6 },
  heatCell: { flex: 1, alignItems: 'center', gap: 4 },
  heatBox: { width: '100%', aspectRatio: 1, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  heatBoxToday: { borderWidth: 1, borderColor: COLORS.violet },
  heatPct: { color: COLORS.textPrimary, fontSize: 9, fontWeight: '700' },
  heatLabel: { color: COLORS.textMuted, fontSize: 9 },
});

export default StatsScreen;

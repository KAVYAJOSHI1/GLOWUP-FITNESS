import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { WORKOUT_DATABASE } from '../data/routine';
import {
  saveWorkoutSession, loadWorkoutHistory, saveTotalPushups, loadTotalPushups,
} from '../utils/storage';
import { sendWorkoutCompleteNotification } from '../utils/notifications';

const REST_SECONDS = 60;

const WorkoutScreen = () => {
  const [exercises, setExercises] = useState(
    WORKOUT_DATABASE.map(e => ({ ...e, completedReps: 0, completedSets: 0, done: false }))
  );
  const [activeExercise, setActiveExercise] = useState(null);
  const [resting, setResting] = useState(false);
  const [restTimer, setRestTimer] = useState(REST_SECONDS);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionCalories, setSessionCalories] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [history, setHistory] = useState([]);
  const [totalPushups, setTotalPushups] = useState(0);
  const [view, setView] = useState('exercises'); // 'exercises' | 'history'

  const timerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadHistory();
    loadTotalPushups().then(setTotalPushups);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, []);

  const loadHistory = async () => {
    const h = await loadWorkoutHistory();
    setHistory(h.slice(0, 10));
  };

  const startSession = () => {
    setSessionActive(true);
    setSessionTime(0);
    setSessionCalories(0);
    setExercises(WORKOUT_DATABASE.map(e => ({ ...e, completedReps: 0, completedSets: 0, done: false })));
    sessionTimerRef.current = setInterval(() => {
      setSessionTime(t => t + 1);
    }, 1000);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
  };

  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const addRep = (exerciseId) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    pulseAnimation();
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId) return e;
      const newReps = e.completedReps + 1;
      const newCal = sessionCalories + e.caloriesPerRep;
      setSessionCalories(parseFloat(newCal.toFixed(1)));
      // Track total pushups
      if (e.name === 'Push-ups') {
        const newTotal = totalPushups + 1;
        setTotalPushups(newTotal);
        saveTotalPushups(newTotal);
      }
      if (newReps >= e.targetReps) {
        const newSets = e.completedSets + 1;
        if (newSets >= e.targetSets) {
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
          return { ...e, completedReps: 0, completedSets: newSets, done: true };
        }
        // Start rest timer
        startRest(exerciseId);
        return { ...e, completedReps: 0, completedSets: newSets };
      }
      return { ...e, completedReps: newReps };
    }));
  };

  const removeRep = (exerciseId) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setExercises(prev => prev.map(e => {
      if (e.id !== exerciseId || e.completedReps === 0) return e;
      return { ...e, completedReps: e.completedReps - 1 };
    }));
  };

  const startRest = (exerciseId) => {
    setResting(true);
    setActiveExercise(exerciseId);
    setRestTimer(REST_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRestTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setResting(false);
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
          return REST_SECONDS;
        }
        return t - 1;
      });
    }, 1000);
  };

  const skipRest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResting(false);
    setRestTimer(REST_SECONDS);
  };

  const finishSession = async () => {
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    const doneSets = exercises.reduce((acc, e) => acc + e.completedSets, 0);
    const totalCal = Math.round(sessionCalories);
    const session = {
      date: new Date().toISOString(),
      duration: sessionTime,
      calories: totalCal,
      exercises: exercises.map(e => ({ name: e.name, sets: e.completedSets, reps: e.completedReps })),
    };
    await saveWorkoutSession(session);
    await sendWorkoutCompleteNotification('Workout Session', totalCal);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    setSessionActive(false);
    loadHistory();
    Alert.alert(
      '🏆 Workout Complete!',
      `Duration: ${formatTime(sessionTime)}\nCalories: ~${totalCal} kcal\nSets: ${doneSets}\n\nAmazing work! 💪`,
      [{ text: 'Awesome! 🔥' }]
    );
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const doneCount = exercises.filter(e => e.done).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#1A0A1F', '#0D0D1A', COLORS.bg]} style={styles.header}>
          <Text style={styles.title}>💪 Workout</Text>
          <View style={styles.tabs}>
            {['exercises', 'history'].map(t => (
              <TouchableOpacity key={t} onPress={() => setView(t)} style={[styles.tab, view === t && styles.tabActive]}>
                <Text style={[styles.tabText, view === t && styles.tabTextActive]}>
                  {t === 'exercises' ? '🏋️ Exercises' : '📋 History'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {view === 'exercises' ? (
          <View style={styles.content}>
            {/* Session stats */}
            {sessionActive && (
              <LinearGradient colors={['#1A0A3A', '#120D25']} style={styles.sessionBar}>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionStatVal}>⏱️ {formatTime(sessionTime)}</Text>
                  <Text style={styles.sessionStatLabel}>Duration</Text>
                </View>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionStatVal}>🔥 {Math.round(sessionCalories)}</Text>
                  <Text style={styles.sessionStatLabel}>kcal</Text>
                </View>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionStatVal}>✅ {doneCount}/{exercises.length}</Text>
                  <Text style={styles.sessionStatLabel}>Done</Text>
                </View>
              </LinearGradient>
            )}

            {/* Rest timer overlay */}
            {resting && (
              <View style={styles.restCard}>
                <Text style={styles.restEmoji}>😤</Text>
                <Text style={styles.restTitle}>Rest Time</Text>
                <Text style={styles.restTimer}>{restTimer}s</Text>
                <Text style={styles.restSub}>Get ready for next set!</Text>
                <TouchableOpacity style={styles.skipBtn} onPress={skipRest}>
                  <Text style={styles.skipBtnText}>Skip Rest ⚡</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Exercise cards */}
            {exercises.map((exercise) => (
              <View key={exercise.id} style={[styles.exerciseCard, exercise.done && styles.exerciseDone]}>
                <View style={styles.exHeader}>
                  <Text style={styles.exIcon}>{exercise.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exName}>{exercise.name}</Text>
                    <Text style={styles.exMuscle}>{exercise.muscle}</Text>
                  </View>
                  <View style={styles.diffBadge}>
                    <Text style={styles.diffText}>{exercise.difficulty}</Text>
                  </View>
                  {exercise.done && <Text style={styles.doneCheck}>✅</Text>}
                </View>

                <View style={styles.exTarget}>
                  <Text style={styles.targetText}>Target: {exercise.targetReps} {exercise.isTime ? 'sec' : 'reps'} × {exercise.targetSets} sets</Text>
                  <Text style={styles.calText}>~{(exercise.caloriesPerRep * exercise.targetReps * exercise.targetSets).toFixed(0)} kcal</Text>
                </View>

                {/* Set indicators */}
                <View style={styles.setRow}>
                  {Array.from({ length: exercise.targetSets }).map((_, i) => (
                    <View key={i} style={[styles.setDot, i < exercise.completedSets && styles.setDotDone]} />
                  ))}
                  <Text style={styles.setLabel}>{exercise.completedSets}/{exercise.targetSets} sets</Text>
                </View>

                {/* Rep counter */}
                {sessionActive && !exercise.done && (
                  <View style={styles.repCounter}>
                    <TouchableOpacity onPress={() => removeRep(exercise.id)} style={styles.repBtn}>
                      <Text style={styles.repBtnText}>−</Text>
                    </TouchableOpacity>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      <Text style={styles.repCount}>{exercise.completedReps}</Text>
                    </Animated.View>
                    <TouchableOpacity onPress={() => addRep(exercise.id)} style={[styles.repBtn, styles.repBtnPlus]}>
                      <Text style={styles.repBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            {/* Start / Finish button */}
            <TouchableOpacity
              style={[styles.mainBtn, sessionActive && styles.mainBtnFinish]}
              onPress={sessionActive ? finishSession : startSession}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={sessionActive ? ['#10B981', '#059669'] : ['#8B5CF6', '#6D28D9']}
                style={styles.mainBtnGrad}
              >
                <Text style={styles.mainBtnText}>
                  {sessionActive ? '✅ Finish Workout' : '🚀 Start Workout'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={{ height: 30 }} />
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.historyTitle}>Recent Workouts</Text>
            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🏋️</Text>
                <Text style={styles.emptyText}>No workouts yet.</Text>
                <Text style={styles.emptySub}>Start your first session!</Text>
              </View>
            ) : history.map((session, idx) => (
              <View key={idx} style={styles.historyCard}>
                <Text style={styles.historyDate}>{new Date(session.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                <View style={styles.historyStats}>
                  <Text style={styles.historyStatText}>⏱️ {formatTime(session.duration || 0)}</Text>
                  <Text style={styles.historyStatText}>🔥 {session.calories} kcal</Text>
                  <Text style={styles.historyStatText}>💪 {session.exercises?.length || 0} exercises</Text>
                </View>
              </View>
            ))}
            <View style={{ height: 80 }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: SPACING.xl, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.base },
  title: { color: COLORS.textPrimary, fontSize: FONTS.xl, fontWeight: '900', marginBottom: SPACING.md },
  tabs: { flexDirection: 'row', gap: SPACING.sm },
  tab: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCard, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.violetGlow, borderColor: COLORS.borderActive },
  tabText: { color: COLORS.textMuted, fontSize: FONTS.sm, fontWeight: '600' },
  tabTextActive: { color: COLORS.violet, fontWeight: '800' },
  content: { paddingHorizontal: SPACING.base, paddingTop: SPACING.base },
  sessionBar: {
    flexDirection: 'row',
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: COLORS.violetGlow,
    ...SHADOWS.violet,
  },
  sessionStat: { alignItems: 'center' },
  sessionStatVal: { color: COLORS.textPrimary, fontSize: FONTS.md, fontWeight: '800' },
  sessionStatLabel: { color: COLORS.textMuted, fontSize: FONTS.xs },
  restCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    ...SHADOWS.orange,
  },
  restEmoji: { fontSize: 40, marginBottom: 4 },
  restTitle: { color: COLORS.textPrimary, fontSize: FONTS.lg, fontWeight: '800' },
  restTimer: { color: COLORS.warning, fontSize: FONTS.xxxl, fontWeight: '900', fontVariant: ['tabular-nums'] },
  restSub: { color: COLORS.textSecondary, fontSize: FONTS.sm },
  skipBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.violetGlow,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderActive,
  },
  skipBtnText: { color: COLORS.violet, fontSize: FONTS.base, fontWeight: '700' },
  exerciseCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  exerciseDone: { borderColor: COLORS.successGlow, backgroundColor: '#0D1F18' },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  exIcon: { fontSize: 28 },
  exName: { color: COLORS.textPrimary, fontSize: FONTS.base, fontWeight: '800' },
  exMuscle: { color: COLORS.textMuted, fontSize: FONTS.xs },
  diffBadge: {
    backgroundColor: COLORS.violetGlow2,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  diffText: { color: COLORS.violetLight, fontSize: 10, fontWeight: '700' },
  doneCheck: { fontSize: 20 },
  exTarget: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  targetText: { color: COLORS.textSecondary, fontSize: FONTS.sm },
  calText: { color: COLORS.orange, fontSize: FONTS.sm, fontWeight: '700' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  setDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.border },
  setDotDone: { backgroundColor: COLORS.success },
  setLabel: { color: COLORS.textMuted, fontSize: FONTS.xs, marginLeft: 4 },
  repCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  repBtn: {
    width: 44, height: 44, borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  repBtnPlus: { backgroundColor: COLORS.violetGlow, borderColor: COLORS.borderActive },
  repBtnText: { color: COLORS.textPrimary, fontSize: FONTS.xl, fontWeight: '900' },
  repCount: { color: COLORS.violet, fontSize: FONTS.xxl, fontWeight: '900', minWidth: 60, textAlign: 'center', fontVariant: ['tabular-nums'] },
  mainBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', marginTop: SPACING.base, ...SHADOWS.violet },
  mainBtnFinish: { ...SHADOWS.card },
  mainBtnGrad: { paddingVertical: SPACING.lg, alignItems: 'center', borderRadius: RADIUS.xl },
  mainBtnText: { color: '#fff', fontSize: FONTS.md, fontWeight: '900' },
  historyTitle: { color: COLORS.textPrimary, fontSize: FONTS.lg, fontWeight: '900', marginBottom: SPACING.base },
  historyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyDate: { color: COLORS.textPrimary, fontSize: FONTS.base, fontWeight: '700', marginBottom: SPACING.sm },
  historyStats: { flexDirection: 'row', gap: SPACING.md },
  historyStatText: { color: COLORS.textSecondary, fontSize: FONTS.sm },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxxl },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textPrimary, fontSize: FONTS.lg, fontWeight: '700' },
  emptySub: { color: COLORS.textMuted, fontSize: FONTS.sm, marginTop: 4 },
});

export default WorkoutScreen;

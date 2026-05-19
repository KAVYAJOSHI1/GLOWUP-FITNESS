import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, TextInput, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import {
  loadProfile, saveProfile, DEFAULT_PROFILE,
  loadStreak, loadWorkoutHistory, loadTotalPushups, loadAchievements, saveAchievements,
  loadSteps, loadWater, getDateKey,
} from '../utils/storage';
import { ACHIEVEMENTS, MOTIVATIONAL_QUOTES } from '../data/routine';
import {
  scheduleAllNotifications, cancelAllNotifications, getScheduledNotifications,
  sendMotivationalNotification, scheduleWaterReminders,
  setupNotificationChannels, scheduleMorningMotivation,
} from '../utils/notifications';

const ProfileScreen = ({ navigation, routine, onSave }) => {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_PROFILE);
  const [streak, setStreak] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalPushups, setTotalPushups] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [view, setView] = useState('profile'); // profile | achievements | tasks

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [prof, str, wkh, tp, ua, scheduled, steps, water] = await Promise.all([
      loadProfile(),
      loadStreak(),
      loadWorkoutHistory(),
      loadTotalPushups(),
      loadAchievements(),
      getScheduledNotifications(),
      loadSteps(getDateKey()),
      loadWater(getDateKey()),
    ]);
    setProfile(prof);
    setDraft(prof);
    setStreak(str);
    setTotalWorkouts(wkh.length);
    setTotalPushups(tp);
    setUnlockedAchievements(ua);
    setScheduledCount(scheduled.length);

    // Check & unlock achievements
    const newUnlocked = [...ua];
    const check = (id, cond) => {
      if (cond && !newUnlocked.includes(id)) newUnlocked.push(id);
    };
    check('a1', wkh.length >= 1);
    check('a2', str >= 3);
    check('a3', str >= 7);
    check('a4', str >= 14);
    check('a5', str >= 30);
    check('a6', steps >= 5000);
    check('a7', steps >= 8000);
    check('a8', steps >= 12000);
    check('a9', water >= 8);
    check('a10', wkh.length >= 5);
    if (newUnlocked.length !== ua.length) {
      setUnlockedAchievements(newUnlocked);
      await saveAchievements(newUnlocked);
    }
  };

  const saveProfileData = async () => {
    await saveProfile(draft);
    setProfile(draft);
    setEditing(false);
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    Alert.alert('✅ Saved!', 'Profile updated successfully!');
  };

  const handleReschedule = async () => {
    // Always set up channels first before scheduling
    await setupNotificationChannels();
    await scheduleAllNotifications(routine);
    await scheduleWaterReminders();
    await scheduleMorningMotivation();
    const sched = await getScheduledNotifications();
    setScheduledCount(sched.length);
    Alert.alert('✅ Done!', `${sched.length} reminders scheduled!\n\nTask alarms + water reminders + morning motivation are all set! 🔥`);
  };

  const handleCancelAll = () => {
    Alert.alert('Cancel All Notifications', 'This removes all scheduled reminders.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel All', style: 'destructive', onPress: async () => {
        await cancelAllNotifications();
        setScheduledCount(0);
        Alert.alert('Done', 'All notifications cancelled.');
      }},
    ]);
  };

  const handleTestNotif = async () => {
    const q = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    await sendMotivationalNotification(q);
    Alert.alert('📬 Sent!', 'Check your notification panel!');
  };

  const tabs = ['profile', 'achievements', 'tasks'];
  const tabLabels = { profile: '👤 Profile', achievements: '🏆 Badges', tasks: '📋 Tasks' };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#1A0A2E', '#0D0D1A', COLORS.bg]} style={styles.header}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>💪</Text>
            </View>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileSub}>Your Glow Up Journey</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatVal, { color: COLORS.warning }]}>{streak}</Text>
              <Text style={styles.profileStatLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatVal, { color: COLORS.violet }]}>{totalWorkouts}</Text>
              <Text style={styles.profileStatLabel}>Workouts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatVal, { color: COLORS.success }]}>{totalPushups}</Text>
              <Text style={styles.profileStatLabel}>Push-ups</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatVal, { color: COLORS.pink }]}>{unlockedAchievements.length}</Text>
              <Text style={styles.profileStatLabel}>Badges</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {tabs.map(t => (
            <TouchableOpacity key={t} onPress={() => setView(t)} style={[styles.tab, view === t && styles.tabActive]}>
              <Text style={[styles.tabText, view === t && styles.tabTextActive]}>{tabLabels[t]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {/* PROFILE TAB */}
          {view === 'profile' && (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Personal Info</Text>
                  <TouchableOpacity onPress={() => editing ? saveProfileData() : setEditing(true)} style={styles.editBtn}>
                    <Text style={styles.editBtnText}>{editing ? '✅ Save' : '✏️ Edit'}</Text>
                  </TouchableOpacity>
                </View>
                {[
                  { label: 'Name', key: 'name', placeholder: 'Your name' },
                  { label: 'Age', key: 'age', placeholder: '21', numeric: true },
                  { label: 'Weight (kg)', key: 'weight', placeholder: '70', numeric: true },
                  { label: 'Height (cm)', key: 'height', placeholder: '175', numeric: true },
                  { label: 'Daily Step Goal', key: 'stepGoal', placeholder: '8000', numeric: true },
                  { label: 'Water Goal (glasses)', key: 'waterGoal', placeholder: '8', numeric: true },
                ].map(field => (
                  <View key={field.key} style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    {editing ? (
                      <TextInput
                        style={styles.fieldInput}
                        value={String(draft[field.key] || '')}
                        onChangeText={v => setDraft(p => ({ ...p, [field.key]: field.numeric ? parseInt(v) || 0 : v }))}
                        placeholder={field.placeholder}
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType={field.numeric ? 'numeric' : 'default'}
                      />
                    ) : (
                      <Text style={styles.fieldValue}>{profile[field.key]}</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Notifications */}
              <Text style={styles.sectionLabel}>🔔 Notifications</Text>
              <View style={styles.card}>
                <View style={styles.notifRow}>
                  <Text style={styles.notifLabel}>Active Reminders</Text>
                  <Text style={[styles.notifValue, { color: COLORS.success }]}>{scheduledCount}</Text>
                </View>
              </View>
              {[
                { icon: '🔄', title: 'Schedule All Reminders', sub: 'Set daily + water reminders', fn: handleReschedule },
                { icon: '📬', title: 'Test Notification', sub: 'Send motivational alert now', fn: handleTestNotif },
                { icon: '🔕', title: 'Cancel All', sub: 'Remove all notifications', fn: handleCancelAll, danger: true },
              ].map((item, i) => (
                <TouchableOpacity key={i} style={[styles.actionBtn, item.danger && styles.dangerBtn]} onPress={item.fn} activeOpacity={0.8}>
                  <Text style={styles.actionIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionTitle, item.danger && { color: COLORS.danger }]}>{item.title}</Text>
                    <Text style={styles.actionSub}>{item.sub}</Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>
              ))}

              {/* Add task */}
              <Text style={styles.sectionLabel}>📋 Routine</Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('EditTask', {
                  task: { id: String(Date.now()), time: '07:00', title: '', description: '', icon: '🎯', category: 'wellness', notificationEnabled: true, alarm: false },
                  isNew: true,
                })}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>➕</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>Add New Task</Text>
                  <Text style={styles.actionSub}>Create a custom task for your routine</Text>
                </View>
                <Text style={styles.actionArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.appInfo}>
                <Text style={styles.appInfoTitle}>✨ GLOWUP v2.0</Text>
                <Text style={styles.appInfoSub}>Your Daily Transformation App</Text>
                <Text style={styles.appVersion}>Built with 🔥 for champions</Text>
              </View>
            </>
          )}

          {/* ACHIEVEMENTS TAB */}
          {view === 'achievements' && (
            <>
              <Text style={styles.achieveHeader}>
                {unlockedAchievements.length}/{ACHIEVEMENTS.length} Badges Unlocked 🏆
              </Text>
              <View style={styles.badgeGrid}>
                {ACHIEVEMENTS.map((ach) => {
                  const unlocked = unlockedAchievements.includes(ach.id);
                  return (
                    <View key={ach.id} style={[styles.badge, unlocked && styles.badgeUnlocked]}>
                      <Text style={[styles.badgeIcon, !unlocked && styles.badgeLocked]}>{unlocked ? ach.icon : '🔒'}</Text>
                      <Text style={[styles.badgeTitle, !unlocked && styles.badgeLockedText]}>{ach.title}</Text>
                      <Text style={styles.badgeDesc}>{ach.desc}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* TASKS TAB */}
          {view === 'tasks' && (
            <>
              <Text style={styles.sectionLabel}>All Tasks ({routine.length})</Text>
              {routine.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskRow}
                  onPress={() => navigation.navigate('EditTask', { task })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.taskIcon}>{task.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskMeta}>{task.time} • {task.category}</Text>
                  </View>
                  {task.notificationEnabled && <Text style={{ fontSize: 14 }}>🔔</Text>}
                  <Text style={styles.actionArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: SPACING.xl, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.base },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.lg },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.violetGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.violetLight,
    marginBottom: SPACING.sm,
    ...SHADOWS.violet,
  },
  avatarEmoji: { fontSize: 36 },
  profileName: { color: COLORS.textPrimary, fontSize: FONTS.xl, fontWeight: '900' },
  profileSub: { color: COLORS.textMuted, fontSize: FONTS.sm, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileStat: { alignItems: 'center' },
  profileStatVal: { fontSize: FONTS.xl, fontWeight: '900', fontVariant: ['tabular-nums'] },
  profileStatLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.base,
    marginVertical: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: 4,
    gap: 4,
  },
  tab: { flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.violetGlow },
  tabText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: COLORS.violetLight, fontWeight: '800' },
  content: { paddingHorizontal: SPACING.base },
  section: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { color: COLORS.textPrimary, fontSize: FONTS.base, fontWeight: '800' },
  editBtn: {
    backgroundColor: COLORS.violetGlow,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderActive,
  },
  editBtnText: { color: COLORS.violetLight, fontSize: FONTS.sm, fontWeight: '700' },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  fieldLabel: { color: COLORS.textSecondary, fontSize: FONTS.sm, flex: 1 },
  fieldValue: { color: COLORS.textPrimary, fontSize: FONTS.sm, fontWeight: '700' },
  fieldInput: {
    backgroundColor: COLORS.bgGlass2,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    color: COLORS.textPrimary,
    fontSize: FONTS.sm,
    minWidth: 100,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: COLORS.borderActive,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.base,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifRow: { flexDirection: 'row', justifyContent: 'space-between' },
  notifLabel: { color: COLORS.textSecondary, fontSize: FONTS.sm },
  notifValue: { fontSize: FONTS.sm, fontWeight: '800' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  dangerBtn: { borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.05)' },
  actionIcon: { fontSize: 24, width: 32 },
  actionTitle: { color: COLORS.textPrimary, fontSize: FONTS.base, fontWeight: '700' },
  actionSub: { color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 1 },
  actionArrow: { color: COLORS.textMuted, fontSize: FONTS.xl },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  taskIcon: { fontSize: 20 },
  taskTitle: { color: COLORS.textPrimary, fontSize: FONTS.sm, fontWeight: '600' },
  taskMeta: { color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 1 },
  appInfo: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  appInfoTitle: { color: COLORS.violet, fontSize: FONTS.xl, fontWeight: '900' },
  appInfoSub: { color: COLORS.textSecondary, fontSize: FONTS.sm, marginTop: 4 },
  appVersion: { color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 8 },
  achieveHeader: { color: COLORS.textPrimary, fontSize: FONTS.base, fontWeight: '800', marginBottom: SPACING.base },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  badge: {
    width: '47%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  badgeUnlocked: { borderColor: COLORS.violetGlow, backgroundColor: '#1A0A3A', ...SHADOWS.violet },
  badgeIcon: { fontSize: 32, marginBottom: 4 },
  badgeLocked: { opacity: 0.3 },
  badgeTitle: { color: COLORS.textPrimary, fontSize: FONTS.sm, fontWeight: '800', textAlign: 'center' },
  badgeLockedText: { color: COLORS.textMuted },
  badgeDesc: { color: COLORS.textMuted, fontSize: 10, textAlign: 'center' },
});

export default ProfileScreen;

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, Switch,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { scheduleAllNotifications, cancelAllNotifications, getScheduledNotifications, sendMotivationalNotification } from '../utils/notifications';
import { MOTIVATIONAL_QUOTES } from '../data/routine';

const SettingsScreen = ({ navigation, routine }) => {
  const [scheduledCount, setScheduledCount] = useState(0);
  const [notificationsGranted, setNotificationsGranted] = useState(true);

  useEffect(() => {
    loadScheduledCount();
  }, []);

  const loadScheduledCount = async () => {
    const scheduled = await getScheduledNotifications();
    setScheduledCount(scheduled.length);
  };

  const handleReschedule = async () => {
    await scheduleAllNotifications(routine);
    await loadScheduledCount();
    Alert.alert('✅ Done!', `${routine.filter(t => t.notificationEnabled).length} daily notifications scheduled!`);
  };

  const handleCancelAll = () => {
    Alert.alert(
      'Cancel All Notifications',
      'This will remove all scheduled daily reminders.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel All',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            await loadScheduledCount();
            Alert.alert('Done', 'All notifications cancelled.');
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    await sendMotivationalNotification(quote);
    Alert.alert('📬 Sent!', 'Check your notification panel!');
  };

  const enabledCount = routine.filter(t => t.notificationEnabled).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>⚙️ Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>
          {/* Notification status */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔔 Notification Status</Text>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{enabledCount}</Text>
                <Text style={styles.statLabel}>Tasks with notifications</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: COLORS.success }]}>{scheduledCount}</Text>
                <Text style={styles.statLabel}>Active reminders</Text>
              </View>
            </View>
          </View>

          {/* Notification actions */}
          <Text style={styles.sectionTitle}>Notifications</Text>

          <TouchableOpacity style={styles.actionBtn} onPress={handleReschedule} activeOpacity={0.8}>
            <View style={styles.actionLeft}>
              <Text style={styles.actionIcon}>🔄</Text>
              <View>
                <Text style={styles.actionTitle}>Schedule All Reminders</Text>
                <Text style={styles.actionSub}>Set up daily notifications for all enabled tasks</Text>
              </View>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleTestNotification} activeOpacity={0.8}>
            <View style={styles.actionLeft}>
              <Text style={styles.actionIcon}>📬</Text>
              <View>
                <Text style={styles.actionTitle}>Test Notification</Text>
                <Text style={styles.actionSub}>Send a motivational notification right now</Text>
              </View>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={handleCancelAll} activeOpacity={0.8}>
            <View style={styles.actionLeft}>
              <Text style={styles.actionIcon}>🔕</Text>
              <View>
                <Text style={[styles.actionTitle, { color: COLORS.danger }]}>Cancel All Reminders</Text>
                <Text style={styles.actionSub}>Remove all scheduled daily notifications</Text>
              </View>
            </View>
            <Text style={[styles.actionArrow, { color: COLORS.danger }]}>›</Text>
          </TouchableOpacity>

          {/* Routine management */}
          <Text style={styles.sectionTitle}>Routine</Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('EditTask', {
              task: {
                id: String(Date.now()),
                time: '07:00',
                title: '',
                description: '',
                icon: '🎯',
                category: 'wellness',
                notificationEnabled: true,
                alarm: false,
              },
              isNew: true,
            })}
            activeOpacity={0.8}
          >
            <View style={styles.actionLeft}>
              <Text style={styles.actionIcon}>➕</Text>
              <View>
                <Text style={styles.actionTitle}>Add New Task</Text>
                <Text style={styles.actionSub}>Create a custom task for your routine</Text>
              </View>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          {/* Task list overview */}
          <Text style={styles.sectionTitle}>All Tasks ({routine.length})</Text>
          {routine.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskRow}
              onPress={() => navigation.navigate('EditTask', { task })}
              activeOpacity={0.8}
            >
              <Text style={styles.taskRowIcon}>{task.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.taskRowTitle}>{task.title}</Text>
                <Text style={styles.taskRowTime}>{task.time} • {task.category}</Text>
              </View>
              {task.notificationEnabled && (
                <Text style={styles.notifIcon}>🔔</Text>
              )}
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          ))}

          {/* App info */}
          <View style={styles.appInfo}>
            <Text style={styles.appInfoTitle}>✨ GLOWUP</Text>
            <Text style={styles.appInfoSub}>Your Daily Transformation App</Text>
            <Text style={styles.appVersion}>v1.0.0</Text>
          </View>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.base,
  },
  backBtn: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm },
  backBtnText: { color: COLORS.violet, fontSize: FONTS.base, fontWeight: '600' },
  screenTitle: { color: COLORS.textPrimary, fontSize: FONTS.lg, fontWeight: '900' },
  content: { paddingHorizontal: SPACING.base },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.base,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  statRow: { flexDirection: 'row', gap: SPACING.xl },
  stat: { alignItems: 'center' },
  statNum: { color: COLORS.violet, fontSize: FONTS.xxl, fontWeight: '900' },
  statLabel: { color: COLORS.textSecondary, fontSize: FONTS.xs, marginTop: 2 },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dangerBtn: {
    borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  actionLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
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
  taskRowIcon: { fontSize: 20 },
  taskRowTitle: { color: COLORS.textPrimary, fontSize: FONTS.sm, fontWeight: '600' },
  taskRowTime: { color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 1 },
  notifIcon: { fontSize: 14 },
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
});

export default SettingsScreen;

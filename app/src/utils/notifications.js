import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// ─── Channel IDs ──────────────────────────────────────────────────────────────
export const CHANNEL_ALARMS = 'glowup_alarms';
export const CHANNEL_REMINDERS = 'glowup_reminders';
export const CHANNEL_WATER = 'glowup_water';

// ─── Foreground handler (shows alert + plays sound when app is open) ──────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Create Android Notification Channels ────────────────────────────────────
// MUST be called before scheduling any notifications.
export const setupNotificationChannels = async () => {
  if (Platform.OS !== 'android') return;

  // High-priority alarm channel (task reminders that fire at exact time)
  await Notifications.setNotificationChannelAsync(CHANNEL_ALARMS, {
    name: 'GlowUp Alarms',
    description: 'Daily task alarms and workout reminders',
    importance: Notifications.AndroidImportance.MAX,       // Heads-up display
    sound: 'default',
    vibrationPattern: [0, 300, 200, 300],
    lightColor: '#8B5CF6',
    enableLights: true,
    enableVibrate: true,
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });

  // Normal reminder channel (water, motivational)
  await Notifications.setNotificationChannelAsync(CHANNEL_REMINDERS, {
    name: 'GlowUp Reminders',
    description: 'Motivational and wellness reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 200],
    enableVibrate: true,
    showBadge: true,
  });

  // Water reminder channel
  await Notifications.setNotificationChannelAsync(CHANNEL_WATER, {
    name: 'Water Reminders',
    description: 'Hourly hydration reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    enableVibrate: true,
  });
};

// ─── Request Permissions ──────────────────────────────────────────────────────
export const requestNotificationPermissions = async () => {
  if (!Device.isDevice) {
    console.warn('Notifications only work on real devices.');
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: true,
    },
  });
  return status === 'granted';
};

// ─── Parse time string ────────────────────────────────────────────────────────
const parseTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  return { hour: h, minute: m };
};

// ─── Schedule a Daily Task Notification ───────────────────────────────────────
// Uses SchedulableTriggerInputTypes.DAILY for reliable repeating alarms.
export const scheduleTaskNotification = async (task) => {
  if (!task.notificationEnabled) return null;
  try {
    const { hour, minute } = parseTime(task.time);

    // Always cancel old one first to avoid duplicates
    await cancelTaskNotification(task.id);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${task.icon} ${task.title}`,
        body: task.description || "It's time! Let's glow up! 💪",
        sound: 'default',
        data: { taskId: task.id },
        // Android-specific extras
        ...(Platform.OS === 'android' && {
          channelId: CHANNEL_ALARMS,
          priority: 'max',
          sticky: false,
          vibrate: [0, 300, 200, 300],
          color: '#8B5CF6',
        }),
      },
      // DAILY trigger = fires every day at this exact hour:minute
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    console.log(`Scheduled [${task.title}] at ${hour}:${minute < 10 ? '0' + minute : minute} → id: ${id}`);
    return id;
  } catch (e) {
    console.error('scheduleTaskNotification error:', e);
    return null;
  }
};

// ─── Cancel a specific task's notification ────────────────────────────────────
export const cancelTaskNotification = async (taskId) => {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      if (n.content?.data?.taskId === taskId) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {
    console.error('cancelTaskNotification error:', e);
  }
};

// ─── Schedule all enabled task notifications ──────────────────────────────────
export const scheduleAllNotifications = async (routine) => {
  // Cancel everything first for a clean slate
  await Notifications.cancelAllScheduledNotificationsAsync();
  let count = 0;
  for (const task of routine) {
    if (task.notificationEnabled) {
      const id = await scheduleTaskNotification(task);
      if (id) count++;
    }
  }
  console.log(`Scheduled ${count} task notifications.`);
  return count;
};

// ─── Cancel all scheduled notifications ──────────────────────────────────────
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// ─── Get all scheduled notifications ─────────────────────────────────────────
export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

// ─── Immediate Motivational Notification ──────────────────────────────────────
export const sendMotivationalNotification = async (quote) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 GlowUp Power Boost!',
        body: quote,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: CHANNEL_REMINDERS }),
      },
      trigger: null, // Immediate
    });
  } catch (e) { console.error(e); }
};

// ─── Workout Complete Notification ────────────────────────────────────────────
export const sendWorkoutCompleteNotification = async (name, calories) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Workout Complete!',
        body: `Crushed it! Burned ~${calories} kcal. You're an absolute beast! 🔥`,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: CHANNEL_REMINDERS }),
      },
      trigger: null,
    });
  } catch (e) { console.error(e); }
};

// ─── Step Goal Notification ───────────────────────────────────────────────────
export const sendStepGoalNotification = async (steps) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '👟 Almost at Step Goal!',
        body: `${steps.toLocaleString()} steps! Push just a little more! 🏃`,
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: CHANNEL_REMINDERS }),
      },
      trigger: null,
    });
  } catch (e) { console.error(e); }
};

// ─── Immediate water reminder ─────────────────────────────────────────────────
export const sendWaterReminderNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 Hydration Alert!',
        body: "Don't forget to drink water! Hydration = peak performance.",
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: CHANNEL_WATER }),
      },
      trigger: null,
    });
  } catch (e) { console.error(e); }
};

// ─── Streak Notification ──────────────────────────────────────────────────────
export const sendStreakNotification = async (streak) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔥 ${streak}-Day Streak!`,
        body: "Complete today's routine to keep the fire burning! 💪",
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: CHANNEL_REMINDERS }),
      },
      trigger: null,
    });
  } catch (e) { console.error(e); }
};

// ─── Schedule Daily Water Reminders ──────────────────────────────────────────
export const scheduleWaterReminders = async () => {
  const schedule = [
    { hour: 8, minute: 0 },
    { hour: 10, minute: 30 },
    { hour: 13, minute: 0 },
    { hour: 15, minute: 30 },
    { hour: 17, minute: 0 },
    { hour: 19, minute: 30 },
  ];

  for (const time of schedule) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Drink Water!',
          body: 'Time to hydrate! Your muscles and mind will thank you.',
          sound: 'default',
          data: { type: 'water_reminder' },
          ...(Platform.OS === 'android' && { channelId: CHANNEL_WATER }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: time.hour,
          minute: time.minute,
        },
      });
    } catch (e) {
      console.error('scheduleWaterReminders error:', e);
    }
  }
  console.log('Water reminders scheduled.');
};

// ─── Schedule Morning Motivation ──────────────────────────────────────────────
export const scheduleMorningMotivation = async (quote) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '☀️ Good Morning, Champion!',
        body: quote || "Today is your day to shine! Start your GlowUp routine now! 🔥",
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: CHANNEL_REMINDERS }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 5,
        minute: 0,
      },
    });
  } catch (e) { console.error(e); }
};

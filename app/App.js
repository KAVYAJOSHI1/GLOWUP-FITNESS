import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert, View, Text, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';

import HomeScreen from './src/screens/HomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import StatsScreen from './src/screens/StatsScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditTaskScreen from './src/screens/EditTaskScreen';

import { DEFAULT_ROUTINE } from './src/data/routine';
import { loadRoutine, saveRoutine } from './src/utils/storage';
import {
  requestNotificationPermissions,
  setupNotificationChannels,
  scheduleAllNotifications,
  scheduleTaskNotification,
  cancelTaskNotification,
  scheduleMorningMotivation,
  scheduleWaterReminders,
} from './src/utils/notifications';
import { COLORS } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_CFG = [
  { name: 'Home', icon: '🏠', label: 'Home' },
  { name: 'Workout', icon: '💪', label: 'Workout' },
  { name: 'Stats', icon: '📊', label: 'Stats' },
  { name: 'Chat', icon: '🤖', label: 'AI Coach' },
  { name: 'Profile', icon: '👤', label: 'Profile' },
];

function TabIcon({ icon, focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={styles.tabEmoji}>{icon}</Text>
    </View>
  );
}

function TabLabel({ label, focused }) {
  return (
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  );
}

function MainTabs({ routine, onSaveTask }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = TAB_CFG.find(t => t.name === route.name);
        return {
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon icon={cfg?.icon} focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label={cfg?.label} focused={focused} />,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () => null,
        };
      }}
    >
      <Tab.Screen name="Home">
        {(props) => <HomeScreen {...props} routine={routine} />}
      </Tab.Screen>
      <Tab.Screen name="Workout">
        {(props) => <WorkoutScreen {...props} routine={routine} />}
      </Tab.Screen>
      <Tab.Screen name="Stats">
        {(props) => <StatsScreen {...props} routine={routine} />}
      </Tab.Screen>
      <Tab.Screen name="Chat">
        {(props) => <ChatScreen {...props} routine={routine} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} routine={routine} onSave={onSaveTask} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [routine, setRoutine] = useState(DEFAULT_ROUTINE);
  const [ready, setReady] = useState(false);
  const notifListener = useRef();

  useEffect(() => {
    initApp();
    notifListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
    });
    return () => {
      if (notifListener.current) {
        Notifications.removeNotificationSubscription(notifListener.current);
      }
    };
  }, []);

  const initApp = async () => {
    const saved = await loadRoutine(DEFAULT_ROUTINE);
    setRoutine(saved);

    // 1. Create Android notification channels FIRST (required before scheduling)
    await setupNotificationChannels();

    // 2. Request permission
    const granted = await requestNotificationPermissions();

    if (granted) {
      // 3. Schedule all task notifications with correct DAILY trigger
      await scheduleAllNotifications(saved);
      // 4. Schedule daily water reminders
      await scheduleWaterReminders();
      // 5. Schedule 5AM morning motivation
      await scheduleMorningMotivation();
    } else {
      Alert.alert(
        '🔔 Enable Notifications',
        'GlowUp needs notification permission for real-time task alarms!\n\nGo to Settings → Apps → GlowUp → Notifications and enable them.',
        [{ text: 'OK' }]
      );
    }

    setReady(true);
  };

  const handleSaveTask = async (updatedTask, isNew, deleteId) => {
    let newRoutine;
    if (deleteId) {
      newRoutine = routine.filter(t => t.id !== deleteId);
      await cancelTaskNotification(deleteId);
    } else if (isNew) {
      newRoutine = [...routine, updatedTask];
      newRoutine.sort((a, b) => a.time.localeCompare(b.time));
      await scheduleTaskNotification(updatedTask);
    } else {
      newRoutine = routine.map(t => t.id === updatedTask.id ? updatedTask : t);
      newRoutine.sort((a, b) => a.time.localeCompare(b.time));
      if (updatedTask.notificationEnabled) {
        await scheduleTaskNotification(updatedTask);
      } else {
        await cancelTaskNotification(updatedTask.id);
      }
    }
    setRoutine(newRoutine);
    await saveRoutine(newRoutine);
  };

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashEmoji}>✨</Text>
        <Text style={styles.splashTitle}>GLOWUP</Text>
        <Text style={styles.splashSub}>Loading your routine...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main">
          {(props) => (
            <MainTabs {...props} routine={routine} onSaveTask={handleSaveTask} />
          )}
        </Stack.Screen>
        <Stack.Screen name="EditTask">
          {(props) => (
            <EditTaskScreen {...props} routine={routine} onSave={handleSaveTask} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0D0D1A',
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    height: 76,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabIcon: {
    width: 44,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: 'rgba(139,92,246,0.18)',
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
  splash: {
    flex: 1,
    backgroundColor: '#08080F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  splashEmoji: { fontSize: 56 },
  splashTitle: {
    color: '#8B5CF6',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 4,
  },
  splashSub: {
    color: '#475569',
    fontSize: 14,
    marginTop: 4,
  },
});

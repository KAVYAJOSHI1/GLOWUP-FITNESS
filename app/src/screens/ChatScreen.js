import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import {
  loadChatHistory, saveChatHistory,
  loadCompleted, loadStreak, loadWater, loadSteps, loadWorkoutHistory,
  loadProfile, loadTotalPushups, getDateKey,
} from '../utils/storage';
import { MOTIVATIONAL_QUOTES } from '../data/routine';
import { sendMotivationalNotification } from '../utils/notifications';

const BOT_NAME = 'GlowBot 🤖';
const TYPING_DELAY = 1000;

const QUICK_REPLIES = [
  "How many pushups left? 💪",
  "What's my streak? 🔥",
  "My steps today? 👟",
  "Water intake? 💧",
  "Motivate me! ⚡",
  "My progress? 📊",
];

const matches = (text, keywords) => keywords.some(k => text.includes(k));

const ChatScreen = ({ routine }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef(null);
  const typingDots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initChat();
    startTypingAnimation();
  }, []);

  const startTypingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingDots, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(typingDots, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const initChat = async () => {
    const history = await loadChatHistory();
    if (history.length === 0) {
      const welcome = makeBot("Hey! I'm GlowBot — your personal AI fitness coach! 💪\n\nAsk me anything:\n• How many pushups left?\n• What's my streak?\n• Motivate me!\n• My water intake?\n• How many steps today?\n\nLet's crush your goals! 🔥");
      setMessages([welcome]);
    } else {
      setMessages(history);
    }
  };

  const makeMsg = (text, isBot) => ({
    id: String(Date.now()) + Math.random(),
    text,
    isBot,
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  });

  const makeBot = (text) => makeMsg(text, true);
  const makeUser = (text) => makeMsg(text, false);

  const processMessage = useCallback(async (userText) => {
    const t = userText.toLowerCase().trim();
    const dateKey = getDateKey();

    // Load real data
    const [completed, streak, water, steps, workouts, profile, totalPushups] = await Promise.all([
      loadCompleted(dateKey),
      loadStreak(),
      loadWater(dateKey),
      loadSteps(dateKey),
      loadWorkoutHistory(),
      loadProfile(),
      loadTotalPushups(),
    ]);

    const totalTasks = routine.length;
    const completedCount = Object.values(completed).filter(Boolean).length;
    const remaining = totalTasks - completedCount;
    const calories = Math.round(steps * 0.04 * ((profile.weight || 70) / 70));

    // Greeting
    if (matches(t, ['hi', 'hello', 'hey', 'yo', 'sup', 'hola'])) {
      const hour = new Date().getHours();
      const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      return `${greet}, ${profile.name}! 👋\n\nYou're on a 🔥 ${streak}-day streak! Today you've completed ${completedCount}/${totalTasks} tasks.\n\nHow can I help you crush it today? 💪`;
    }

    // Pushup queries
    if (matches(t, ['pushup', 'push up', 'push-up'])) {
      const pushupTask = routine.find(t => t.title.toLowerCase().includes('pushup') || t.description.toLowerCase().includes('pushup'));
      if (pushupTask) {
        const done = !!completed[pushupTask.id];
        if (done) {
          return `💪 You've ALREADY crushed your pushups today! Total pushups all time: ${totalPushups}!\n\nYou're an absolute beast! 🔥 Keep it up!`;
        } else {
          return `💪 Your pushup goal today: "${pushupTask.title}" at ${pushupTask.time}.\n\nYou haven't done them yet — go hit those reps RIGHT NOW! 🔥\n\nAll-time total pushups: ${totalPushups}`;
        }
      }
      return `I couldn't find a pushup task in your routine. You can add one from the Home screen! 💪\nAll-time pushups logged in Workout: ${totalPushups}`;
    }

    // Steps
    if (matches(t, ['step', 'steps', 'walk', 'walked', 'km', 'distance'])) {
      const stepGoal = profile.stepGoal || 8000;
      const pct = Math.round((steps / stepGoal) * 100);
      const stepsLeft = Math.max(0, stepGoal - steps);
      const km = (steps * 0.000762).toFixed(2);
      if (steps >= stepGoal) {
        return `🎉 STEP GOAL CRUSHED! You walked ${steps.toLocaleString()} steps (${km} km) today!\n\nThat's ${calories} kcal burned! You're on fire! 🔥`;
      }
      return `👟 Today's Steps: ${steps.toLocaleString()} / ${stepGoal.toLocaleString()}\n\n${pct}% done • ${km} km • ${calories} kcal burned\n\n${stepsLeft.toLocaleString()} more steps to hit your goal! Let's go! 🏃`;
    }

    // Water
    if (matches(t, ['water', 'hydrat', 'drink', 'thirsty'])) {
      const waterGoal = profile.waterGoal || 8;
      if (water >= waterGoal) {
        return `💧 Amazing! You've hit your hydration goal: ${water}/${waterGoal} glasses!\n\nProper hydration boosts energy, focus, and muscle recovery. Keep it up! 🌟`;
      }
      const left = waterGoal - water;
      return `💧 Hydration Status: ${water}/${waterGoal} glasses\n\n${left} more glass${left > 1 ? 'es' : ''} to go! Staying hydrated:\n• Boosts energy by 25%\n• Speeds up muscle recovery\n• Improves focus\n\nDrink up! 🥛`;
    }

    // Streak
    if (matches(t, ['streak', 'day streak', 'consecutive', 'how long'])) {
      if (streak === 0) return `You don't have a streak yet! Complete all ${totalTasks} tasks today to start your first streak! 🔥`;
      if (streak < 3) return `🔥 You're on a ${streak}-day streak!\n\nJust getting started — keep going! Hit ${3 - streak} more days to earn the 3-Day Warrior badge! 💪`;
      if (streak < 7) return `🔥 ${streak}-day streak! You're a machine!\n\nOnly ${7 - streak} days left to earn the 7-Day Champion badge! You're SO close! ⚡`;
      return `🏆 LEGENDARY! ${streak}-day streak!\n\nYou're in the top tier of consistency! Your future self thanks you every single day. 🌟\n\n"Discipline is the bridge between goals and accomplishment."`;
    }

    // Calories
    if (matches(t, ['calori', 'burn', 'burned', 'kcal', 'energy'])) {
      const weekWorkouts = workouts.filter(w => (Date.now() - new Date(w.date)) < 7 * 86400000);
      const weekCal = weekWorkouts.reduce((a, w) => a + (w.calories || 0), 0);
      return `🔥 Calorie Burn Today:\n• Steps: ${calories} kcal (${steps.toLocaleString()} steps)\n• This week workouts: ${weekCal} kcal\n\nTotal this week: ${calories + weekCal} kcal 💪\n\nKeep moving to burn more!`;
    }

    // Motivation
    if (matches(t, ['motivat', 'tired', 'lazy', 'give up', 'inspire', 'encourage', 'feel like giving up', 'cant', "can't"])) {
      const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      await sendMotivationalNotification(quote);
      return `⚡ POWER BOOST ACTIVATED!\n\n"${quote}"\n\nI just sent you a motivational notification too! 🔥\n\nRemember: You've completed ${completedCount} tasks today. ${remaining > 0 ? `Just ${remaining} more to go!` : 'You already finished everything today! Legend!'}\n\nYOU GOT THIS! 💪`;
    }

    // Today's schedule
    if (matches(t, ['today', 'schedule', 'routine', 'plan', 'task', 'what do i have', 'pending'])) {
      const pending = routine.filter(t => !completed[t.id]);
      const done = routine.filter(t => !!completed[t.id]);
      let reply = `📋 Today's Routine Status:\n\n✅ Completed (${done.length}):\n`;
      done.slice(0, 3).forEach(t => { reply += `  • ${t.icon} ${t.title}\n`; });
      if (done.length > 3) reply += `  ... and ${done.length - 3} more\n`;
      reply += `\n⏳ Pending (${pending.length}):\n`;
      pending.slice(0, 4).forEach(t => { reply += `  • ${t.icon} ${t.title} — ${t.time}\n`; });
      if (pending.length === 0) reply = `🎉 You've crushed ALL tasks today! Absolute legend! 🏆`;
      return reply;
    }

    // Progress summary
    if (matches(t, ['progress', 'stat', 'overview', 'summary', 'how am i', 'how i am doing', 'performance'])) {
      const stepGoal = profile.stepGoal || 8000;
      return `📊 Today's Summary for ${profile.name}:\n\n✅ Tasks: ${completedCount}/${totalTasks} (${Math.round((completedCount/totalTasks)*100)}%)\n👟 Steps: ${steps.toLocaleString()}/${stepGoal.toLocaleString()} (${Math.round((steps/stepGoal)*100)}%)\n💧 Water: ${water}/${profile.waterGoal || 8} glasses\n🔥 Streak: ${streak} days\n⚡ Calories: ${calories} kcal burned\n\n${completedCount === totalTasks ? "🎉 Day complete! You're a champion!" : `Keep going! ${remaining} task${remaining > 1 ? 's' : ''} left!`}`;
    }

    // Workout advice
    if (matches(t, ['squat', 'pushup', 'plank', 'workout advice', 'exercise advice', 'how to', 'form', 'tip'])) {
      return `💡 Workout Tips:\n\n💪 Push-ups: Keep back straight, elbows at 45°\n🦵 Squats: Feet shoulder-width, knees over toes\n🧘 Plank: Engage core, don't let hips drop\n⛰️ Mountain Climbers: Keep hips level, drive knees fast\n\nAlways warm up first! 5 min light cardio.\nRest 60-90 sec between sets. 💪`;
    }

    // Nutrition
    if (matches(t, ['eat', 'food', 'diet', 'nutrition', 'meal', 'breakfast', 'lunch', 'dinner'])) {
      return `🥗 Nutrition Tips for Glow Up:\n\n🌅 Breakfast: Oats + fruits + protein\n☀️ Lunch: Rice/roti + dal + vegetables\n🌙 Dinner: Light — soup, salad, 2 roti\n\n• Avoid: Processed food, sugar, soda\n• Drink: 2-3L water daily\n• Eat 4-5 smaller meals vs 3 big ones\n• Post-workout: Protein within 30 mins 💪`;
    }

    // Sleep
    if (matches(t, ['sleep', 'rest', 'tired', 'fatigue', 'energy'])) {
      return `😴 Sleep is the SECRET weapon of champions!\n\n• 7-9 hours = muscle recovery + fat burn\n• Sleep before midnight for best recovery\n• No screens 1 hour before bed\n• Keep your room cool and dark\n\nYour body BUILDS muscle while you sleep! 💪`;
    }

    // Help
    if (matches(t, ['help', 'what can you do', 'commands', 'guide'])) {
      return `🤖 Here's what I can help with:\n\n👟 "Steps today?" — your step count\n💪 "Pushups left?" — pushup status\n💧 "Water intake?" — hydration check\n🔥 "What's my streak?" — streak info\n📊 "My progress?" — full summary\n⚡ "Motivate me!" — instant power boost\n📋 "Today's schedule" — task list\n🥗 "Nutrition tips" — diet advice\n😴 "Sleep advice" — recovery tips\n\nJust talk naturally! 😊`;
    }

    // Default
    const tips = [
      `I'm not sure about that, but here's a tip: ${MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]} 💪`,
      `Hmm, let me rephrase that! Try asking: "my steps today", "what's my streak", or "motivate me"! 🤖`,
      `I'm still learning! But right now, you're on a ${streak}-day streak with ${completedCount}/${totalTasks} tasks done today. Keep it up! 🔥`,
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }, [routine]);

  const sendMessage = async (text = input.trim()) => {
    if (!text) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}

    const userMsg = makeUser(text);
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setTyping(true);

    setTimeout(async () => {
      const response = await processMessage(text);
      const botMsg = makeBot(response);
      const finalMessages = [...updated, botMsg];
      setMessages(finalMessages);
      setTyping(false);
      await saveChatHistory(finalMessages);
    }, TYPING_DELAY);
  };

  const clearChat = async () => {
    const welcome = makeBot("Chat cleared! Fresh start! 💪 Ask me anything about your fitness journey!");
    setMessages([welcome]);
    await saveChatHistory([welcome]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <LinearGradient colors={['#0D0A1F', COLORS.bg]} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.botInfo}>
            <Text style={styles.botAvatar}>🤖</Text>
            <View>
              <Text style={styles.botName}>{BOT_NAME}</Text>
              <Text style={styles.botStatus}>
                {typing ? '✍️ typing...' : '🟢 Online'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={typing ? (
          <View style={styles.typingBubble}>
            <Animated.Text style={[styles.typingText, { opacity: typingDots }]}>● ● ●</Animated.Text>
          </View>
        ) : null}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.isBot ? styles.botBubble : styles.userBubble]}>
            {item.isBot && <Text style={styles.bubbleAvatar}>🤖</Text>}
            <View style={[styles.bubbleContent, item.isBot ? styles.botContent : styles.userContent]}>
              <Text style={[styles.bubbleText, item.isBot ? styles.botText : styles.userText]}>
                {item.text}
              </Text>
              <Text style={styles.bubbleTime}>{item.time}</Text>
            </View>
          </View>
        )}
      />

      {/* Quick replies */}
      <View style={styles.quickRow}>
        <FlatList
          horizontal
          data={QUICK_REPLIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SPACING.base, gap: SPACING.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.quickChip} onPress={() => sendMessage(item)}>
              <Text style={styles.quickChipText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your AI coach..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={300}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim()}
          >
            <LinearGradient
              colors={input.trim() ? ['#8B5CF6', '#6D28D9'] : [COLORS.bgCard, COLORS.bgCard]}
              style={styles.sendBtnGrad}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: SPACING.xl, paddingBottom: SPACING.md, paddingHorizontal: SPACING.base },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  botInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  botAvatar: { fontSize: 36 },
  botName: { color: COLORS.textPrimary, fontSize: FONTS.md, fontWeight: '800' },
  botStatus: { color: COLORS.textMuted, fontSize: FONTS.xs, marginTop: 2 },
  clearBtn: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearBtnText: { color: COLORS.textMuted, fontSize: FONTS.sm },
  list: { flex: 1 },
  listContent: { paddingHorizontal: SPACING.base, paddingTop: SPACING.sm, paddingBottom: SPACING.sm },
  bubble: { flexDirection: 'row', marginBottom: SPACING.sm, alignItems: 'flex-end', gap: SPACING.sm },
  botBubble: { justifyContent: 'flex-start' },
  userBubble: { justifyContent: 'flex-end', flexDirection: 'row-reverse' },
  bubbleAvatar: { fontSize: 20, marginBottom: 4 },
  bubbleContent: {
    maxWidth: '80%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  botContent: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.violetGlow,
    borderBottomLeftRadius: 4,
  },
  userContent: {
    backgroundColor: COLORS.violet,
    borderBottomRightRadius: 4,
    ...SHADOWS.violet,
  },
  bubbleText: { fontSize: FONTS.sm, lineHeight: 20 },
  botText: { color: COLORS.textPrimary },
  userText: { color: '#fff' },
  bubbleTime: { color: 'rgba(255,255,255,0.4)', fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  typingText: { color: COLORS.violetLight, fontSize: FONTS.md, letterSpacing: 4 },
  quickRow: { paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  quickChip: {
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.violetGlow,
  },
  quickChipText: { color: COLORS.violetLight, fontSize: FONTS.xs, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: FONTS.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 100,
  },
  sendBtn: { borderRadius: RADIUS.full, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnGrad: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontSize: FONTS.xl, fontWeight: '900' },
});

export default ChatScreen;

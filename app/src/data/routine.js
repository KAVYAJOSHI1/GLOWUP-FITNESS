// Default Glow Up Daily Routine
export const DEFAULT_ROUTINE = [
  { id: '1', time: '05:00', title: 'Wake Up', description: 'Rise & shine — start the day strong!', icon: '🌅', category: 'wellness', notificationEnabled: true, alarm: true },
  { id: '2', time: '05:30', title: 'Warm Water + Dry Fruits', description: 'Hydrate & fuel up with dry fruits', icon: '💧', category: 'nutrition', notificationEnabled: true, alarm: false },
  { id: '3', time: '05:45', title: '4 KM Run + 30 Pushups', description: '4 KM morning run followed by 30 pushups', icon: '🏃', category: 'fitness', notificationEnabled: true, alarm: true },
  { id: '4', time: '08:00', title: 'Breakfast — Black Coffee', description: 'Light breakfast with black coffee', icon: '☕', category: 'nutrition', notificationEnabled: true, alarm: true },
  { id: '5', time: '09:00', title: 'DSA Study + 2L Water', description: 'Deep work: DSA problems + stay hydrated (2L water)', icon: '💻', category: 'study', notificationEnabled: true, alarm: true },
  { id: '6', time: '12:00', title: 'Lunch — Salad + 2 Roti + Chaas', description: 'Balanced lunch: salad, 2 roti/rice, chaas', icon: '🥗', category: 'nutrition', notificationEnabled: true, alarm: true },
  { id: '7', time: '12:30', title: 'Placement Prep', description: 'Placement preparation & interview practice', icon: '📋', category: 'study', notificationEnabled: true, alarm: false },
  { id: '8', time: '16:00', title: 'Workout — 20 Pushups + More', description: 'Afternoon workout session: 20 pushups + exercises', icon: '💪', category: 'fitness', notificationEnabled: true, alarm: true },
  { id: '9', time: '17:00', title: 'Post Workout Meal', description: 'Recover with a nutritious post-workout meal', icon: '🥤', category: 'nutrition', notificationEnabled: true, alarm: true },
  { id: '10', time: '20:00', title: 'Dinner — 2 Roti + Chaas', description: 'Light dinner: 2 roti, chaas', icon: '🍽️', category: 'nutrition', notificationEnabled: true, alarm: true },
  { id: '11', time: '21:00', title: 'Chill Time', description: 'Relax, unwind, and recharge mentally', icon: '😌', category: 'wellness', notificationEnabled: false, alarm: false },
  { id: '12', time: '22:00', title: 'Book Reading / Development', description: 'Read a book or work on development projects', icon: '📖', category: 'study', notificationEnabled: true, alarm: false },
];

export const CATEGORY_COLORS = {
  fitness: { bg: '#FF6B35', light: '#FF6B3520' },
  nutrition: { bg: '#10B981', light: '#10B98120' },
  study: { bg: '#8B5CF6', light: '#8B5CF620' },
  wellness: { bg: '#EC4899', light: '#EC489920' },
};

export const DAILY_STEP_GOAL = 8000;
export const DAILY_WATER_GOAL = 8;

export const WORKOUT_DATABASE = [
  { id: 'w1', name: 'Push-ups', icon: '💪', caloriesPerRep: 0.35, targetReps: 15, targetSets: 3, muscle: 'Chest & Arms', difficulty: 'Beginner' },
  { id: 'w2', name: 'Squats', icon: '🦵', caloriesPerRep: 0.32, targetReps: 20, targetSets: 3, muscle: 'Legs & Glutes', difficulty: 'Beginner' },
  { id: 'w3', name: 'Burpees', icon: '🏋️', caloriesPerRep: 0.5, targetReps: 10, targetSets: 3, muscle: 'Full Body', difficulty: 'Advanced' },
  { id: 'w4', name: 'Plank', icon: '🧘', caloriesPerRep: 0.15, targetReps: 30, targetSets: 3, muscle: 'Core', difficulty: 'Intermediate', isTime: true },
  { id: 'w5', name: 'Lunges', icon: '🏃', caloriesPerRep: 0.28, targetReps: 15, targetSets: 3, muscle: 'Legs', difficulty: 'Beginner' },
  { id: 'w6', name: 'Mountain Climbers', icon: '⛰️', caloriesPerRep: 0.18, targetReps: 20, targetSets: 3, muscle: 'Core & Cardio', difficulty: 'Intermediate' },
  { id: 'w7', name: 'Jumping Jacks', icon: '⚡', caloriesPerRep: 0.1, targetReps: 30, targetSets: 3, muscle: 'Full Body Cardio', difficulty: 'Beginner' },
  { id: 'w8', name: 'Tricep Dips', icon: '💪', caloriesPerRep: 0.3, targetReps: 12, targetSets: 3, muscle: 'Triceps', difficulty: 'Intermediate' },
];

export const ACHIEVEMENTS = [
  { id: 'a1', title: '🔥 First Flame', desc: 'Complete your first day', icon: '🔥', condition: 'first_complete' },
  { id: 'a2', title: '💪 3-Day Warrior', desc: '3 day streak', icon: '💪', condition: 'streak_3' },
  { id: 'a3', title: '🏆 Week Champion', desc: '7 day streak', icon: '🏆', condition: 'streak_7' },
  { id: 'a4', title: '👑 2 Week Legend', desc: '14 day streak', icon: '👑', condition: 'streak_14' },
  { id: 'a5', title: '🚀 Month Master', desc: '30 day streak', icon: '🚀', condition: 'streak_30' },
  { id: 'a6', title: '👟 Step Starter', desc: 'Walk 5,000 steps in a day', icon: '👟', condition: 'steps_5000' },
  { id: 'a7', title: '🏃 Runner', desc: 'Walk 8,000 steps in a day', icon: '🏃', condition: 'steps_8000' },
  { id: 'a8', title: '⚡ Speed Demon', desc: 'Walk 12,000 steps in a day', icon: '⚡', condition: 'steps_12000' },
  { id: 'a9', title: '💧 Hydration Hero', desc: 'Drink 8 glasses in a day', icon: '💧', condition: 'water_8' },
  { id: 'a10', title: '🏋️ Workout Beast', desc: 'Complete 5 workouts', icon: '🏋️', condition: 'workouts_5' },
];

export const MOTIVATIONAL_QUOTES = [
  "You didn't come this far to only come this far. 🔥",
  "Every rep, every step, every choice matters. 💪",
  "Discipline is choosing between what you want now and what you want most.",
  "Your future self is watching you right now. Make them proud.",
  "The grind doesn't stop — and neither do you. 🌟",
  "Small daily improvements over time lead to stunning results.",
  "Wake up. Work out. Be better. Repeat.",
  "Fall in love with the process and the results will come.",
  "You are one workout away from a good mood. 🏃",
  "A year from now you'll wish you had started today.",
  "Pain is temporary. Glory is forever. 🏆",
  "Be the person your dog thinks you are. 🐕",
  "Sweat is just fat crying. 😤",
  "Train insane or remain the same.",
  "The only bad workout is the one that didn't happen.",
];

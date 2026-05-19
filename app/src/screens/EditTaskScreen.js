import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, SafeAreaView, StatusBar, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, getCategoryStyle } from '../theme';

const CATEGORIES = ['fitness', 'nutrition', 'study', 'wellness'];
const ICONS = ['🌅', '💧', '🏃', '☕', '💻', '🥗', '📋', '💪', '🥤', '🍽️', '😌', '📖', '🎯', '🏋️', '🚶', '🧘', '🍎', '💊', '📝', '🎵'];

const EditTaskScreen = ({ route, navigation, routine, onSave }) => {
  const { task, isNew = false } = route.params;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [time, setTime] = useState(task.time);
  const [icon, setIcon] = useState(task.icon);
  const [category, setCategory] = useState(task.category);
  const [notificationEnabled, setNotificationEnabled] = useState(task.notificationEnabled);
  const [alarm, setAlarm] = useState(task.alarm);

  const validateTime = (t) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Missing Info', 'Please enter a task title');
      return;
    }
    if (!validateTime(time)) {
      Alert.alert('Invalid Time', 'Please use HH:MM format (e.g., 05:30)');
      return;
    }

    const updated = {
      ...task,
      title: title.trim(),
      description: description.trim(),
      time,
      icon,
      category,
      notificationEnabled,
      alarm,
    };

    onSave(updated, isNew);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            onSave(null, false, task.id);
            navigation.goBack();
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>{isNew ? '+ New Task' : 'Edit Task'}</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.form}>
            {/* Icon picker */}
            <Text style={styles.label}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
              {ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[styles.iconOption, icon === ic && styles.iconOptionActive]}
                  onPress={() => setIcon(ic)}
                >
                  <Text style={styles.iconOptionText}>{ic}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Title */}
            <Text style={styles.label}>Task Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Morning Run"
              placeholderTextColor={COLORS.textMuted}
              maxLength={50}
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details about this task..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              maxLength={150}
            />

            {/* Time */}
            <Text style={styles.label}>Time (HH:MM) *</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="05:00"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              maxLength={5}
            />

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const catStyle = getCategoryStyle(cat);
                const selected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catOption,
                      selected && { backgroundColor: catStyle.bg, borderColor: catStyle.color },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.catText, selected && { color: catStyle.color }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notification toggle */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>🔔 Notification</Text>
                <Text style={styles.toggleSub}>Get notified at this time daily</Text>
              </View>
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                trackColor={{ false: COLORS.bgCardAlt, true: COLORS.violet }}
                thumbColor={notificationEnabled ? COLORS.violetLight : COLORS.textMuted}
              />
            </View>

            {/* Alarm toggle */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>⏰ Sound Alarm</Text>
                <Text style={styles.toggleSub}>Play sound with notification</Text>
              </View>
              <Switch
                value={alarm}
                onValueChange={setAlarm}
                trackColor={{ false: COLORS.bgCardAlt, true: COLORS.warning }}
                thumbColor={alarm ? '#FCD34D' : COLORS.textMuted}
                disabled={!notificationEnabled}
              />
            </View>

            {/* Save button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>✓ Save Task</Text>
            </TouchableOpacity>

            {/* Delete button */}
            {!isNew && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.85}>
                <Text style={styles.deleteBtnText}>🗑 Delete Task</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 60 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  backBtnText: {
    color: COLORS.violet,
    fontSize: FONTS.base,
    fontWeight: '600',
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.lg,
    fontWeight: '900',
  },
  form: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    gap: 6,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: SPACING.base,
  },
  input: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONTS.base,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  iconScroll: {
    marginBottom: 4,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  iconOptionActive: {
    borderColor: COLORS.violet,
    backgroundColor: COLORS.violetGlow,
  },
  iconOptionText: {
    fontSize: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  catOption: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  catText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sm,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  toggleLabel: {
    color: COLORS.textPrimary,
    fontSize: FONTS.base,
    fontWeight: '700',
  },
  toggleSub: {
    color: COLORS.textMuted,
    fontSize: FONTS.xs,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: COLORS.violet,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base + 2,
    alignItems: 'center',
    marginTop: SPACING.xl,
    ...SHADOWS.violet,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: FONTS.md,
    fontWeight: '800',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  deleteBtnText: {
    color: COLORS.danger,
    fontSize: FONTS.base,
    fontWeight: '700',
  },
});

export default EditTaskScreen;

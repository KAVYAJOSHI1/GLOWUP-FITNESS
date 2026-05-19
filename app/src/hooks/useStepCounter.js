import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { getDateKey, saveSteps, loadSteps } from '../utils/storage';

export const useStepCounter = (stepGoal = 8000, weightKg = 70) => {
  const [steps, setSteps] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const subscriptionRef = useRef(null);
  const baseStepsRef = useRef(0);
  const dateKey = getDateKey();

  useEffect(() => {
    initPedometer();
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []);

  const initPedometer = async () => {
    try {
      // STEP 1: Request runtime permission (critical on Android 10+)
      const { status } = await Pedometer.requestPermissionsAsync();
      setPermissionStatus(status);

      if (status !== 'granted') {
        console.warn('Pedometer permission denied:', status);
        // Fall back to stored steps
        const saved = await loadSteps(dateKey);
        setSteps(saved);
        return;
      }

      // STEP 2: Check sensor availability
      const available = await Pedometer.isAvailableAsync();
      setIsAvailable(available);

      if (!available) {
        console.warn('Pedometer sensor not available on this device.');
        const saved = await loadSteps(dateKey);
        setSteps(saved);
        return;
      }

      // STEP 3: Get historical steps since midnight (today's total)
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();

      try {
        const result = await Pedometer.getStepCountAsync(start, end);
        baseStepsRef.current = result.steps;
        setSteps(result.steps);
        await saveSteps(result.steps, dateKey);
        console.log('Steps since midnight:', result.steps);
      } catch (histErr) {
        console.warn('Could not get historical steps:', histErr);
        // Use stored steps as base
        const saved = await loadSteps(dateKey);
        baseStepsRef.current = saved;
        setSteps(saved);
      }

      // STEP 4: Watch for live step updates
      // watchStepCount gives incremental steps since subscription start
      subscriptionRef.current = Pedometer.watchStepCount((result) => {
        const newTotal = baseStepsRef.current + result.steps;
        setSteps(newTotal);
        saveSteps(newTotal, dateKey); // persist immediately
      });

      console.log('Pedometer live watching started.');
    } catch (e) {
      console.error('Pedometer init failed:', e);
      // Always fall back gracefully
      try {
        const saved = await loadSteps(dateKey);
        setSteps(saved);
      } catch {}
    }
  };

  // Calorie burn using MET formula:
  // Calories = steps × avg_stride_m × body_weight_kg × MET_coefficient
  // Simplified: ≈ 0.04 kcal/step at 70kg, adjusted for actual weight
  const calories = Math.round(steps * 0.04 * (weightKg / 70));

  // Distance: average stride length ≈ 0.762m (30 inches)
  const km = parseFloat((steps * 0.000762).toFixed(2));

  const progress = stepGoal > 0 ? Math.min(steps / stepGoal, 1) : 0;

  return { steps, calories, progress, isAvailable, km, permissionStatus };
};

// Premium GLOWUP Design System v2
export const COLORS = {
  bg: '#08080F',
  bgCard: '#12121F',
  bgCardAlt: '#1A1A2E',
  bgGlass: 'rgba(255,255,255,0.04)',
  bgGlass2: 'rgba(255,255,255,0.07)',

  violet: '#8B5CF6',
  violetLight: '#A78BFA',
  violetDark: '#6D28D9',
  violetGlow: 'rgba(139,92,246,0.25)',
  violetGlow2: 'rgba(139,92,246,0.12)',

  pink: '#EC4899',
  pinkLight: '#F472B6',
  pinkGlow: 'rgba(236,72,153,0.25)',

  cyan: '#06B6D4',
  cyanLight: '#22D3EE',
  cyanGlow: 'rgba(6,182,212,0.25)',

  orange: '#F97316',
  orangeLight: '#FB923C',
  orangeGlow: 'rgba(249,115,22,0.25)',

  success: '#10B981',
  successLight: '#34D399',
  successGlow: 'rgba(16,185,129,0.25)',
  warning: '#F59E0B',
  danger: '#EF4444',

  fitness: '#FF6B35',
  fitnessLight: 'rgba(255,107,53,0.2)',
  nutrition: '#10B981',
  nutritionLight: 'rgba(16,185,129,0.2)',
  study: '#8B5CF6',
  studyLight: 'rgba(139,92,246,0.2)',
  wellness: '#EC4899',
  wellnessLight: 'rgba(236,72,153,0.2)',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#475569',

  border: 'rgba(255,255,255,0.06)',
  borderActive: 'rgba(139,92,246,0.4)',
};

export const FONTS = {
  xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 32, xxxl: 42,
};

export const RADIUS = {
  sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, full: 999,
};

export const SPACING = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48,
};

export const SHADOWS = {
  violet: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  pink: { shadowColor: '#EC4899', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  cyan: { shadowColor: '#06B6D4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  orange: { shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 },
  glow: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
};

export const getCategoryStyle = (category) => {
  const map = {
    fitness: { color: COLORS.fitness, bg: COLORS.fitnessLight },
    nutrition: { color: COLORS.nutrition, bg: COLORS.nutritionLight },
    study: { color: COLORS.study, bg: COLORS.studyLight },
    wellness: { color: COLORS.wellness, bg: COLORS.wellnessLight },
  };
  return map[category] || { color: COLORS.violet, bg: COLORS.violetGlow };
};

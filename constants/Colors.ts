const tintColorLight = '#4F46E5'; // Indigo 600
const tintColorDark = '#818CF8'; // Indigo 400

export default {
  light: {
    text: '#1E293B', // Slate 800
    textSecondary: '#64748B', // Slate 500
    background: '#F8FAFC', // Slate 50
    cardBackground: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#94A3B8', // Slate 400
    tabIconSelected: tintColorLight,
    border: '#E2E8F0', // Slate 200
    success: '#10B981', // Emerald 500
    error: '#EF4444', // Red 500
    warning: '#F59E0B', // Amber 500
    primaryGradient: ['#4F46E5', '#7C3AED'], // Indigo 600 -> Violet 600
  },
  dark: {
    text: '#F1F5F9', // Slate 100
    textSecondary: '#94A3B8', // Slate 400
    background: '#0F172A', // Slate 900
    cardBackground: '#1E293B', // Slate 800
    tint: tintColorDark,
    tabIconDefault: '#64748B', // Slate 500
    tabIconSelected: tintColorDark,
    border: '#334155', // Slate 700
    success: '#34D399', // Emerald 400
    error: '#F87171', // Red 400
    warning: '#FBBF24', // Amber 400
    primaryGradient: ['#6366F1', '#8B5CF6'], // Indigo 500 -> Violet 500
  },
};

/**
 * Orgzilla Design System Tokens
 * "The friendly corporate kaiju that organizes everything"
 * 
 * Usage: Import these tokens for consistent theming across the app
 */

export const colors = {
  // Brand Colors
  primary: {
    DEFAULT: '#FF7A00', // Orange Kaiju
    hover: '#E66D00',
    light: '#FFA347',
    dark: '#CC6200',
  },
  secondary: {
    DEFAULT: '#1A2734', // Night Blue
    hover: '#2A3744',
    light: '#3A4754',
    dark: '#0A1724',
  },
  accent: {
    DEFAULT: '#00C8FF', // Cyan Byte
    hover: '#00B3E6',
    light: '#33D4FF',
    dark: '#0099CC',
  },
  surface: {
    DEFAULT: '#F4F5F7', // Mist Gray
    hover: '#E8EAED',
    light: '#FFFFFF',
    dark: '#E0E2E5',
  },
  
  // Semantic Colors
  error: {
    DEFAULT: '#FF5A5F', // Coral Red
    hover: '#FF3D42',
    light: '#FF8A8E',
    dark: '#CC474B',
  },
  success: {
    DEFAULT: '#00D68F',
    hover: '#00BF81',
    light: '#33E0A4',
    dark: '#00A872',
  },
  warning: {
    DEFAULT: '#FFCC00',
    hover: '#E6B800',
    light: '#FFD633',
    dark: '#CCA300',
  },
  info: {
    DEFAULT: '#00C8FF',
    hover: '#00B3E6',
    light: '#33D4FF',
    dark: '#0099CC',
  },
} as const;

export const typography = {
  fonts: {
    heading: 'Outfit, Outfit Fallback, system-ui, sans-serif',
    body: 'Inter, Inter Fallback, system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
} as const;

export const borderRadius = {
  sm: '0.375rem', // 6px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  '2xl': '1.5rem',// 24px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Brand Personality Guidelines
 */
export const brandPersonality = {
  tone: 'Smart, energetic, humorous, trustworthy',
  approach: 'Professional but approachable',
  tagline: 'The friendly corporate kaiju that organizes everything',
  writingStyle: {
    casing: 'sentence-case', // e.g., "Team management"
    avoid: ['ALL CAPS', 'overly formal language'],
    prefer: ['Action-oriented verbs', 'Clear, direct language', 'Playful touches'],
  },
} as const;

/**
 * Component Variants
 */
export const componentVariants = {
  button: {
    primary: 'bg-primary hover:bg-primary-hover text-white',
    secondary: 'bg-secondary hover:bg-secondary-hover text-white',
    accent: 'bg-accent hover:bg-accent-hover text-secondary',
    ghost: 'hover:bg-surface text-secondary',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  },
  card: {
    default: 'bg-card shadow-md rounded-lg',
    elevated: 'bg-card shadow-lg rounded-xl',
    flat: 'bg-surface border border-border rounded-lg',
  },
  badge: {
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-white',
    accent: 'bg-accent text-secondary',
    success: 'bg-success text-white',
    warning: 'bg-warning text-secondary',
    error: 'bg-error text-white',
  },
} as const;

/**
 * Animation Tokens - Kaiju energy!
 */
export const animations = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// Type exports for TypeScript
export type Color = keyof typeof colors;
export type FontSize = keyof typeof typography.sizes;
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
export type Breakpoint = keyof typeof breakpoints;

# Orgzilla Design System

> "The friendly corporate kaiju that organizes everything"

## Overview

Orgzilla's design system combines professional team management functionality with a playful dinosaur/kaiju mascot theme. The system balances energy and approachability while maintaining trust and clarity.

## Brand Colors

### Primary Palette

- **Orange Kaiju** (`#FF7A00`) - Primary brand color for mascot, CTAs, and key brand elements
- **Night Blue** (`#1A2734`) - Secondary color for backgrounds, text, and base structure
- **Cyan Byte** (`#00C8FF`) - Accent color for icons, hover states, and highlights
- **Mist Gray** (`#F4F5F7`) - Background color for page surfaces

### Semantic Colors

- **Coral Red** (`#FF5A5F`) - Error states and validation messages
- **Success Green** (`#00D68F`) - Success states and confirmations
- **Warning Yellow** (`#FFCC00`) - Warning states and alerts

## Typography

### Font Families

- **Headings**: Outfit (geometric sans-serif) - conveys energy and modernity
- **Body**: Inter (clean, readable) - ensures clarity and accessibility
- **Monospace**: System monospace for code and technical content

### Usage Guidelines

- Use **sentence case** for titles (e.g., "Team management")
- Avoid ALL CAPS to maintain friendly personality
- Headings should use semibold weight (600) by default
- Body text uses normal weight (400) with medium (500) for emphasis

## Brand Personality

### Voice & Tone

- **Smart**: Intelligent solutions without being condescending
- **Energetic**: Active, dynamic, ready to help
- **Humorous**: Playful touches without sacrificing professionalism
- **Trustworthy**: Reliable and secure for business use

### Writing Style

- Action-oriented verbs
- Clear, direct language
- Occasional playful touches (kaiju/dinosaur references)
- Professional but approachable

## Component Patterns

### Buttons

\`\`\`tsx
// Primary - Main actions
<button className="bg-primary hover:bg-primary-hover text-white">

// Secondary - Alternative actions  
<button className="bg-secondary hover:bg-secondary-hover text-white">

// Accent - Highlighted actions
<button className="bg-accent hover:bg-accent-hover text-secondary">
\`\`\`

### Cards

\`\`\`tsx
// Default card
<div className="bg-card shadow-md rounded-lg">

// Elevated card (more prominence)
<div className="bg-card shadow-lg rounded-xl">
\`\`\`

### Typography

\`\`\`tsx
// Headings use font-heading (Outfit)
<h1 className="font-heading text-4xl font-semibold">

// Body text uses font-sans (Inter)
<p className="font-sans text-base leading-relaxed">
\`\`\`

## Accessibility

- Maintain WCAG AA contrast ratios (4.5:1 for normal text)
- Use semantic HTML elements
- Include ARIA labels for interactive elements
- Ensure keyboard navigation support
- Add alt text for all images

## Getting Started

Import design tokens in your components:

\`\`\`typescript
import { colors, typography, spacing } from '@/lib/design-tokens'

// Use with Tailwind classes
<div className="bg-primary text-white rounded-lg">
\`\`\`

Or reference CSS custom properties:

\`\`\`css
.custom-element {
  color: var(--color-primary);
  font-family: var(--font-heading);
}
\`\`\`

## Resources

- Design tokens: `lib/design-tokens.ts`
- Global styles: `app/globals.css`
- Utility functions: `lib/cn.ts`

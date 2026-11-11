// Palette « prune » : fonds blancs, nuances de prune uniquement.
export const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  plumDeep: '#2E1A3B',
  primary: '#5B2A6E',
  primaryPressed: '#4A2259',
  plumMid: '#8A5A9E',
  lilac: '#C7A6D4',
  lilacLight: '#EADCF0',
  primarySoft: '#F3EAF7',
  text: '#2B1B33',
  textSoft: '#3D2C45',
  textMuted: '#6E5A72',
  onDark: '#FFFFFF',
  onDarkMuted: '#D9C6E3',
  border: '#EEE4F2',
  borderStrong: '#E3D3EA',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 10, md: 18, lg: 24, pill: 999 };

// Polices chargées dans src/app/_layout.tsx. Avec une police personnalisée,
// on choisit la graisse par la famille, jamais avec fontWeight.
export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  displayItalic: 'Fraunces_400Regular_Italic',
  body: 'Nunito_400Regular',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
};

export const font = {
  title: 30,
  subtitle: 20,
  body: 16,
  small: 13,
};

export const moods = [
  { value: 1, label: 'Lourde', color: '#CFC4D6', mouth: 'M17 33 Q24 27 31 33' },
  { value: 2, label: 'Bof', color: '#D9C3E2', mouth: 'M17 32 Q24 29.5 31 32' },
  { value: 3, label: 'Ça va', color: '#E6D3EE', mouth: 'M17 31 L31 31' },
  { value: 4, label: 'Bien', color: '#C9A3DA', mouth: 'M17 30 Q24 35 31 30' },
  { value: 5, label: 'Radieuse', color: '#B07CC6', mouth: 'M16 29 Q24 38 32 29' },
] as const;

export type MoodValue = (typeof moods)[number]['value'];

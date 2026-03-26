export const Colors = {
  // Primary palette – matches HTML :root exactly
  saffron:       '#E8892A',
  saffronLight:  '#F5A74B',
  saffronDark:   '#C46C10',
  saffronDeep:   '#8B4513',
  saffron50:     '#FFF7ED',
  saffron100:    '#FFEDD5',

  gold:          '#D4A843',
  goldLight:     '#E8C97A',

  teal:          '#1AAEA3',
  tealLight:     '#2DD4BF',
  tealDeep:      '#0D7A70',

  blue:          '#5B8FD4',
  blueDeep:      '#2C5FA0',

  crimson:       '#DC2626',

  // Backgrounds
  background:    '#0A0A0C',
  background2:   '#0E0F12',

  // Surfaces
  surface:       '#141518',
  surface2:      '#1A1C20',
  surface3:      '#222428',
  surface4:      '#2A2D32',

  // Glass
  glass:         'rgba(20,21,24,0.72)',
  glass2:        'rgba(26,28,32,0.80)',

  // Borders
  border:        'rgba(255,255,255,0.06)',
  border2:       'rgba(255,255,255,0.10)',
  border3:       'rgba(255,255,255,0.16)',

  // Text
  text:          '#F5F3EF',
  textSecondary: '#A8A49C',
  textTertiary:  '#605C54',
  text4:         '#3A3832',
};

export const Typography = {
  display:      'PlayfairDisplay_700Bold',
  body:         'PlusJakartaSans_400Regular',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold:     'PlusJakartaSans_700Bold',
};

// Reusable gradient presets (for LinearGradient)
export const Gradients = {
  saffronPrimary:  ['#E8892A', '#C46C10', '#8B4513'] as string[],
  tealPrimary:     ['#1AAEA3', '#0D7A70'] as string[],
  profileHero:     ['rgba(232,137,42,0.08)', 'rgba(212,168,67,0.04)', 'rgba(26,174,163,0.06)'] as string[],
  cardAccent:      ['rgba(232,137,42,0.05)', 'rgba(26,174,163,0.03)'] as string[],
  navBar:          ['rgba(14,15,18,0.92)', 'rgba(10,10,12,0.98)'] as string[],
};

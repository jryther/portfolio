// Line icons for UI controls, drawn to match the site's contact icons (24px grid,
// round caps, currentColor) so they follow the theme

export const ICONS = {
  game: [
    'M17.3 5H6.7a4 4 0 0 0-3.96 3.43l-.9 6.3A2.6 2.6 0 0 0 6.4 16.9L9 14h6l2.6 2.9a2.6 2.6 0 0 0 4.56-2.17l-.9-6.3A4 4 0 0 0 17.3 5Z',
    'M6.5 9.5v3M5 11h3',
    'M15 10.5h.01M17.5 12h.01',
  ],
  close: ['M18 6 6 18', 'M6 6l12 12'],
  'sound-on': ['M11 5 6 9H3v6h3l5 4V5Z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M18.5 5.5a9 9 0 0 1 0 13'],
  'sound-off': ['M11 5 6 9H3v6h3l5 4V5Z', 'M22 9l-6 6', 'M16 9l6 6'],
  refresh: ['M3 12a9 9 0 1 0 2.64-6.36L3 8', 'M3 3v5h5'],
  trophy: ['M8 21h8', 'M12 17v4', 'M7 4h10v5a5 5 0 0 1-10 0V4Z', 'M17 6h2a2 2 0 0 1 0 4h-2', 'M7 6H5a2 2 0 0 0 0 4h2'],
  play: ['M7 5v14l11-7Z'],
} as const

export type UiIconName = keyof typeof ICONS

export const Palette = {
  bg: 0x0a0a0f,
  panel: 0x14141d,
  panelBright: 0x1c1c2a,
  border: 0x6e1fad,
  accent: 0xb347ff,
  accentBright: 0xe0b0ff,
  hp: 0xff5050,
  xp: 0xb347ff,
  textPrimary: '#f3dcff',
  textSecondary: '#d4c0ec',
  textDim: '#9c83c8',
  textHp: '#ff7070',
  textCrit: '#ffc94a'
};

// Floor at 13px so the smallest in-game labels are still legible after
// the canvas scales up. setResolution is applied globally in main.js.
export function pixelText(size, color = Palette.textPrimary, stroke = 2) {
  const finalSize = Math.max(size, 13);
  return {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    fontSize: finalSize + 'px',
    fontStyle: 'bold',
    color,
    stroke: '#000000',
    strokeThickness: stroke
  };
}

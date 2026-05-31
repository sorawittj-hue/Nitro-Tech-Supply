import React, { useState, useEffect } from 'react';

// Extended color palette for more realistic characters
const C: Record<string, string> = {
  '.': 'transparent',
  // Skin
  'a': '#fcd5b8', // skin light
  'b': '#e8b88a', // skin shadow
  'z': '#d4956b', // skin darker shadow
  // Hair
  'c': '#1a0f06', // very dark brown/black hair
  'd': '#3b2011', // dark brown hair
  'D': '#5c3a1e', // medium brown
  'e': '#e65c00', // orange hair
  'E': '#ff8c33', // bright orange highlight
  // Eyes
  'W': '#ffffff', // eye white
  'X': '#0a0a0a', // pupil black
  // Clothing
  'f': '#0c1220', // very dark suit
  'g': '#1a2540', // dark blue suit
  'G': '#2d3e66', // suit highlight
  'h': '#c41919', // red tie
  'H': '#ff2d2d', // bright red
  'i': '#6d28d9', // purple
  'I': '#8b5cf6', // light purple
  'j': '#daa520', // gold
  'J': '#ffd700', // bright gold
  'k': '#0d6b4f', // dark green
  'K': '#10b981', // bright green
  'l': '#1e40af', // dark blue
  'L': '#3b82f6', // bright blue
  'm': '#4b5563', // medium gray
  'M': '#9ca3af', // light gray
  'n': '#0e7490', // dark cyan
  'N': '#22d3ee', // bright cyan
  'o': '#0a0a0a', // black
  'P': '#f8fafc', // white clothing
  'Q': '#e2e8f0', // off-white
  'R': '#78350f', // dark brown (leather)
  'S': '#92400e', // brown shoes
  'T': '#6366f1', // indigo
};

// Normalize every sprite row to exactly 16 chars
const norm = (rows: string[]): string[] =>
  rows.map(r => r.padEnd(16, '.').slice(0, 16));

// ============================================
// CHARACTER SPRITES - 16 wide, ~20 tall
// Each pixel carefully designed for realism
// ============================================
const SPRITES: Record<string, { frames: string[][] }> = {

  // ==========================================
  // CEO SORAWIT - Crown, dark hair, black suit with red tie
  // ==========================================
  ceo_jay: {
    frames: [
      norm([
        "......JjjJ......",
        ".....JjJJjJ.....",
        "......JJJJ......",
        "....dddddddd....",
        "...dddddddddd...",
        "...ddaaaaaaddd..",
        "...daWXaaWXad...",
        "...daaaabbaa....",
        "....aabbbbaa....",
        ".....aabbaa.....",
        "....ffffhffff...",
        "...fffffhfffff..",
        "..bfffffhfffffb.",
        "..bb.ffffffff.b.",
        ".....ffffffff...",
        "......ffff......",
        "......f..f......",
        "......f..f......",
        ".....SS..SS.....",
      ]),
      norm([
        "......JjjJ......",
        ".....JjJJjJ.....",
        "......JJJJ......",
        "....dddddddd....",
        "...dddddddddd...",
        "...ddaaaaaaddd..",
        "...daWXaaWXad...",
        "...daaaabbaa....",
        "....aabbbbaa....",
        ".....aabbaa.....",
        "....ffffhffff...",
        "...fffffhfffff..",
        "...bffffhffffb..",
        "..bb.ffffffff.b.",
        ".....ffffffff...",
        "......ffff......",
        "......f..f......",
        "......f..f......",
        ".....SS..SS.....",
      ]),
    ]
  },

  // ==========================================
  // XAUGOD - Purple wizard hat, blue robe with gold trim  
  // ==========================================
  xaugod: {
    frames: [
      norm([
        "......iI........",
        ".....iIIi.......",
        "....iIIIIi......",
        "...iIIIIIIi.....",
        "...IIIIIIII.....",
        "....aaaaaaaa....",
        "...aaWXaaWXa....",
        "...aaaaaaaaa....",
        "....aabbbbaa....",
        ".....aaaaaa.....",
        "....llJJJJll....",
        "...lllJJJJlll...",
        "..bllllllllllb..",
        "..bb.llllll.bb..",
        ".....llllll.....",
        "......llll......",
        "......l..l......",
        "......l..l......",
        ".....SS..SS.....",
      ]),
      norm([
        "......iI........",
        ".....iIIi.......",
        "....iIIIIi......",
        "...iIIIIIIi.....",
        "...IIIIIIII.....",
        "....aaaaaaaa....",
        "...aaWXaaWXa....",
        "...aaaaaaaaa....",
        "....aabbbbaa....",
        ".....aaaaaa.....",
        "....llJJJJll....",
        "...lllJJJJlll...",
        "...bllllllllb...",
        "..bb.llllll.bb..",
        ".....llllll.....",
        "......llll......",
        "......l..l......",
        "......l..l......",
        ".....SS..SS.....",
      ]),
    ]
  },

  // ==========================================
  // HOUSEKEEPER BOT - Robotic head, cyan visor, green body
  // ==========================================
  housekeeper: {
    frames: [
      norm([
        "....mmmmmmmm....",
        "...mMMMMMMMmm...",
        "..mmNNNNNNNNmm..",
        "..mmNNNNNNNNmm..",
        "..mmmmmmmmmmmm..",
        "...mmPmmmmPmm...",
        "....mmmmmmmm....",
        ".....mmmmmm.....",
        "....kkkkkkkk....",
        "...kkKKKKKKkk...",
        "..kkkKKKKKKkkk..",
        "..MkkKKKKKKkkM..",
        "..MM.kkkkkk.MM..",
        ".....kkkkkk.....",
        "......kkkk......",
        "......k..k......",
        "......m..m......",
        ".....mm..mm.....",
      ]),
      norm([
        "....mmmmmmmm....",
        "...mMMMMMMMmm...",
        "..mmNNNNNNNNmm..",
        "..mmNNNNNNNNmm..",
        "..mmmmmmmmmmmm..",
        "...mmPmmmmPmm...",
        "....mmmmmmmm....",
        ".....mmmmmm.....",
        "....kkkkkkkk....",
        "...kkKKKKKKkk...",
        "..kkkKKKKKKkkk..",
        "...MkKKKKKKkM...",
        "..MM.kkkkkk.MM..",
        ".....kkkkkk.....",
        "......kkkk......",
        "......k..k......",
        "......m..m......",
        ".....mm..mm.....",
      ]),
    ]
  },

  // ==========================================
  // JING - Brown hair, glasses (purple frames), green shirt
  // ==========================================
  jing: {
    frames: [
      norm([
        "....dddddddd....",
        "...dddddddddd...",
        "...ddddddddddd..",
        "...ddaaaaaaddd..",
        "..TdaWXaTWXadT..",
        "..TTaaaaTaaaTT..",
        "...daaaabbaa....",
        "....aabbbbaa....",
        ".....aaaaaa.....",
        "....kkkkkkkk....",
        "...kkKKKKKKkk...",
        "..bkkKKKKKKkkb..",
        "..bb.kkkkkk.bb..",
        ".....kkkkkk.....",
        "......llll......",
        "......l..l......",
        "......l..l......",
        ".....SS..SS.....",
      ]),
      norm([
        "....dddddddd....",
        "...dddddddddd...",
        "...ddddddddddd..",
        "...ddaaaaaaddd..",
        "..TdaWXaTWXadT..",
        "..TTaaaaTaaaTT..",
        "...daaaabbaa....",
        "....aabbbbaa....",
        ".....aaaaaa.....",
        "....kkkkkkkk....",
        "...kkKKKKKKkk...",
        "...bkKKKKKKkb...",
        "..bb.kkkkkk.bb..",
        ".....kkkkkk.....",
        "......llll......",
        "......l..l......",
        "......l..l......",
        ".....SS..SS.....",
      ]),
    ]
  },

  // ==========================================
  // JOE - Orange hair (creative), blue shirt with pattern
  // ==========================================
  joe: {
    frames: [
      norm([
        "....eeEEEEee....",
        "...eeEEEEEEee...",
        "...eEEEEEEEEe...",
        "...eeaaaaaaeee..",
        "...eaWXaaWXae...",
        "...eaaaaaaaa....",
        "....aabbbbaa....",
        ".....aaaaaa.....",
        "....llllllll....",
        "...llPllllPll...",
        "..bllllllllllb..",
        "..bb.llllll.bb..",
        ".....llllll.....",
        "......llll......",
        "......f..f......",
        "......f..f......",
        ".....SS..SS.....",
      ]),
      norm([
        "....eeEEEEee....",
        "...eeEEEEEEee...",
        "...eEEEEEEEEe...",
        "...eeaaaaaaeee..",
        "...eaWXaaWXae...",
        "...eaaaaaaaa....",
        "....aabbbbaa....",
        ".....aaaaaa.....",
        "....llllllll....",
        "...llPllllPll...",
        "...bllllllllb...",
        "..bb.llllll.bb..",
        ".....llllll.....",
        "......llll......",
        "......f..f......",
        "......f..f......",
        ".....SS..SS.....",
      ]),
    ]
  },

  // ==========================================
  // POLICY - Gray fedora hat, black formal suit, white shirt
  // ==========================================
  policy: {
    frames: [
      norm([
        ".....mmmmm......",
        "....mmmmmmm.....",
        "...mmmmmmmmmm...",
        "....dddddddd....",
        "...ddaaaaaaddd..",
        "...daWXaaWXad...",
        "...daaaaaaaa....",
        "....aabbbbaa....",
        ".....aaaaaa.....",
        "....ffffffPf....",
        "...fffffffPff...",
        "..bfffffffPffb..",
        "..bb.ffffff.bb..",
        ".....ffffff.....",
        "......ffff......",
        "......f..f......",
        "......f..f......",
        ".....oo..oo.....",
      ]),
      norm([
        ".....mmmmm......",
        "....mmmmmmm.....",
        "...mmmmmmmmmm...",
        "....dddddddd....",
        "...ddaaaaaaddd..",
        "...daWXaaWXad...",
        "...daaaaaaaa....",
        "....aabbbbaa....",
        ".....aaaaaa.....",
        "....ffffffPf....",
        "...fffffffPff...",
        "...bffffffPfb...",
        "..bb.ffffff.bb..",
        ".....ffffff.....",
        "......ffff......",
        "......f..f......",
        "......f..f......",
        ".....oo..oo.....",
      ]),
    ]
  },
};

interface PixelCharacterProps {
  spriteId: string;
  size?: number;
  animated?: boolean;
}

export const PixelCharacter: React.FC<PixelCharacterProps> = ({
  spriteId,
  size = 64,
  animated = true,
}) => {
  const [frame, setFrame] = useState(0);
  const data = SPRITES[spriteId] || SPRITES['ceo_jay'];

  useEffect(() => {
    if (!animated || data.frames.length <= 1) return;
    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % data.frames.length);
    }, 700);
    return () => clearInterval(interval);
  }, [animated, data.frames.length]);

  const sprite = data.frames[frame] || data.frames[0];
  const COLS = 16;
  const ROWS = sprite.length;
  const PX = 3; // each pixel block size in SVG units
  const svgW = COLS * PX;
  const svgH = ROWS * PX;

  return (
    <svg
      width={size}
      height={size * (ROWS / COLS)}
      viewBox={`0 0 ${svgW} ${svgH}`}
      style={{ imageRendering: 'pixelated' }}
    >
      {sprite.map((row, y) =>
        row.split('').map((ch, x) => {
          const color = C[ch];
          if (!color || color === 'transparent') return null;
          return (
            <rect
              key={`${y}-${x}`}
              x={x * PX}
              y={y * PX}
              width={PX}
              height={PX}
              fill={color}
            />
          );
        })
      )}
    </svg>
  );
};

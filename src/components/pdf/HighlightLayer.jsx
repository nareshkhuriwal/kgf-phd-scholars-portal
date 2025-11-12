import React from 'react';

// small hex → rgba helper
function hexToRgba(hex, alpha = 0.35) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#FFEB3B');
  const r = m ? parseInt(m[1], 16) : 255;
  const g = m ? parseInt(m[2], 16) : 235;
  const b = m ? parseInt(m[3], 16) : 59;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function HighlightLayer({ pageWidth, pageHeight, highlights, colorHex = '#FFEB3B', alpha = 0.35 }) {
  const bg = hexToRgba(colorHex, alpha);
  const border = hexToRgba(colorHex, Math.min(1, alpha + 0.45));

  return (
    <div className="hl-layer" style={{ width: pageWidth, height: pageHeight }}>
      {highlights.map(h => (
        <div
          key={h.id}
          className="hl-rect"
          style={{
            left: `${h.x}px`,
            top: `${h.y}px`,
            width: `${h.w}px`,
            height: `${h.h}px`,
            background: bg,
            outline: `2px solid ${border}`,
          }}
        />
      ))}
    </div>
  );
}

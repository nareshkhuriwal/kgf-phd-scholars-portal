import React from 'react';

// hex → rgba helper
function hexToRgba(hex, alpha = 0.25) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || 'FFEB3B');
  const r = m ? parseInt(m[1], 16) : 255;
  const g = m ? parseInt(m[2], 16) : 235;
  const b = m ? parseInt(m[3], 16) : 59;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const FALLBACK_STYLE = { color: '#FFEB3B', alpha: 0.25 };

export default function HighlightLayer({
  pageWidth,
  pageHeight,
  highlights = [],
}) {
  return (
    <div
      className="hl-layer"
      style={{
        position: 'absolute',
        inset: 0,
        width: pageWidth,
        height: pageHeight,
        pointerEvents: 'none',
      }}
    >
      {highlights.map((h) => {
        const style = h.style ?? FALLBACK_STYLE;

        const bg = hexToRgba(style.color, style.alpha);
        const border = hexToRgba(
          style.color,
          Math.min(1, style.alpha + 0.45)
        );

        return (
          <div
            key={h.id}
            className="hl-rect"
            style={{
              position: 'absolute',
              left: `${h.x}px`,
              top: `${h.y}px`,
              width: `${h.w}px`,
              height: `${h.h}px`,
              background: bg,
              outline: `2px solid ${border}`,
            }}
          />
        );
      })}
    </div>
  );
}

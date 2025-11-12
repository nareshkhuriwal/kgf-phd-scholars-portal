import React from 'react';

export default function HighlightLayer({ pageWidth, pageHeight, highlights }) {
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
      {highlights.map(h => (
        <div
          key={h.id}
          className="hl-rect"
          style={{
            position: 'absolute',
            left: `${h.x}px`,
            top: `${h.y}px`,
            width: `${h.w}px`,
            height: `${h.h}px`,
          }}
        />
      ))}
    </div>
  );
}

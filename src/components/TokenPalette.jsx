// -------------------------------------------------
// src/components/TokenPalette.jsx
// -------------------------------------------------
import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';

const TOKENS = [
  { key: 'ROL_TABLE', desc: 'Auto-generated Review of Literature table' },
  { key: 'GAPS_LIST', desc: 'Aggregated research gaps (bulleted)' },
  { key: 'OBJECTIVES_LIST', desc: 'Project objectives (bulleted)' },
  { key: 'CITATIONS', desc: 'References list in selected style' },
  { key: 'METHODOLOGY_FLOW', desc: 'Methodology diagram/steps' },
];

export default function TokenPalette({ onInsert }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {TOKENS.map((t) => (
        <Tooltip key={t.key} title={t.desc} placement="top">
          <Chip
            label={`{{${t.key}}}`}
            onClick={() => onInsert && onInsert(`{{${t.key}}}`)}
            variant="outlined"
          />
        </Tooltip>
      ))}
    </Box>
  );
}
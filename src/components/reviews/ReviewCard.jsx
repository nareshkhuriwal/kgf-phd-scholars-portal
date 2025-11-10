// src/components/reviews/ReviewCard.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

export default function ReviewCard({ paper, compact = false }) {
  if (!paper) return null;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.25 }}>
        {paper.title || '-'}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {paper.authors || '-'} • {paper.year || ''}
      </Typography>
      {!compact && (
        <Typography variant="caption" color="text.secondary">
          {paper.doi || ''}
        </Typography>
      )}
    </Box>
  );
}

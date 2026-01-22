// src/components/reviews/ReviewCard.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function ReviewCard({ paper, compact = false }) {
  const navigate = useNavigate();
  if (!paper) return null;

  const handleOpen = () => {
    navigate(`/reviews/${paper.id}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          lineHeight: 1.25,
          cursor: 'pointer',
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'none',
          },
        }}
        onClick={handleOpen}
      >
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

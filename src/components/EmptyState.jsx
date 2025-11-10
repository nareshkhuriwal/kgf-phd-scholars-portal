import React from 'react';
import { Box, Typography } from '@mui/material';

export default function EmptyState({ title="Nothing here yet", hint }) {
  return (
    <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
      <Typography variant="subtitle1" sx={{ mb: .5 }}>{title}</Typography>
      {hint && <Typography variant="body2">{hint}</Typography>}
    </Box>
  );
}

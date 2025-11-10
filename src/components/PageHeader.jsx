import React from 'react';
import { Paper, Box, Typography, Stack } from '@mui/material';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <Paper sx={{ p: 2, mb: 1.5, border: '1px solid #eee', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ lineHeight: 1 }}>{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Stack direction="row" spacing={1}>{actions}</Stack>}
      </Box>
    </Paper>
  );
}

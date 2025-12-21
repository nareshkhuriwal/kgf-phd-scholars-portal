import React from 'react';
import { Paper, Box, Typography, Stack } from '@mui/material';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <Paper
      sx={{
        p: 2,
        mb: 1.5,
        border: '1px solid #eee',
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: {
            xs: 'column',   // mobile
            sm: 'row',      // tablet
            md: 'row',      // desktop
          },
          alignItems: {
            xs: 'flex-start',
            sm: 'center',
          },
          gap: 2,
        }}
      >
        {/* TITLE + SUBTITLE */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <Typography
            variant="h6"
            sx={{
              lineHeight: 1.2,

              // Width control
              maxWidth: {
                xs: '100%',
                sm: '65%',   // tablet constraint
                md: '70%',   // desktop breathing space
              },

              // Mobile-only truncation
              display: {
                xs: '-webkit-box',
                sm: 'block',
              },
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: {
                xs: 3,       // mobile clamp
              },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* ACTIONS */}
        {actions && (
          <Stack
            direction={{
              xs: 'column',  // mobile: stacked
              sm: 'row',     // tablet
              md: 'row',     // desktop
            }}
            spacing={1}
            alignSelf={{
              xs: 'flex-start',
              sm: 'center',
            }}
          >
            {actions}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}

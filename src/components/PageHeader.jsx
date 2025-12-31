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
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        {/* TITLE + SUBTITLE */}
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,   // ✅ critical: allows text to shrink correctly
          }}
        >
          <Typography
            variant="h6"
            sx={{
              lineHeight: 1.25,
              wordBreak: 'break-word',
              fontSize: {
                xs: '1.05rem',   // mobile
                sm: '1.25rem',   // tablet
                md: '1.45rem',   // desktop
              },
              fontWeight: 600,
              // Mobile-only clamp
              display: { xs: '-webkit-box', sm: 'block' },
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: { xs: 3 },
              overflow: 'hidden',
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
            direction="row"
            spacing={1}
            flexShrink={0}   // ✅ prevents actions from shrinking
          >
            {actions}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}

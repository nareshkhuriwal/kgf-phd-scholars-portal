import React from 'react';
import { Box, Paper, Typography, Link as MLink } from '@mui/material';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        // soft gradient similar to site
        background: 'linear-gradient(135deg, #f6f9ff 0%, #f1fff7 100%)'
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 1120, px: { xs: 2, md: 3 } }}>
        {/* Top brand bar */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <MLink href="https://www.khuriwalgroup.com" target="_blank" underline="none">
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: .2 }}>
              Khuriwal Group
            </Typography>
          </MLink>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: .5 }}>
            PHD Scholars Portal
          </Typography>
        </Box>

        <Paper
          elevation={2}
          sx={{
            mx: 'auto',
            p: { xs: 3, md: 4 },
            maxWidth: 480,
            borderRadius: 3,
            border: '1px solid #e9eef5',
            backdropFilter: 'blur(4px)'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: .5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {subtitle}
            </Typography>
          )}

          {children}

          {footer && <Box sx={{ mt: 2 }}>{footer}</Box>}
        </Paper>

        {/* Bottom helpers / link back to site */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <MLink href="https://www.khuriwalgroup.com/company/stock-management" target="_blank" rel="noopener">
            See product details
          </MLink>
        </Box>
      </Box>
    </Box>
  );
}

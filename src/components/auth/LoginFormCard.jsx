import * as React from 'react';
import { Paper, Typography, Box, Stack, TextField, Button, Link, keyframes } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PasswordField from './PasswordField';

export default function LoginFormCard({
  r, errors, loading, errorMsg, handleSubmit, onSubmit
}) {
  return (
    <Paper
      elevation={8}
      sx={{
        position: { md: 'sticky' },
        top: { md: 32 },
        p: 3,
        borderRadius: 3,
        bgcolor: 'background.paper',
        color: 'text.primary'
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Welcome back
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Sign in to your KGF scholar account
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={1.5}>
          <TextField
            label="Email"
            fullWidth
            autoFocus
            error={!!errors.email}
            helperText={errors.email ? 'Email is required' : ''}
            {...r('email', { required: true })}
          />

          <PasswordField
            label="Password"
            error={!!errors.password}
            helperText={errors.password ? 'Password is required' : ''}
            {...r('password', { required: true })}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -0.5 }}>
            <Link component={RouterLink} to="/forgot" underline="hover" variant="body2">
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.2,
              textTransform: 'none',
              fontWeight: 700,
              letterSpacing: 0.2,
              background:
                'linear-gradient(90deg, rgba(4,174,96,1) 0%, rgba(7,133,199,1) 100%)',
              boxShadow: '0 8px 24px rgba(7,133,199,0.35)',
              '&:hover': { opacity: 0.95 }
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>

          {errorMsg && (
            <Typography color="error" sx={{ mt: 0.5 }}>
              {String(errorMsg)}
            </Typography>
          )}

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
            New here?{' '}
            <Link component={RouterLink} to="/register" underline="hover">
              Create an account
            </Link>
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
}
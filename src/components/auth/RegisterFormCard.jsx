import * as React from 'react';
import { Paper, Typography, Box, Stack, TextField, Button, Link, Divider, FormControlLabel, Checkbox } from '@mui/material';
import PasswordField from './PasswordField';
import { Link as RouterLink } from 'react-router-dom';

export default function RegisterFormCard({
  r, errors, loading, errorMsg, handleSubmit, onSubmit, pwd
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
        Create Research Scholar Account
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Join Khuriwal Group — it takes less than a minute.
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={1.5}>
          <TextField label="Full Name" fullWidth error={!!errors.name}
            helperText={errors.name && 'Name is required'} {...r('name', { required: true })} />
          <TextField label="Email" fullWidth error={!!errors.email}
            helperText={errors.email && 'Valid email is required'}
            {...r('email', { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })} />
          <TextField label="Phone (optional)" fullWidth {...r('phone')} />
          <TextField label="Organization (optional)" fullWidth {...r('organization')} />

          <PasswordField label="Password" error={!!errors.password}
            helperText={errors.password ? 'Min 8 characters' : 'Use 8+ characters with letters & numbers'}
            {...r('password', { required: true, minLength: 8 })} />

          <PasswordField label="Confirm Password" error={!!errors.password_confirmation}
            helperText={errors.password_confirmation && 'Passwords must match'}
            {...r('password_confirmation', { required: true, validate: v => v === pwd || 'Passwords must match' })} />

          <FormControlLabel
            control={<Checkbox {...r('terms', { required: true })} />}
            label={<Typography variant="body2">
              I agree to the <Link href="https://www.khuriwalgroup.com" target="_blank" rel="noopener">Terms & Privacy</Link>
            </Typography>}
          />
          {errors.terms && <Typography variant="caption" color="error">You must accept the terms.</Typography>}

          <Button type="submit" variant="contained" disabled={loading}
            sx={{
              py: 1.2, textTransform: 'none', fontWeight: 700, letterSpacing: 0.2,
              background: 'linear-gradient(90deg, rgba(4,174,96,1) 0%, rgba(7,133,199,1) 100%)',
              boxShadow: '0 8px 24px rgba(7,133,199,0.35)', '&:hover': { opacity: 0.95 }
            }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>

          {errorMsg && <Typography color="error" sx={{ mt: 0.5 }}>{String(errorMsg)}</Typography>}

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" underline="hover">Sign in</Link>
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
}

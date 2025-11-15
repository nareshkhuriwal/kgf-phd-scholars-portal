import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Typography,
  Alert,
  LinearProgress,
} from '@mui/material';
import { apiFetch } from '../../services/api';

export default function ForgotPasswordDialog({ open, onClose, defaultEmail = '' }) {
  const [step, setStep] = React.useState(1); // 1 = send OTP, 2 = reset password
  const [email, setEmail] = React.useState(defaultEmail || '');
  const [otp, setOtp] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordConfirmation, setPasswordConfirmation] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const resetLocalState = () => {
    setStep(1);
    setOtp('');
    setPassword('');
    setPasswordConfirmation('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleClose = () => {
    if (loading) return;
    resetLocalState();
    onClose?.();
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Email is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/forgot-password/otp', {
        method: 'POST',
        body: { email: email.trim() },
      });

      setSuccessMsg(
        res.message || 'If an account exists for this email, an OTP has been sent.'
      );
      setStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otp.trim()) {
      setErrorMsg('OTP is required.');
      return;
    }
    if (!password || !passwordConfirmation) {
      setErrorMsg('Please enter and confirm your new password.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== passwordConfirmation) {
      setErrorMsg('Password confirmation does not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/reset-password/otp', {
        method: 'POST',
        body: {
          email: email.trim(),
          otp: otp.trim(),
          password,
          password_confirmation: passwordConfirmation,
        },
      });

      setSuccessMsg(res.message || 'Password has been reset successfully.');

      // After small delay, close dialog
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const title =
    step === 1 ? 'Forgot password' : 'Reset your password';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        {title}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {step === 1
            ? 'Enter your registered email. We will send you a one-time password (OTP).'
            : 'Enter the OTP you received and choose a new password.'}
        </Typography>
      </DialogTitle>

      {loading && <LinearProgress />}

      <DialogContent sx={{ pt: 2 }}>
        {step === 1 ? (
          <form id="forgot-step1-form" onSubmit={handleSendOtp}>
            <Stack spacing={1.5}>
              <TextField
                label="Registered email"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />

              {errorMsg && (
                <Alert severity="error" variant="outlined">
                  {errorMsg}
                </Alert>
              )}

              {successMsg && (
                <Alert severity="success" variant="outlined">
                  {successMsg}
                </Alert>
              )}
            </Stack>
          </form>
        ) : (
          <form id="forgot-step2-form" onSubmit={handleResetPassword}>
            <Stack spacing={1.5}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={email}
                disabled
              />
              <TextField
                label="OTP"
                fullWidth
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputProps={{ maxLength: 6 }}
                required
              />
              <TextField
                label="New password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Minimum 8 characters."
                required
              />
              <TextField
                label="Confirm new password"
                type="password"
                fullWidth
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
              />

              {errorMsg && (
                <Alert severity="error" variant="outlined">
                  {errorMsg}
                </Alert>
              )}

              {successMsg && (
                <Alert severity="success" variant="outlined">
                  {successMsg}
                </Alert>
              )}
            </Stack>
          </form>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>

        {step === 1 ? (
          <Button
            type="submit"
            form="forgot-step1-form"
            variant="contained"
            disabled={loading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Send OTP
          </Button>
        ) : (
          <Button
            type="submit"
            form="forgot-step2-form"
            variant="contained"
            disabled={loading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Reset password
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

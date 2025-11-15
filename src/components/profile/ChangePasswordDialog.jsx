import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Alert,
  LinearProgress,
} from '@mui/material';

import PasswordField from '../auth/PasswordField.jsx'; // adjust path if needed
import {
  changePassword,
  resetChangePasswordStatus,
} from '../../store/settingsSlice';

export default function ChangePasswordDialog({ open, onClose }) {
  const dispatch = useDispatch();

  const {
    changePasswordLoading,
    changePasswordError,
    changePasswordSuccess,
  } = useSelector((s) => s.settings || {});

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [validationError, setValidationError] = React.useState('');

  const handleClose = () => {
    if (changePasswordLoading) return; // avoid closing mid-request

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setValidationError('');

    // clear slice status so next open is clean
    dispatch(resetChangePasswordStatus());

    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    // basic client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setValidationError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setValidationError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError('New password and confirmation do not match.');
      return;
    }

    const payload = {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: confirmPassword,
    };

    const action = await dispatch(changePassword(payload));

    // if fulfilled, auto-close after a short delay
    if (changePassword.fulfilled.match(action)) {
      setTimeout(() => {
        handleClose();
      }, 1000);
    }
  };

  const submitting = changePasswordLoading;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' },
      }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        Change password
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Use a strong, unique password you don’t reuse elsewhere.
        </Typography>
      </DialogTitle>

      {submitting && <LinearProgress />}

      <DialogContent sx={{ pt: 2 }}>
        <form id="change-password-form" onSubmit={handleSubmit}>
          <Stack spacing={1.5}>
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              required
            />
            <PasswordField
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              required
              helperText="Minimum 8 characters; mix letters, numbers, and symbols."
            />
            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              required
            />

            {/* Local validation errors (client side) */}
            {validationError && (
              <Alert severity="error" variant="outlined">
                {validationError}
              </Alert>
            )}

            {/* Server errors from slice */}
            {changePasswordError && (
              <Alert severity="error" variant="outlined">
                {changePasswordError}
              </Alert>
            )}

            {/* Success message */}
            {changePasswordSuccess && (
              <Alert severity="success" variant="outlined">
                {changePasswordSuccess}
              </Alert>
            )}
          </Stack>
        </form>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={handleClose}
          disabled={submitting}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="change-password-form"
          variant="contained"
          disabled={submitting}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Save password
        </Button>
      </DialogActions>
    </Dialog>
  );
}

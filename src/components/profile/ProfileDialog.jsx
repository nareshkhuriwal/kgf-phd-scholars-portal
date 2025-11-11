import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, Alert, Tooltip, Typography
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, updateProfile } from '../../store/profileSlice';
import PasswordField from '../auth/PasswordField';

export default function ProfileDialog({ open, onClose }) {
  const dispatch = useDispatch();
  const { me, loading, error } = useSelector(s => s.profile);

  const [form, setForm] = React.useState({
    name: '', email: '', phone: '', organization: '',
    current_password: '', password: '', password_confirmation: ''
  });

  React.useEffect(() => { if (open) dispatch(fetchMe()); }, [open, dispatch]);
  React.useEffect(() => {
    if (me && open) setForm(f => ({
      ...f,
      name: me.name || '', email: me.email || '',
      phone: me.phone || '', organization: me.organization || ''
    }));
  }, [me, open]);

  const change = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    const payload = { name: form.name, email: form.email, phone: form.phone, organization: form.organization };
    if (form.password) {
      payload.current_password = form.current_password;
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }
    const res = await dispatch(updateProfile(payload));
    if (updateProfile.fulfilled.match(res)) onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Profile</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          {error && <Alert severity="error">{String(error)}</Alert>}
          <TextField label="Full Name" value={form.name} onChange={change('name')} fullWidth />

          {/* Email is visible but locked */}
          <Tooltip title="Email cannot be changed. Contact support to update your login email.">
            <TextField
              label="Email (read-only)"
              value={form.email}
              fullWidth
              InputProps={{ readOnly: true }}
              disabled
            />
          </Tooltip>
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>
            Email is locked for security.
          </Typography>

          <TextField label="Phone" value={form.phone} onChange={change('phone')} fullWidth />
          <TextField label="Organization" value={form.organization} onChange={change('organization')} fullWidth />

          <Alert severity="info">Change password (optional)</Alert>
          <PasswordField label="Current Password" value={form.current_password} onChange={change('current_password')} fullWidth />
          <PasswordField label="New Password" value={form.password} onChange={change('password')} fullWidth />
          <PasswordField label="Confirm New Password" value={form.password_confirmation} onChange={change('password_confirmation')} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={loading}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}

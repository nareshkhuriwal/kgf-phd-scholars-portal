// src/components/supervisors/SupervisorFormDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
} from '@mui/material';

export default function SupervisorFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  saving,
}) {
  const isEdit = Boolean(initialData?.id);

  const [form, setForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    department: '',
    specialization: '',
    notes: '',
  });

  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        employeeId: initialData.employeeId || initialData.employee_id || '',
        department: initialData.department || '',
        specialization: initialData.specialization || '',
        notes: initialData.notes || '',
      });
    } else {
      setForm({
        name: '',
        email: '',
        phone: '',
        employeeId: '',
        department: '',
        specialization: '',
        notes: '',
      });
    }
    setErrors({});
  }, [initialData, open]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Full name is required';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required';
    } else {
      // basic email check
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(form.email.trim())) {
        nextErrors.email = 'Enter a valid email';
      }
    }

    if (!form.employeeId.trim()) {
      nextErrors.employeeId = 'Employee ID is required';
    }

    if (!form.department.trim()) {
      nextErrors.department = 'Department is required';
    }

    return nextErrors;
  };

  const handleSubmit = () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      employeeId: form.employeeId.trim(),
      department: form.department.trim(),
      specialization: form.specialization.trim() || null,
      notes: form.notes.trim() || null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'Edit Supervisor' : 'Add New Supervisor'}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Full Name"
            value={form.name}
            onChange={handleChange('name')}
            fullWidth
            required
            error={Boolean(errors.name)}
            helperText={errors.name}
          />

          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            fullWidth
            required
            error={Boolean(errors.email)}
            helperText={errors.email}
          />

          <TextField
            label="Phone (optional)"
            value={form.phone}
            onChange={handleChange('phone')}
            fullWidth
          />

          {/* Supervisor-specific fields like in RegisterForm (for supervisor role) */}

          <TextField
            label="Employee ID"
            value={form.employeeId}
            onChange={handleChange('employeeId')}
            fullWidth
            required
            error={Boolean(errors.employeeId)}
            helperText={errors.employeeId || 'Required for supervisor accounts'}
          />

          <TextField
            label="Department"
            value={form.department}
            onChange={handleChange('department')}
            fullWidth
            required
            error={Boolean(errors.department)}
            helperText={errors.department || 'Required for supervisor accounts'}
          />

          <TextField
            label="Specialization (optional)"
            placeholder="e.g., Computer Science, Physics"
            value={form.specialization}
            onChange={handleChange('specialization')}
            fullWidth
          />

          <TextField
            label="Notes (optional)"
            value={form.notes}
            onChange={handleChange('notes')}
            fullWidth
            multiline
            minRows={2}
          />

          {saving && (
            <Typography variant="body2" color="text.secondary">
              Saving…
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
        >
          {isEdit ? 'Update Supervisor' : 'Create Supervisor'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

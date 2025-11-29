// src/components/RegisterFormCard.jsx
import * as React from 'react';
import {
  Paper, Typography, Box, Stack, TextField, Button, Link,
  Divider, FormControlLabel, Checkbox, Tabs, Tab, Alert, keyframes,
  Chip, CircularProgress, Snackbar
} from '@mui/material';
import { Person, SupervisorAccount, AdminPanelSettings, CheckCircle } from '@mui/icons-material';
import PasswordField from './PasswordField';
import AdminPaymentModal from './AdminPaymentModal';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  sendRegisterOtp,
  verifyRegisterOtp,
  setEmail as setEmailAction,
  markVerified,
  tickCooldown,
  clearErrors as clearRegisterErrors,
  selectRegisterState,
} from '../../store/registerSlice'; // adjust path if needed
import * as ga from '../../lib/analytics/ga'; // adjust path if needed

// Shimmer animation (direction adjusted)
const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
`;

// Role configuration (unchanged)
const ROLES = [
  {
    value: 'researcher',
    label: 'Researcher',
    icon: <Person />,
    description: 'For PhD scholars and research students',
    gradient: 'linear-gradient(90deg, rgba(4,174,96,1) 0%, rgba(7,133,199,1) 100%)',
    color: '#04AE60'
  },
  {
    value: 'supervisor',
    label: 'Supervisor',
    icon: <SupervisorAccount />,
    description: 'For faculty members supervising research',
    gradient: 'linear-gradient(90deg, rgba(255,152,0,1) 0%, rgba(251,192,45,1) 100%)',
    color: '#FF9800'
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: <AdminPanelSettings />,
    description: 'For university administrators',
    gradient: 'linear-gradient(90deg, rgba(160, 35, 182, 1) 0%, rgba(26, 2, 10, 1) 100%)',
    color: '#9C27B0'
  }
];

export default function RegisterFormCard({
  r, errors, loading, errorMsg, handleSubmit, onSubmit, pwd, setError
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Local UI state
  const [selectedRole, setSelectedRole] = React.useState('researcher');
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const [pendingFormData, setPendingFormData] = React.useState(null);
  const [otpValue, setOtpValue] = React.useState('');
  const [emailLocal, setEmailLocal] = React.useState(''); // local mirror for convenience

  // NEW: track terms checkbox locally (keeps UI quick + lets us enable submit)
  const [termsChecked, setTermsChecked] = React.useState(false);

  // Snackbar state
  const [snackOpen, setSnackOpen] = React.useState(false);
  const [snackMsg, setSnackMsg] = React.useState('');
  const [snackSeverity, setSnackSeverity] = React.useState('success'); // 'success' | 'error' | 'info' | 'warning'

  // Redux register slice state
  const {
    email: registeredEmail,
    sending,
    verifying,
    otpSent,
    emailVerified,
    sendError,
    verifyError,
    resendCooldown,
  } = useSelector(selectRegisterState);

  const currentRole = ROLES.find(role => role.value === selectedRole) || ROLES[0];

  const handleRoleChange = (_e, newValue) => {
    if (newValue) setSelectedRole(newValue);
  };

  // init GA (defensive — ga.initGa() is a no-op if you use static script)
  React.useEffect(() => {
    try {
      ga.initGa();
    } catch (err) {
      // don't break the UI if analytics fails
      if (import.meta.env.DEV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('GA init failed', err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep redux cooldown ticking every second when > 0
  React.useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const iv = setInterval(() => dispatch(tickCooldown()), 1000);
    return () => clearInterval(iv);
  }, [resendCooldown, dispatch]);

  // Ensure local email mirrors registeredEmail when verification completes
  React.useEffect(() => {
    if (emailVerified) {
      // sync local state to authoritative email from redux (if available)
      if (registeredEmail) {
        setEmailLocal(registeredEmail);
      }
      // optionally markVerified action if you want to ensure slice is consistent
      // dispatch(markVerified()); // uncomment if needed to set any slice flags
    }
  }, [emailVerified, registeredEmail, dispatch]);

  // Enhanced submit handler that includes role
  const enhancedOnSubmit = (data) => {
    // Track registration attempt
    try {
      ga.trackEvent('registration_attempt', {
        email: readEmail(),
        role: selectedRole
      });
    } catch (err) {
      if (import.meta.env.DEV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('GA registration_attempt failed', err);
      }
    }

    // if email not verified, block submit and show error
    if (!emailVerified) {
      setError?.('email', { type: 'validate', message: 'Please verify your email before submitting' });
      try {
        ga.trackEvent('registration_blocked_email_unverified', { email: readEmail() });
      } catch (err) { /* ignore analytics errors */ }
      return;
    }

    // Role-specific validation
    if (selectedRole === 'supervisor') {
      if (!data.employeeId?.trim()) {
        setError?.('employeeId', { type: 'required', message: 'Employee ID is required' });
        return;
      }
      if (!data.department?.trim()) {
        setError?.('department', { type: 'required', message: 'Department is required' });
        return;
      }
    }

    // Add role to submission data
    const submissionData = {
      ...data,
      role: selectedRole
    };

    // If admin role, show payment modal instead of directly submitting
    if (selectedRole === 'admin') {
      setPendingFormData(submissionData);
      setPaymentModalOpen(true);
    } else {
      // For researcher and supervisor, submit directly
      // Note: parent should track registration_success / registration_failure
      try {
        // keep analytics lightweight here
        ga.trackEvent('registration_submit', { email: readEmail(), role: selectedRole });
      } catch (err) { /* ignore */ }
      onSubmit(submissionData);
    }
  };

  // Handle starting free trial
  const handleStartTrial = () => {
    if (pendingFormData) {
      // Add trial information to the data
      const dataWithTrial = {
        ...pendingFormData,
        trial: true,
        trial_start_date: new Date().toISOString(),
        trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      };

      setPaymentModalOpen(false);
      setPendingFormData(null);
      onSubmit(dataWithTrial);
    }
  };

  // Handle viewing pricing page
  const handleViewPricing = () => {
    setPaymentModalOpen(false);
    navigate('/pricing');
  };

  // Close modal
  const handleCloseModal = () => {
    setPaymentModalOpen(false);
    setPendingFormData(null);
  };

  // basic email validation
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
  const emailReg = r('email', {
    required: true,
    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
  });

  // helper to read email reliably
  const readEmail = () => {
    const e = (emailLocal || '').trim();
    if (e) return e.toLowerCase();
    const input = document.querySelector('input[name="email"]');
    return (input?.value || '').trim().toLowerCase();
  };

  // Send OTP via redux thunk (shows toast with API message)
  const handleSendOtp = async (force = false) => {
    const email = readEmail();

    if (!isValidEmail(email)) {
      setError?.('email', { type: 'validate', message: 'Enter a valid email' });
      dispatch(clearRegisterErrors?.());
      try { ga.trackEvent('otp_send_invalid_email', { email: email || null }); } catch (err) { /* ignore */ }
      return;
    }

    if (resendCooldown > 0 && !force) {
      try { ga.trackEvent('otp_send_rate_limited', { email }); } catch (err) { /* ignore */ }
      return;
    }

    // ensure slice has correct email
    dispatch(setEmailAction(email));

    // Track user trying to send OTP
    try { ga.trackEvent('otp_send_attempt', { email }); } catch (err) { /* ignore */ }

    const action = await dispatch(sendRegisterOtp({ email }));

    // rejected -> show error
    if (sendRegisterOtp.rejected.match(action)) {
      const msg = (action.payload || action.error?.message) || 'Failed to send OTP';
      setSnackMsg(msg);
      setSnackSeverity('error');
      setSnackOpen(true);
      setError?.('email', { type: 'validate', message: msg });
      try { ga.trackEvent('otp_send_failed', { email, message: msg }); } catch (err) { /* ignore */ }
      return;
    }

    // fulfilled -> handle normal OTP-sent OR already-verified responses
    if (sendRegisterOtp.fulfilled.match(action)) {
      const payload = action.payload || {};
      const msg = (payload.message || '').toString();

      // CASE A: explicit flag from backend that email already verified
      if (payload.verified === true || /already verified/i.test(msg)) {
        // mark slice as verified, hide otp UI and sync local email
        dispatch(markVerified());
        if (payload.email) dispatch(setEmailAction(payload.email));
        setEmailLocal((payload.email || email).toLowerCase());
        setOtpValue('');
        setSnackMsg(payload.message || 'Email already verified. You can proceed.');
        setSnackSeverity('success');
        setSnackOpen(true);
        try { ga.trackEvent('otp_already_verified', { email: (payload.email || email).toLowerCase() }); } catch (err) { /* ignore */ }
        return;
      }

      // CASE B: normal OTP sent response
      const friendly = payload.message || 'If an account exists for this email, a verification code was sent.';
      setSnackMsg(friendly);
      setSnackSeverity('success');
      setSnackOpen(true);
      try { ga.trackEvent('otp_sent', { email, serverMessage: payload.message || null }); } catch (err) { /* ignore */ }
      return;
    }

    // fallback
    setSnackMsg('If an account exists for this email, a verification code was sent.');
    setSnackSeverity('info');
    setSnackOpen(true);
    try { ga.trackEvent('otp_sent_fallback', { email }); } catch (err) { /* ignore */ }
  };


  // Verify OTP via redux thunk (also surfaces server message on failure)
  const handleVerifyOtp = async () => {
    const email = readEmail();

    if (!isValidEmail(email)) {
      setError?.('email', { type: 'validate', message: 'Invalid email' });
      try { ga.trackEvent('otp_verify_invalid_email', { email }); } catch (err) { /* ignore */ }
      return;
    }
    if (!otpValue || otpValue.trim().length < 3) {
      // brief client-side validation
      setError?.('otp', { type: 'required', message: 'Enter OTP' });
      try { ga.trackEvent('otp_verify_invalid_code', { email }); } catch (err) { /* ignore */ }
      return;
    }

    try { ga.trackEvent('otp_verify_attempt', { email }); } catch (err) { /* ignore */ }

    const action = await dispatch(verifyRegisterOtp({ email, otp: otpValue.trim() }));

    if (verifyRegisterOtp.rejected.match(action)) {
      const msg = (action.payload || action.error?.message) || 'OTP verification failed';
      setSnackMsg(msg);
      setSnackSeverity('error');
      setSnackOpen(true);
      setError?.('otp', { type: 'validate', message: msg });
      try { ga.trackEvent('otp_verify_failed', { email, message: msg }); } catch (err) { /* ignore */ }
      return;
    }

    // inside handleVerifyOtp after a successful action
    if (verifyRegisterOtp.fulfilled.match(action)) {
      const payload = action.payload || {};
      const msg = (payload.message || '').toString();

      // If backend tells us it's verified (explicit flag or message), mark verified
      if (payload.verified === true || /verified/i.test(msg)) {
        dispatch(markVerified());
        if (payload.email) dispatch(setEmailAction(payload.email));
        setEmailLocal((payload.email || readEmail()).toLowerCase());
        setOtpValue('');
        setSnackMsg(payload.message || 'Email verified successfully');
        setSnackSeverity('success');
        setSnackOpen(true);
        try { ga.trackEvent('otp_verified', { email: (payload.email || readEmail()).toLowerCase() }); } catch (err) { /* ignore */ }
        return;
      }

      // default behavior (if any other structure)
      setSnackMsg(payload.message || 'Email verified successfully');
      setSnackSeverity('success');
      setSnackOpen(true);
      setOtpValue('');
      try { ga.trackEvent('otp_verified_generic', { email, message: payload.message || null }); } catch (err) { /* ignore */ }
      return;
    }

  };

  // Small UI pieces
  const VerifiedChip = () => (
    <Chip
      icon={<CheckCircle />}
      label="Verified"
      size="small"
      color="success"
      sx={{ ml: 1 }}
    />
  );

  // Decide whether submit should be enabled:
  const canSubmit = !loading && emailVerified && termsChecked;

  // Prepare registered handlers for terms checkbox so we can compose with our local state update
  // We call r('terms', ...) to get react-hook-form register props, then wrap onChange.
  const termsReg = r('terms', { required: true }) || {};
  const composedTermsProps = {
    ...termsReg,
    // Compose onChange so both react-hook-form and our local state update run.
    onChange: (e) => {
      try {
        // call react-hook-form's onChange if it exists
        if (typeof termsReg.onChange === 'function') termsReg.onChange(e);
      } catch (err) {
        /* ignore */
      }
      // update local terms state
      const checked = Boolean(e?.target?.checked);
      setTermsChecked(checked);
      // track accepted terms once checked
      if (checked) {
        try { ga.trackEvent('terms_checked', { email: readEmail() }); } catch (err) { /* ignore */ }
      }
    }
  };

  return (
    <>
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
        {/* Heading */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            mb: 0.5,
            background: 'linear-gradient(135deg, #313132ff 0%, rgba(12, 101, 178, 0.97) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
            animation: `${shimmer} 6s linear infinite`,
            backgroundSize: '200% 100%'
          }}
        >
          Create Account
        </Typography>

        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Join Khuriwal Group — Select your role to get started
        </Typography>

        {/* Role Tabs */}
        <Tabs
          value={selectedRole}
          onChange={handleRoleChange}
          variant="fullWidth"
          sx={{
            mb: 2,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem'
            },
            '& .Mui-selected': {
              color: currentRole.color
            },
            '& .MuiTabs-indicator': {
              backgroundColor: currentRole.color,
              height: 3
            }
          }}
        >
          {ROLES.map(role => (
            <Tab
              key={role.value}
              value={role.value}
              icon={role.icon}
              iconPosition="start"
              label={role.label}
            />
          ))}
        </Tabs>

        {/* Role Info */}
        <Alert
          severity="info"
          icon={currentRole.icon}
          sx={{
            mb: 2.5,
            bgcolor: `${currentRole.color}15`,
            borderLeft: `3px solid ${currentRole.color}`,
            '& .MuiAlert-icon': {
              color: currentRole.color
            }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {currentRole.description}
          </Typography>
        </Alert>

        {/* form */}
        <Box component="form" onSubmit={handleSubmit(enhancedOnSubmit)} noValidate>
          <Stack spacing={1.5}>
            <TextField
              label="Full Name"
              fullWidth
              error={!!errors.name}
              helperText={errors.name && 'Name is required'}
              {...r('name', { required: true })}
            />

            {/* Email + Verify button row */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                '& .verify-btn': { flex: '0 0 auto' },
              }}
            >

              <TextField
                label="Email"
                name="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email ? (errors.email.message || 'Valid email is required') : ''}
                // Compose register onChange with local state + optional redux update
                {...emailReg}
                onChange={(e) => {
                  const val = e.target.value || '';
                  // Update local mirror so the input remains controlled
                  setEmailLocal(val);

                  // Only update redux/email slice if email is not yet verified
                  if (!emailVerified) {
                    dispatch(setEmailAction(val.trim().toLowerCase()));
                  }

                  // Call react-hook-form's onChange so validation works
                  if (typeof emailReg.onChange === 'function') {
                    emailReg.onChange(e);
                  }
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    height: 48,
                    px: 1,
                    alignItems: 'center',
                  },
                  '& .MuiInputLabel-root': { transformOrigin: 'left top' }
                }}
                InputProps={{
                  sx: { height: '100%' },
                  readOnly: !!emailVerified // make read-only once verified
                }}
                value={emailLocal}
              />


              {emailVerified ? (
                <VerifiedChip />
              ) : (
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => handleSendOtp(false)}
                  disabled={sending || verifying}
                  className="verify-btn"
                  sx={{
                    whiteSpace: 'nowrap',
                    minWidth: 140,
                    height: 48,
                    px: 2,
                    alignSelf: 'stretch',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {sending ? <CircularProgress size={18} /> : (resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Verify Email')}
                </Button>
              )}
            </Box>

            {/* OTP input — shown when otpSent is true */}
            {otpSent && !emailVerified && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  label="Enter OTP"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  helperText={verifyError || 'Check your email for the 6-digit code.'}
                  error={!!verifyError}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="contained"
                  onClick={handleVerifyOtp}
                  disabled={verifying}
                  className="verify-btn"
                  sx={{
                    whiteSpace: 'nowrap',
                    minWidth: 140,
                    height: 48,
                    px: 2,
                    alignSelf: 'stretch',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {verifying ? <CircularProgress size={18} /> : 'Verify OTP'}
                </Button>
                <Button
                  variant="text"
                  onClick={() => handleSendOtp(true)}
                  disabled={resendCooldown > 0 || sending}
                  className="verify-btn"
                  sx={{
                    whiteSpace: 'nowrap',
                    minWidth: 140,
                    height: 48,
                    px: 2,
                    alignSelf: 'stretch',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Resend
                </Button>
              </Box>
            )}

            {/* show send/verify errors */}
            {sendError && <Alert severity="error">{sendError}</Alert>}
            {!emailVerified && !otpSent && !sendError && (
              <Typography variant="caption" color="text.secondary">
                We will send a verification code to the email before creating your account.
              </Typography>
            )}

            <TextField
              label="Phone (optional)"
              fullWidth
              {...r('phone')}
            />

            {/* Researcher fields */}
            {selectedRole === 'researcher' && (
              <>
                <TextField
                  label="Research Area (optional)"
                  fullWidth
                  placeholder="e.g., Machine Learning, Quantum Physics"
                  {...r('researchArea')}
                />
                <TextField
                  label="Department (optional)"
                  fullWidth
                  {...r('department')}
                />
              </>
            )}

            {/* Supervisor */}
            {selectedRole === 'supervisor' && (
              <>
                <TextField
                  label="Employee ID"
                  fullWidth
                  required
                  error={!!errors.employeeId}
                  helperText={errors.employeeId?.message || 'Required for supervisor accounts'}
                  {...r('employeeId', { required: 'Employee ID is required' })}
                />
                <TextField
                  label="Department"
                  fullWidth
                  required
                  error={!!errors.department}
                  helperText={errors.department?.message || 'Required for supervisor accounts'}
                  {...r('department', { required: 'Department is required' })}
                />
                <TextField
                  label="Specialization (optional)"
                  fullWidth
                  placeholder="e.g., Computer Science, Physics"
                  {...r('specialization')}
                />
              </>
            )}

            {/* Admin */}
            {selectedRole === 'admin' && (
              <>
                <TextField
                  label="Organization"
                  fullWidth
                  required
                  error={!!errors.organization}
                  helperText={errors.organization && 'Organization is required'}
                  {...r('organization', { required: true })}
                />
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                  🎉 Admin accounts include a <strong>30-day free trial</strong> with full access
                </Alert>
              </>
            )}

            {/* Passwords */}
            <PasswordField
              label="Password"
              error={!!errors.password}
              helperText={
                errors.password
                  ? 'Min 8 characters with letters & numbers'
                  : 'Use 8+ characters with letters & numbers'
              }
              {...r('password', {
                required: true,
                minLength: 8,
                pattern: {
                  value: /^(?=.*[A-Za-z])(?=.*\d)/,
                  message: 'Must contain letters and numbers'
                }
              })}
            />

            <PasswordField
              label="Confirm Password"
              error={!!errors.password_confirmation}
              helperText={errors.password_confirmation && 'Passwords must match'}
              {...r('password_confirmation', {
                required: true,
                validate: v => v === pwd || 'Passwords must match'
              })}
            />

            {/* Terms */}
            <FormControlLabel
              control={
                <Checkbox
                  // use composed props so react-hook-form and our state both update
                  {...composedTermsProps}
                  sx={{
                    color: currentRole.color,
                    '&.Mui-checked': { color: currentRole.color }
                  }}
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Link
                    href="https://www.khuriwalgroup.com"
                    target="_blank"
                    rel="noopener"
                    sx={{ color: currentRole.color }}
                  >
                    Terms & Privacy
                  </Link>
                </Typography>
              }
            />
            {errors.terms && (
              <Typography variant="caption" color="error">
                You must accept the terms.
              </Typography>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              disabled={!canSubmit} // NEW: disabled until terms checked AND email verified (and not loading)
              sx={{
                py: 1.2,
                textTransform: 'none',
                fontWeight: 700,
                letterSpacing: 0.2,
                background: currentRole.gradient,
                boxShadow: `0 8px 24px ${currentRole.color}35`,
                '&:hover': { opacity: 0.95, boxShadow: `0 12px 28px ${currentRole.color}45` },
                '&:disabled': { background: '#ccc', boxShadow: 'none' },
                transition: 'all 0.3s ease'
              }}
            >
              {loading
                ? `Creating ${currentRole.label} account…`
                : selectedRole === 'admin'
                  ? 'Continue to Trial →'
                  : `Create ${currentRole.label} Account`
              }
            </Button>

            {errorMsg && (<Alert severity="error">{String(errorMsg)}</Alert>)}

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" underline="hover" sx={{ color: currentRole.color, fontWeight: 600 }}>
                Sign in
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>

      <AdminPaymentModal
        open={paymentModalOpen}
        onClose={handleCloseModal}
        onStartTrial={handleStartTrial}
        onViewPricing={handleViewPricing}
        loading={loading}
      />

      {/* Snackbar for API messages */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: '100%' }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </>
  );
}

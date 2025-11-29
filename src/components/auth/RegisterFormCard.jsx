import * as React from 'react';
import { 
  Paper, Typography, Box, Stack, TextField, Button, Link, 
  Divider, FormControlLabel, Checkbox, Tabs, Tab, Alert, keyframes
} from '@mui/material';
import { Person, SupervisorAccount, AdminPanelSettings } from '@mui/icons-material';
import PasswordField from './PasswordField';
import AdminPaymentModal from './AdminPaymentModal';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// Shimmer animation (direction adjusted)
const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
`;

// Role configuration
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
  const [selectedRole, setSelectedRole] = React.useState('researcher');
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);
  const [pendingFormData, setPendingFormData] = React.useState(null);
  const navigate = useNavigate();
  
  const currentRole = ROLES.find(role => role.value === selectedRole);

  const handleRoleChange = (event, newValue) => {
    setSelectedRole(newValue);
  };

  // Enhanced submit handler that includes role
  const enhancedOnSubmit = (data) => {

    console.log('Form data on submit:', data);
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
        trialStartDate: new Date().toISOString(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      };

      console.log('Submitting with trial data:', dataWithTrial);
      
      setPaymentModalOpen(false);
    onSubmit(dataWithTrial);
    }
  };

  // Handle viewing pricing page
  const handleViewPricing = () => {
    setPaymentModalOpen(false);
    // Navigate to pricing page (adjust route as needed)
    navigate('/pricing');
  };

  // Close modal
  const handleCloseModal = () => {
    setPaymentModalOpen(false);
    setPendingFormData(null);
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
        {/* Heading with gradient + shimmer */}
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

        {/* Role Selector Tabs */}
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

        {/* Role Description Alert */}
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

        <Box component="form" onSubmit={handleSubmit(enhancedOnSubmit)} noValidate>
          <Stack spacing={1.5}>
            {/* Common Fields */}
            <TextField 
              label="Full Name" 
              fullWidth 
              error={!!errors.name}
              helperText={errors.name && 'Name is required'} 
              {...r('name', { required: true })} 
            />
            
            <TextField 
              label="Email" 
              fullWidth 
              error={!!errors.email}
              helperText={errors.email && 'Valid email is required'}
              {...r('email', { 
                required: true, 
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
              })} 
            />
            
            <TextField 
              label="Phone (optional)" 
              fullWidth 
              {...r('phone')} 
            />

            {/* Researcher-Specific Fields */}
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

            {/* Supervisor-Specific Fields */}
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

            {/* Admin-Specific Fields */}
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

            {/* Password Fields */}
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

            {/* Terms & Conditions */}
            <FormControlLabel
              control={
                <Checkbox 
                  {...r('terms', { required: true })}
                  sx={{
                    color: currentRole.color,
                    '&.Mui-checked': {
                      color: currentRole.color
                    }
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

            {/* Submit Button */}
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{
                py: 1.2, 
                textTransform: 'none', 
                fontWeight: 700, 
                letterSpacing: 0.2,
                background: currentRole.gradient,
                boxShadow: `0 8px 24px ${currentRole.color}35`,
                '&:hover': { 
                  opacity: 0.95,
                  boxShadow: `0 12px 28px ${currentRole.color}45`
                },
                '&:disabled': {
                  background: '#ccc',
                  boxShadow: 'none'
                },
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

            {/* Error Message */}
            {errorMsg && (
              <Alert severity="error">
                {String(errorMsg)}
              </Alert>
            )}

            <Divider sx={{ my: 1.5 }} />
            
            {/* Sign In Link */}
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <Link 
                component={RouterLink} 
                to="/login" 
                underline="hover"
                sx={{ 
                  color: currentRole.color,
                  fontWeight: 600
                }}
              >
                Sign in
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>

      {/* Admin Payment Modal */}
      <AdminPaymentModal
        open={paymentModalOpen}
        onClose={handleCloseModal}
        onStartTrial={handleStartTrial}
        onViewPricing={handleViewPricing}
        loading={loading}
      />
    </>
  );
}
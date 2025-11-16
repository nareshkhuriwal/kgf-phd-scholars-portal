import * as React from 'react';
import { Paper, Typography, Box, Stack, TextField, Button, Link, keyframes } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PasswordField from './PasswordField';
import ForgotPasswordDialog from './ForgotPasswordDialog'; // 👈 NEW

// Keyframe animations
const fadeInUp = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(20px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const glow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(168, 85, 247, 0.1);
  }
  50% { 
    box-shadow: 0 0 30px rgba(168, 85, 247, 0.5), 0 0 60px rgba(168, 85, 247, 0.2);
  }
`;

export default function LoginFormCard({
  r, errors, loading, errorMsg, handleSubmit, onSubmit
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [forgotOpen, setForgotOpen] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        position: { md: 'sticky' },
        top: { md: 32 },
        p: 4,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
        bgcolor: 'rgba(255, 255, 255, 0.98)',
        border: '1px solid rgba(168, 85, 247, 0.15)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)',
        animation: isVisible ? `${fadeInUp} 0.8s ease-out` : 'none',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 12px 40px rgba(139, 92, 246, 0.25)',
          transform: 'translateY(-4px)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
        }
      }}
    >
      {/* Secure Badge */}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          mb: 2,
          borderRadius: 1.5,
          background: 'linear-gradient(135deg, rgba(45, 64, 174, 0.93) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(207, 208, 233, 0.98)',
          animation: `${fadeInUp} 0.8s ease-out 0.1s backwards`
        }}
      >
        <Typography
          variant="caption"
          sx={{
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontSize: '0.65rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #13193fff 0%, #2a3fc5c3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          🔒 SECURE SIGN-IN
        </Typography>
      </Box>

      {/* Title */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          mb: 0.5,
          background: 'linear-gradient(135deg, #313132ff 0%, rgba(12, 101, 178, 0.97) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em',
          animation: `${shimmer} 6s linear infinite`
        }}
      >
        Welcome back
      </Typography>

      <Typography
        variant="body2"
        sx={{
          mb: 3.5,
          color: '#64748b',
          fontWeight: 400,
          animation: `${fadeInUp} 0.8s ease-out 0.3s backwards`
        }}
      >
        Sign in to your KGF scholar account to continue.
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{
          animation: `${fadeInUp} 0.8s ease-out 0.4s backwards`
        }}
      >
        <Stack spacing={2.5}>
          {/* Email Field */}
          <TextField
            label="Email"
            fullWidth
            autoFocus
            error={!!errors.email}
            helperText={errors.email ? 'Email is required' : ''}
            {...r('email', { required: true })}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#ffffff',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '& fieldset': {
                  borderColor: '#e2e8f0',
                  borderWidth: '1.5px'
                },
                '&:hover fieldset': {
                  borderColor: '#cbd5e1'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#432daeff',
                  borderWidth: '2px',
                  boxShadow: '0 0 0 3px rgba(168, 85, 247, 0.1)'
                },
                '& input': {
                  color: '#1e293b',
                  fontSize: '0.95rem'
                }
              },
              '& .MuiInputLabel-root': {
                color: '#2b5796ff',
                fontWeight: 500,
                '&.Mui-focused': {
                  color: '#4d20a0ff',
                  fontWeight: 600
                }
              },
              '& .MuiFormHelperText-root': {
                marginLeft: 0.5,
                fontSize: '0.75rem'
              }
            }}
          />

          {/* Password Field */}
          <PasswordField
            label="Password"
            error={!!errors.password}
            helperText={errors.password ? 'Password is required' : ''}
            {...r('password', { required: true })}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#ffffff',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '& fieldset': {
                  borderColor: '#e2e8f0',
                  borderWidth: '1.5px'
                },
                '&:hover fieldset': {
                  borderColor: '#cbd5e1'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#5630d2ff',
                  borderWidth: '2px',
                  boxShadow: '0 0 0 3px rgba(168, 85, 247, 0.1)'
                },
                '& input': {
                  color: '#1e293b',
                  fontSize: '0.95rem'
                }
              },
              '& .MuiInputLabel-root': {
                color: '#64748b',
                fontWeight: 500,
                '&.Mui-focused': {
                  color: '#4326a1ff',
                  fontWeight: 600
                }
              },
              '& .MuiIconButton-root': {
                color: '#64748b',
                '&:hover': {
                  color: '#a855f7'
                }
              },
              '& .MuiFormHelperText-root': {
                marginLeft: 0.5,
                fontSize: '0.75rem'
              }
            }}
          />

          {/* Forgot Password Link */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
            <Link
              component="button"
              underline="hover"
              variant="body2"
                onClick={() => setForgotOpen(true)}
              sx={{
                color: '#0f0fdebf',
                fontWeight: 600,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#7c3aed'
                }
              }}
            >
              Forgot password?
            </Link>
          </Box>


          {/* Sign In Button */}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: 0.3,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #666071ff 0%, #182bd7ff 100%)',
              boxShadow: '0 8px 24px rgba(168, 85, 247, 0.4)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                transition: 'left 0.5s ease'
              },
              '&:hover': {
                background: 'linear-gradient(135deg, #915990ff 0%, #1c212eff 100%)',
                boxShadow: '0 12px 32px rgba(40, 33, 68, 0.5)',
                transform: 'translateY(-2px)',
                '&::before': {
                  left: '100%'
                }
              },
              '&:active': {
                transform: 'translateY(0px)'
              },
              '&.Mui-disabled': {
                background: '#e2e8f0',
                color: '#94a3b8'
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                />
                Signing in...
              </Box>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Error Message */}
          {errorMsg && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: '#fef2f2',
                border: '1.5px solid #fecaca',
                animation: `${fadeInUp} 0.3s ease-out`
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#dc2626',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '0.875rem'
                }}
              >
                ⚠️ {String(errorMsg)}
              </Typography>
            </Box>
          )}

          {/* Create Account Link */}
          <Box
            sx={{
              textAlign: 'center',
              pt: 2,
              borderTop: '1.5px solid #f1f5f9'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontSize: '0.875rem'
              }}
            >
              New here?{' '}
              <Link
                component={RouterLink}
                to="/register"
                underline="hover"
                sx={{
                  background: 'linear-gradient(135deg, #167190ff 0%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1916cbff 0%, #1b24d0cb 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }
                }}
              >
                Create an account
              </Link>
            </Typography>
          </Box>
        </Stack>

        {/* Forgot password OTP flow dialog */}
      <ForgotPasswordDialog
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        // optional: can pass defaultEmail here later if needed
      />

      </Box>
    </Paper>
      
              )}

// src/pages/Login.jsx
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Typography, Stack, Fade, Slide } from '@mui/material';

import SiteHeader from '../components/site/SiteHeader';
import LeftFeatures from '../components/site/LeftFeatures';
import LoginFormCard from '../components/auth/LoginFormCard';
import { loginThunk } from '../store/authSlice';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector(s => s.auth || {});
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (token) navigate('/dashboard', { replace: true });
  }, [token, navigate]);

  const onSubmit = async ({ email, password }) => {
    try {
      await dispatch(loginThunk({ email, password })).unwrap();
      navigate('/dashboard', { replace: true });
    } catch {}
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(14, 165, 233, 0.1) 0%, transparent 40%)
          `,
          animation: 'pulse 8s ease-in-out infinite',
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
      }}
    >
      {/* Animated gradient orbs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'float 15s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(-30px, 30px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'float 20s ease-in-out infinite reverse',
        }}
      />

      {/* Dot pattern overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          opacity: 0.5,
        }}
      />

      <SiteHeader />

      <Grid
        container
        spacing={0}
        sx={{ 
          minHeight: 'calc(100vh - 64px - 36px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Left: product features (60%) */}
        <Grid item xs={12} md={8} sx={{ px: { xs: 2, md: 6 }, py: { xs: 4, md: 8 } }}>
          <Fade in={mounted} timeout={800}>
            <Box>
              <LeftFeatures />
            </Box>
          </Fade>
        </Grid>

        {/* Right: full-height branded panel (40%) */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              height: '100%',
              minHeight: { xs: 520, md: '100%' },
              display: 'flex',
              alignItems: 'stretch',
              // Professional panel background
              background:
                'linear-gradient(180deg, #ffffff 0%, #f7fafc 60%, #eef4ff 100%)',
              borderLeft: '1px solid rgba(0,0,0,0.06)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '1px',
                background: 'linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.3), transparent)',
              },
            }}
          >
            {/* Glassmorphism background */}
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            />

            {/* Animated gradient accent */}
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(1200px 400px at 120% -10%, rgba(7,133,199,0.10), transparent), radial-gradient(900px 300px at -20% 110%, rgba(4,174,96,0.10), transparent)',
                pointerEvents: 'none',
                animation: 'gradientShift 10s ease-in-out infinite',
                '@keyframes gradientShift': {
                  '0%, 100%': { opacity: 0.5 },
                  '50%': { opacity: 0.8 },
                },
              }}
            />

            {/* Right column content wrapper */}
            <Stack
              sx={{
                width: '100%',
                px: { xs: 2, sm: 4, md: 6 },
                py: { xs: 4, md: 8 },
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
              }}
              spacing={3}
            >
              {/* Small heading / tagline */}
              <Box sx={{ width: '100%', maxWidth: 520 }}>
                <Typography
                  variant="overline"
                  sx={{ color: 'text.secondary', letterSpacing: 1 }}
                >
                  Secure Sign-in
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, lineHeight: 1.1, color: 'text.primary', mb: 2 }}
                >
                  Welcome back
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Sign in to your KGF scholar account to continue.
                </Typography>
              </Box>

              {/* Centered login card */}
              <Box sx={{ width: '100%', maxWidth: 520 }}>
                <LoginFormCard
                  r={register}
                  errors={errors}
                  loading={loading}
                  errorMsg={error}
                  handleSubmit={handleSubmit}
                  onSubmit={onSubmit}
                />
              </Box>

              {/* Optional trust badges / footer note */}
              <Box sx={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Protected by enterprise-grade security & RBAC
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      {/* Footer */}
      <Fade in={mounted} timeout={1000}>
        <Box 
          sx={{ 
            px: { xs: 2, md: 6 }, 
            py: 4, 
            background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9), transparent)',
            position: 'relative',
            zIndex: 1,
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 400,
              letterSpacing: '0.5px',
              transition: 'color 0.3s ease',
              '&:hover': {
                color: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            © {new Date().getFullYear()} / Khuriwal Group Technology — All Rights Reserved.
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}
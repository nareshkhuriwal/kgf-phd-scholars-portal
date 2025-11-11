// src/pages/Login.jsx
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Typography, Stack } from '@mui/material';

import SiteHeader from '../components/site/SiteHeader';
import LeftFeatures from '../components/site/LeftFeatures';
import LoginFormCard from '../components/auth/LoginFormCard';
import { loginThunk } from '../store/authSlice';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector(s => s.auth || {});

  React.useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  const onSubmit = async ({ email, password }) => {
    try {
      await dispatch(loginThunk({ email, password })).unwrap();
      navigate('/', { replace: true });
    } catch {}
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a1032',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
        color: 'white',
      }}
    >
      <SiteHeader />

      <Grid
        container
        spacing={0}
        sx={{ minHeight: 'calc(100vh - 64px - 36px)', /* below both appbars */
              px: { xs: 0, md: 0 }, py: { xs: 0, md: 0 } }}
      >
        {/* Left: product features (60%) */}
        <Grid item xs={12} md={8} sx={{ px: { xs: 2, md: 6 }, py: { xs: 4, md: 8 } }}>
          <LeftFeatures />
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
            }}
          >
            {/* Subtle decorative layer */}
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(1200px 400px at 120% -10%, rgba(7,133,199,0.10), transparent), radial-gradient(900px 300px at -20% 110%, rgba(4,174,96,0.10), transparent)',
                pointerEvents: 'none',
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

      <Box sx={{ px: { xs: 2, md: 6 }, py: 4, bgcolor: '#0b122f' }}>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          © {new Date().getFullYear()} / Khuriwal Group Technology — All Rights Reserved.
        </Typography>
      </Box>
    </Box>
  );
}

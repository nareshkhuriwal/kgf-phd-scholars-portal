import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Typography } from '@mui/material';
import SiteHeader from '../components/site/SiteHeader';
import LeftFeatures from '../components/site/LeftFeatures';
import RegisterFormCard from '../components/auth/RegisterFormCardEmail';

import { registerThunk } from '../store/authSlice';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const pwd = watch('password');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token } = useSelector(s => s.auth || {});

  React.useEffect(() => {
    if (token) navigate('/', { replace: true });
  }, [token, navigate]);

  const onSubmit = async (payload) => {
    try {
      console.log('Registering with payload:', payload);
      await dispatch(registerThunk(payload)).unwrap();
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

      <Grid container spacing={0} sx={{ px: { xs: 2, md: 6 }, py: { xs: 4, md: 8 }, alignItems: 'flex-start' }}>
        {/* Left 60% */}
        <Grid item xs={12} md={8}>
          <LeftFeatures />
        </Grid>

        {/* Right 40% */}
        <Grid item xs={12} md={4} sx={{ pl: { md: 4 }, mt: { xs: 3, md: 0 } }}>
          <RegisterFormCard
            r={register}
            errors={errors}
            loading={loading}
            errorMsg={error}
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            pwd={pwd}
          />
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

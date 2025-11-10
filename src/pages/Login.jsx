// src/pages/Login.jsx
import React from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { loginThunk } from '../store/authSlice'
import { useNavigate } from 'react-router-dom'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, token } = useSelector((s) => s.auth || {})

  // If already logged in, go home
  React.useEffect(() => {
    if (token) navigate('/', { replace: true })
  }, [token, navigate])

  const onSubmit = async ({ email, password }) => {
    try {
      await dispatch(loginThunk({ email, password })).unwrap()
      // token + user are persisted by authSlice; just navigate
      navigate('/', { replace: true })
    } catch (e) {
      // error is already set in slice; no-op here or toast if you want
    }
  }

  return (
    <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh' }}>
      <Paper elevation={2} sx={{ p:4, width: 420, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Admin Login</Typography>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label="Email"
            fullWidth
            sx={{ mb: 2 }}
            autoFocus
            error={!!errors.email}
            helperText={errors.email ? 'Email is required' : ''}
            {...register('email', { required: true })}
          />
          <TextField
            type="password"
            label="Password"
            fullWidth
            sx={{ mb: 2 }}
            error={!!errors.password}
            helperText={errors.password ? 'Password is required' : ''}
            {...register('password', { required: true })}
          />

          <Button variant="contained" fullWidth type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {String(error)}
            </Typography>
          )}
        </form>

        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Tip: In mock mode any email/password works.
        </Typography>
      </Paper>
    </Box>
  )
}

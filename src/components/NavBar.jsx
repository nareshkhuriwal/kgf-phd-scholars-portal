import React from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useSelector(s => s.auth)
  const dispatch = useDispatch()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const hide = location.pathname === '/login'
  if (hide) return null

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PhD Literature Review Admin
          </Typography>
          {token ? (
            <>
              <Button component={Link} to="/" color="inherit">Review Papers</Button>
              <Button component={Link} to="/reports" color="inherit">Reports</Button>
              <Button onClick={handleLogout} color="inherit">Logout</Button>
            </>
          ) : (
            <Button component={Link} to="/login" color="inherit">Login</Button>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  )
}

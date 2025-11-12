// src/layout/Header.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutThunk } from '../store/authSlice';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Stack, Chip, Avatar,
  Menu, MenuItem, Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { SECTIONS } from './constants/navSections';
import logoUrl from '../assets/klogo.png';

import ProfileDialog from '../components/profile/ProfileDialog.jsx';
import SettingsDialog from '../components/settings/SettingsDialog.jsx'; // ✅ fixed path

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user } = useSelector(s => s.auth || {});
  const firstName = (user?.name || user?.email || 'User').split(' ')[0];
  const initials = (user?.name || 'U')
    .split(' ')
    .map(w => w?.[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Avatar menu
  const [menuEl, setMenuEl] = React.useState(null);
  const openMenu = Boolean(menuEl);
  const handleOpen = (e) => setMenuEl(e.currentTarget);
  const handleClose = () => setMenuEl(null);

  // Dialogs
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const openProfile = () => { handleClose(); setProfileOpen(true); };
  const openSettings = () => { handleClose(); setSettingsOpen(true); };

  const handleLogout = async () => {
    handleClose();
    await dispatch(logoutThunk());
    navigate('/login', { replace: true });
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: 0,
          borderBottom: '1px solid #eee'
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: 60 }}>
          <IconButton edge="start" onClick={onToggleSidebar} size="large">
            <MenuIcon />
          </IconButton>

          {/* Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Box
              sx={{
                width: 30, height: 30, mr: 1.25, borderRadius: 1,
                overflow: 'hidden', bgcolor: '#fff'
              }}
            >
              <img src={logoUrl} alt="KGF" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Typography variant="h6" sx={{ mr: 1, fontWeight: 700 }}>
              KGF Scholars
            </Typography>
          </Box>

          {/* Main menus */}
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
            {SECTIONS.map((sec) => {
              const ActiveIcon = sec.Icon;
              const active = location.pathname.startsWith(sec.base);
              return (
                <Chip
                  key={sec.key}
                  icon={<ActiveIcon />}
                  label={sec.label}
                  variant={active ? 'filled' : 'outlined'}
                  color={active ? 'primary' : 'default'}
                  onClick={() => {
                    const first = sec.items?.[0]?.to || sec.base;
                    navigate(first);
                  }}
                  sx={{
                    height: 32,
                    borderRadius: 1.5,
                    '& .MuiChip-label': { px: 1.25, fontWeight: active ? 600 : 500 }
                  }}
                />
              );
            })}
          </Stack>

          {/* User menu */}
          <Box>
            <IconButton
              onClick={handleOpen}
              size="small"
              sx={{ ml: 1, p: 0.5, border: '1px solid #e6e6e6', borderRadius: '24px' }}
            >
              <Avatar sx={{ width: 28, height: 28, fontSize: 13 }}>{initials}</Avatar>
              <Typography sx={{ ml: 1, mr: 1, display: { xs: 'none', sm: 'inline' }, fontWeight: 500 }}>
                {firstName}
              </Typography>
            </IconButton>

            <Menu
              anchorEl={menuEl}
              open={openMenu}
              onClose={handleClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ elevation: 3, sx: { minWidth: 200, borderRadius: 2 } }}
            >
              <MenuItem onClick={openProfile}>
                <PersonIcon fontSize="small" style={{ marginRight: 8 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={openSettings}>
                <SettingsIcon fontSize="small" style={{ marginRight: 8 }} />
                Settings
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" style={{ marginRight: 8 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Dialog mounts */}
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

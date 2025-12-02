// src/layout/Header.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutThunk } from '../store/authSlice';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Box, Stack, Chip, Avatar,
  Menu, MenuItem, Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import LockResetIcon from '@mui/icons-material/LockReset';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import { SECTIONS } from './constants/navSections';
import logoUrl from '../assets/klogo.png';

import ProfileDialog from '../components/profile/ProfileDialog.jsx';
import SettingsDialog from '../components/settings/SettingsDialog.jsx';
import NotificationBell from '../layout/NotificationBell.jsx';
import ChangePasswordDialog from '../components/profile/ChangePasswordDialog.jsx';

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user } = useSelector((s) => s.auth || {});
  const role = user?.role;

  const firstName = (user?.name || user?.email || 'User').split(' ')[0];
  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w?.[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

    const avatarSrc = user?.avatar || null;  

  // Normalize role -> "super_admin", "admin", "supervisor", "researcher", etc.
  const normalizedRole = role
    ? String(role).toLowerCase().replace(/\s+/g, '_')
    : null;

  const roleLabelMap = {
    researcher: 'Researcher',
    supervisor: 'Supervisor',
    admin: 'Admin',
    super_admin: 'Super Admin',
  };
  const roleLabel = normalizedRole ? roleLabelMap[normalizedRole] || role : null;

  // helper: normalize an array of roles for comparison
  const normalizeRoles = (arr) =>
    (Array.isArray(arr) ? arr : []).map(r => String(r).toLowerCase().replace(/\s+/g, '_'));

  const visibleSections = React.useMemo(() => {
    if (!normalizedRole) return SECTIONS;

    return SECTIONS
      .map((sec) => {
        // Determine if section-level roles allow access
        if (Array.isArray(sec.roles) && sec.roles.length > 0) {
          const allowed = normalizeRoles(sec.roles);
          if (!allowed.includes(normalizedRole)) {
            return null; // section blocked
          }
        }

        // Filter items by their roles (if any)
        let visibleItems = (sec.items || []).filter((item) => {
          if (Array.isArray(item.roles) && item.roles.length > 0) {
            const allowed = normalizeRoles(item.roles);
            return allowed.includes(normalizedRole);
          }
          // if item has no roles, keep it visible
          return true;
        });

        // If section has no visible items:
        // - if sec.roles explicitly allowed current user, keep section (may link to sec.base)
        // - otherwise hide the section
        if (visibleItems.length === 0) {
          if (Array.isArray(sec.roles) && sec.roles.length > 0) {
            // sec.roles already checked at top; keep section but with empty items
            visibleItems = [];
          } else {
            // no explicit section role and no visible children → hide section
            return null;
          }
        }

        // Return a shallow copy with filtered items
        return { ...sec, items: visibleItems };
      })
      .filter(Boolean);
  }, [normalizedRole]);

  // Avatar menu
  const [menuEl, setMenuEl] = React.useState(null);
  const openMenu = Boolean(menuEl);
  const handleOpen = (e) => setMenuEl(e.currentTarget);
  const handleClose = () => setMenuEl(null);

  // Dialogs
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [changePwdOpen, setChangePwdOpen] = React.useState(false);

  const openProfile = () => { handleClose(); setProfileOpen(true); };
  const openSettings = () => { handleClose(); setSettingsOpen(true); };
  const openChangePassword = () => { handleClose(); setChangePwdOpen(true); };

  const openUpgrade = () => {
    handleClose();
    navigate('/price');
  };

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
          borderBottom: '1px solid #eee',
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: 60 }}>
          <IconButton edge="start" onClick={onToggleSidebar} size="large">
            <MenuIcon />
          </IconButton>

          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 2,
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': {
                textDecoration: 'none',
                opacity: 0.9,   // optional hover effect
              },
              '&:focus': {
                textDecoration: 'none',
              },
              '&:visited': {
                textDecoration: 'none',
              }
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                mr: 1.25,
                borderRadius: 1,
                overflow: 'hidden',
                bgcolor: '#fff',
              }}
            >
              <img
                src={logoUrl}
                alt="KGF"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>

            <Typography variant="h6" sx={{ mr: 1, fontWeight: 700 }}>
              KGF Scholars
            </Typography>
          </Box>



          {/* Main menus */}
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
            {visibleSections.map((sec) => {
              const ActiveIcon = sec.Icon;
              const active = location.pathname.startsWith(sec.base);

              // choose the first visible item's path if it exists
              const firstVisible = sec.items?.[0];
              const navigateTo = (firstVisible && firstVisible.to) ? firstVisible.to : (sec.base || '/');

              return (
                <Chip
                  key={sec.key}
                  icon={<ActiveIcon />}
                  label={sec.label}
                  variant={active ? 'filled' : 'outlined'}
                  color={active ? 'primary' : 'default'}
                  onClick={() => navigate(navigateTo)}
                  sx={{
                    height: 32,
                    borderRadius: 1.5,
                    '& .MuiChip-label': { px: 1.25, fontWeight: active ? 600 : 500 }
                  }}
                />
              );
            })}
          </Stack>

          {/* Right side: Notifications + User menu */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <NotificationBell />

            {/* User menu */}
            <Box>
              <IconButton
                onClick={handleOpen}
                size="small"
                sx={{ ml: 1, p: 0.5, border: '1px solid #e6e6e6', borderRadius: '24px' }}
              >
                <Avatar sx={{ width: 28, height: 28, fontSize: 13 }} src={avatarSrc}>{initials}</Avatar>
                <Typography
                  sx={{
                    ml: 1,
                    mr: 0.5,
                    display: { xs: 'none', sm: 'inline' },
                    fontWeight: 500
                  }}
                >
                  {firstName}
                </Typography>

                {roleLabel && (
                  <Chip
                    label={roleLabel}
                    size="small"
                    sx={{
                      ml: 0.5,
                      display: { xs: 'none', sm: 'inline-flex' },
                      height: 22,
                      borderRadius: 1.5,
                      fontSize: 11,
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                    color={
                      normalizedRole === 'super_admin'
                        ? 'primary'
                        : normalizedRole === 'admin'
                          ? 'error'
                          : normalizedRole === 'supervisor'
                            ? 'secondary'
                            : 'default'
                    }
                    variant="outlined"
                  />
                )}
              </IconButton>

              <Menu
                anchorEl={menuEl}
                open={openMenu}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ elevation: 3, sx: { minWidth: 240, borderRadius: 2 } }}
              >
                {/* Header info */}
                <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {user?.name || firstName}
                  </Typography>
                  {user?.email && (
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  )}
                  {roleLabel && (
                    <Chip
                      label={roleLabel}
                      size="small"
                      sx={{ mt: 0.75, height: 22, borderRadius: 1.5, fontSize: 11 }}
                      color={
                        normalizedRole === 'super_admin'
                          ? 'primary'
                          : normalizedRole === 'admin'
                            ? 'error'
                            : normalizedRole === 'supervisor'
                              ? 'secondary'
                              : 'default'
                      }
                      variant="outlined"
                    />
                  )}
                </Box>

                <Divider sx={{ my: 0.5 }} />

                {/* Account section */}
                <Box sx={{ px: 2, py: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Account
                  </Typography>
                </Box>

                <MenuItem onClick={openProfile}>
                  <PersonIcon fontSize="small" style={{ marginRight: 8 }} />
                  Profile
                </MenuItem>

                <MenuItem onClick={openUpgrade}>
                  <UpgradeIcon fontSize="small" style={{ marginRight: 8 }} />
                  Upgrade plan
                </MenuItem>

                <MenuItem onClick={openChangePassword}>
                  <LockResetIcon fontSize="small" style={{ marginRight: 8 }} />
                  Change password
                </MenuItem>

                <MenuItem onClick={openSettings}>
                  <SettingsIcon fontSize="small" style={{ marginRight: 8 }} />
                  Settings
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                {/* Session section */}
                <Box sx={{ px: 2, py: 0.5 }}>
                  <Typography variant="caption" color="error.main">
                    Session
                  </Typography>
                </Box>

                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <LogoutIcon fontSize="small" style={{ marginRight: 8 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Dialog mounts */}
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ChangePasswordDialog
        open={changePwdOpen}
        onClose={() => setChangePwdOpen(false)}
      />
    </>
  );
}

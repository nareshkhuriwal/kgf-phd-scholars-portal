// src/layout/Header.jsx
import React from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutThunk } from '../store/authSlice';

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Stack,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import LockResetIcon from '@mui/icons-material/LockReset';
import UpgradeIcon from '@mui/icons-material/Upgrade';

import { SECTIONS } from './constants/navSections';
import logoUrl from '../assets/klogo.png';

import ProfileDialog from '../components/profile/ProfileDialog';
import SettingsDialog from '../components/settings/SettingsDialog';
import ChangePasswordDialog from '../components/profile/ChangePasswordDialog';
import NotificationBell from '../layout/NotificationBell';

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();

  /* ---------------- Responsive breakpoints ---------------- */
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  /* ---------------- Auth ---------------- */
  const { user } = useSelector((s) => s.auth || {});
  const role = user?.role;

  const firstName = (user?.name || user?.email || 'User').split(' ')[0];
  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const normalizedRole = role
    ? role.toLowerCase().replace(/\s+/g, '_')
    : null;

  const roleLabelMap = {
    researcher: 'Researcher',
    supervisor: 'Supervisor',
    admin: 'Admin',
    super_admin: 'Super Admin',
  };

  const roleLabel = normalizedRole
    ? roleLabelMap[normalizedRole] || role
    : null;

  const normalizeRoles = (arr) =>
    (Array.isArray(arr) ? arr : []).map((r) =>
      String(r).toLowerCase().replace(/\s+/g, '_')
    );

  /* ---------------- Visible nav sections ---------------- */
  const visibleSections = React.useMemo(() => {
    if (!normalizedRole) return SECTIONS;

    return SECTIONS.map((sec) => {
      if (sec.roles?.length) {
        if (!normalizeRoles(sec.roles).includes(normalizedRole)) return null;
      }

      const items =
        sec.items?.filter((i) =>
          i.roles?.length
            ? normalizeRoles(i.roles).includes(normalizedRole)
            : true
        ) || [];

      if (!items.length && sec.roles?.length) return { ...sec, items: [] };
      if (!items.length) return null;

      return { ...sec, items };
    }).filter(Boolean);
  }, [normalizedRole]);

  const activeSection = visibleSections.find((s) =>
    location.pathname.startsWith(s.base)
  );

  /* ---------------- Menus & dialogs ---------------- */
  const [userMenuEl, setUserMenuEl] = React.useState(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const [profileOpen, setProfileOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [pwdOpen, setPwdOpen] = React.useState(false);

  const openUserMenu = (e) => setUserMenuEl(e.currentTarget);
  const closeUserMenu = () => setUserMenuEl(null);

  const handleLogout = async () => {
    closeUserMenu();
    await dispatch(logoutThunk());
    navigate('/login', { replace: true });
  };

  /* ======================================================= */
  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: '#fff',
          color: 'text.primary',
          borderBottom: '1px solid #eee',
          boxShadow: 0,
        }}
      >
        <Toolbar
          sx={{
            minHeight: 60,
            gap: 1,
            overflowX: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {/* -------- Left menu -------- */}
          <IconButton
            edge="start"
            onClick={isMobile ? () => setDrawerOpen(true) : onToggleSidebar}
          >
            <MenuIcon />
          </IconButton>

          {/* -------- Logo -------- */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 2,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <Box sx={{ width: 30, height: 30, mr: 1 }}>
              <img
                src={logoUrl}
                alt="KGF"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              KGF Scholars
            </Typography>
          </Box>

          {/* ================= DESKTOP NAV ================= */}
          {(isDesktop || isTablet) && (
  <Box
    sx={{
      flexGrow: 1,
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      '&::-webkit-scrollbar': { height: 6 },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#c1c1c1',
        borderRadius: 8,
      },
    }}
  >
    <Stack direction="row" spacing={1}>
      {visibleSections.map((sec) => {
        const Icon = sec.Icon;
        const active = location.pathname.startsWith(sec.base);
        const target = sec.items?.[0]?.to || sec.base || '/';

        return (
          <Chip
            key={sec.key}
            icon={<Icon />}
            label={sec.label}
            color={active ? 'primary' : 'default'}
            variant={active ? 'filled' : 'outlined'}
            onClick={() => navigate(target)}
            sx={{
              height: 32,
              flexShrink: 0,
              '& .MuiChip-label': {
                px: 1.25,
                fontWeight: active ? 600 : 500,
              },
            }}
          />
        );
      })}
    </Stack>
  </Box>
)}


          {/* -------- Right side -------- */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <NotificationBell />

            <IconButton
              onClick={openUserMenu}
              size="small"
              sx={{ border: '1px solid #e6e6e6', borderRadius: '24px' }}
            >
              <Avatar sx={{ width: 28, height: 28, fontSize: 13 }}>
                {initials}
              </Avatar>
              {!isMobile && (
                <Typography sx={{ ml: 1, fontWeight: 500 }}>
                  {firstName}
                </Typography>
              )}
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* ================= MOBILE DRAWER ================= */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 260, pt: 2 }}>
          <Typography sx={{ px: 2, mb: 1, fontWeight: 700 }}>
            Navigation
          </Typography>
          <List>
            {visibleSections.map((sec) => {
              const Icon = sec.Icon;
              const target = sec.items?.[0]?.to || sec.base || '/';

              return (
                <ListItemButton
                  key={sec.key}
                  selected={location.pathname.startsWith(sec.base)}
                  onClick={() => {
                    navigate(target);
                    setDrawerOpen(false);
                  }}
                >
                  <ListItemIcon>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText primary={sec.label} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* ================= USER MENU ================= */}
      <Menu
        anchorEl={userMenuEl}
        open={Boolean(userMenuEl)}
        onClose={closeUserMenu}
      >
        <MenuItem onClick={() => setProfileOpen(true)}>
          <PersonIcon sx={{ mr: 1 }} /> Profile
        </MenuItem>
        <MenuItem onClick={() => setPwdOpen(true)}>
          <LockResetIcon sx={{ mr: 1 }} /> Change password
        </MenuItem>
        <MenuItem onClick={() => setSettingsOpen(true)}>
          <SettingsIcon sx={{ mr: 1 }} /> Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <LogoutIcon sx={{ mr: 1 }} /> Logout
        </MenuItem>
      </Menu>

      {/* ================= DIALOGS ================= */}
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ChangePasswordDialog open={pwdOpen} onClose={() => setPwdOpen(false)} />
    </>
  );
}

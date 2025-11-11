// src/components/site/SiteHeader.jsx
import * as React from 'react';
import {
  AppBar, Toolbar, Box, Typography, Stack, Link, IconButton, Divider, Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import logo from '../../assets/khuriwal-logo.png';
import googleplay from '../../assets/google-play.png';

const KG_HOME = 'https://www.khuriwalgroup.com';

export default function SiteHeader() {
  const [open, setOpen] = React.useState(false);

  // All nav items point to KhuriwalGroup home
  const NavItem = ({ label, hasDrop }) => (
    <Button
      component="a"
      href={KG_HOME}
      target="_blank"
      rel="noopener"
      endIcon={hasDrop ? <KeyboardArrowDownRounded fontSize="small" /> : null}
      sx={{
        color: 'text.primary',
        fontWeight: 700,
        textTransform: 'none',
        px: 1.5,
        '&:hover': { bgcolor: 'transparent', opacity: 0.8 }
      }}
    >
      {label}
    </Button>
  );

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: (t) => t.zIndex.appBar }}>
      {/* Top strip */}
      <AppBar elevation={0} position="static" sx={{ bgcolor: '#0f1b37' }}>
        <Toolbar
          variant="dense"
          sx={{ minHeight: 36, px: { xs: 2, md: 4 }, color: 'rgba(255,255,255,0.9)' }}
        >
          <Typography variant="body2" sx={{ flex: 1 }}>
            Have Any Questions? : <b>+91-9413875686</b>
          </Typography>

          <Stack direction="row" spacing={3} alignItems="center">
            <Link href={KG_HOME} target="_blank" rel="noopener" underline="hover" color="inherit" variant="body2">
              Sales Department
            </Link>
            <Link href={KG_HOME} target="_blank" rel="noopener" underline="hover" color="inherit" variant="body2">
              Support Department
            </Link>
            <Box
              component="img"
              src={googleplay}
              alt="Get it on Google Play"
              sx={{ height: 26, display: { xs: 'none', sm: 'block' } }}
            />
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Main nav */}
      <AppBar elevation={0} position="static" color="inherit" sx={{ bgcolor: 'white' }}>
        <Toolbar sx={{ minHeight: 64, px: { xs: 2, md: 4 } }}>
          {/* Logo -> home */}
          <Box
            component="a"
            href={KG_HOME}
            target="_blank"
            rel="noopener"
            sx={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <Box component="img" src={logo} alt="KhuriwalGroup" sx={{ height: 34 }} />
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Desktop nav (all to home) */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <NavItem label="WHY KHURIWALGROUP" hasDrop />
            <NavItem label="PRODUCTS" hasDrop />
            <NavItem label="SOLUTIONS" hasDrop />
            <NavItem label="SERVICES" hasDrop />
            <NavItem label="PORTFOLIO" />
            <NavItem label="BLOGS" />
            <NavItem label="CAREER" />
            <NavItem label="CONTACT" />
          </Stack>

          {/* Mobile hamburger (no drawer wired) */}
          <IconButton
            onClick={() => setOpen((v) => !v)}
            sx={{ display: { xs: 'inline-flex', md: 'none' }, ml: 1 }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
        <Divider />
      </AppBar>
    </Box>
  );
}

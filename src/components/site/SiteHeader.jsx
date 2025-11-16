// src/components/site/SiteHeader.jsx
import * as React from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Stack,
  Link,
  IconButton,
  Divider,
  Button,
  Popover,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import logo from '../../assets/khuriwal-logo.png';
import googleplay from '../../assets/google-play.png';

const KG_HOME = 'https://www.khuriwalgroup.com';

export default function SiteHeader() {
  const [open, setOpen] = React.useState(false);
  const [priceAnchorEl, setPriceAnchorEl] = React.useState(null);

  const priceOpen = Boolean(priceAnchorEl);

  const handlePriceClick = (event) => {
    setPriceAnchorEl(event.currentTarget);
  };

  const handlePriceClose = () => {
    setPriceAnchorEl(null);
  };

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
        '&:hover': { bgcolor: 'transparent', opacity: 0.8 },
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
            Have Any Questions? : <b>+91-8875454022</b>
          </Typography>

          <Stack direction="row" spacing={3} alignItems="center">
            <Link
              href={KG_HOME}
              target="_blank"
              rel="noopener"
              underline="hover"
              color="inherit"
              variant="body2"
            >
              Sales Department
            </Link>
            <Link
              href={KG_HOME}
              target="_blank"
              rel="noopener"
              underline="hover"
              color="inherit"
              variant="body2"
            >
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
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            <NavItem label="WHY KHURIWALGROUP" hasDrop />
            <NavItem label="PRODUCTS" hasDrop />

            {/* PRICE dropdown – upgraded to rich popover */}
            <Button
              onClick={handlePriceClick}
              endIcon={<KeyboardArrowDownRounded fontSize="small" />}
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                textTransform: 'none',
                px: 1.5,
                '&:hover': { bgcolor: 'transparent', opacity: 0.8 },
              }}
            >
              PRICE
            </Button>

            <Popover
              open={priceOpen}
              anchorEl={priceAnchorEl}
              onClose={handlePriceClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  px: 2.5,
                  py: 2,
                  borderRadius: 2,
                  boxShadow: 4,
                },
              }}
            >
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Simple pricing for every role
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Start free as a researcher and upgrade when you grow.
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={2}
                sx={{
                  minWidth: 620,
                  maxWidth: 720,
                  alignItems: 'stretch',
                }}
              >
                {/* Researcher card */}
                <Card
                  variant="outlined"
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    bgcolor: '#f7f9fc',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent sx={{ pb: 2.5 }}>
                    <Typography variant="overline" sx={{ fontWeight: 700 }}>
                      Researcher
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                      Free
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Up to 50 papers, 5 reports, 2 collections.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Then <b>₹149</b> for unlimited use.
                    </Typography>
                  </CardContent>
                </Card>

                {/* Supervisor card (highlighted) */}
                <Card
                  variant="outlined"
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    borderWidth: 2,
                    borderColor: 'primary.main',
                    boxShadow: 3,
                    position: 'relative',
                    overflow: 'visible',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Chip
                    label="Most Popular"
                    size="small"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: -10,
                      left: 16,
                      fontSize: 10,
                      height: 22,
                    }}
                  />
                  <CardContent sx={{ pb: 2.5 }}>
                    <Typography variant="overline" sx={{ fontWeight: 700 }}>
                      Supervisor
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                      ₹249
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Includes 50 papers, 3 reports, 2 collections.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Ideal for guiding multiple researchers.
                    </Typography>
                  </CardContent>
                </Card>

                {/* Admin card */}
                <Card
                  variant="outlined"
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent sx={{ pb: 2.5 }}>
                    <Typography variant="overline" sx={{ fontWeight: 700 }}>
                      Admin (University)
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                      ₹499
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Central admin access for your university.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Manage researchers, supervisors & reports in one place.
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Popover>

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

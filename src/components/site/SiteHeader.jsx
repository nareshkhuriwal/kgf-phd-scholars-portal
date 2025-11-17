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
  Slide,
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

            {/* PRICE dropdown – rich popover */}
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
              TransitionComponent={Slide}
              TransitionProps={{ direction: 'down', timeout: 220 }}
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
                  Your research. Your pace. Your plan.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Designed for individuals, guides, and institutions.
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Up to 50 papers, 5 reports, 2 collections.
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Researcher Pro
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upgrade to <b>₹149/month</b> for 200 papers, 20 reports & 10 collections.
                    </Typography>
                  </CardContent>
                </Card>

                {/* Supervisor card */}
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
                  <CardContent sx={{ pb: 2.5 }}>
                    <Typography variant="overline" sx={{ fontWeight: 700 }}>
                      Supervisor
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                      Free
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Review access for 1 researcher with 30 papers, 2 reports, 1 collection.
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Supervisor Pro
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upgrade to <b>₹249/month</b> for up to 6 researchers + all Pro features.
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
                    bgcolor: '#fef7f0',
                  }}
                >
                  <CardContent sx={{ pb: 2.5 }}>
                    <Typography variant="overline" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      Admin (University)
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                      ₹1,999
                      <Typography component="span" variant="body2" color="text.secondary">
                        /month
                      </Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Enterprise-grade solution for universities and large institutions.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1.5 }}>
                      • Unlimited researchers & supervisors<br />
                      • Advanced analytics & reporting<br />
                      • Priority support with SLA<br />
                      • Custom branding options
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
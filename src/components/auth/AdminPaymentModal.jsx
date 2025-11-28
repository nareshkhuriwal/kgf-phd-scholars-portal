import * as React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Slide,
  alpha
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Rocket,
  Shield,
  Support,
  TrendingUp,
  Timer
} from '@mui/icons-material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TRIAL_BENEFITS = [
  { icon: <Rocket />, text: 'Full access to all admin features' },
  { icon: <Shield />, text: 'Advanced security & audit trails' },
  { icon: <Support />, text: 'Priority email support' },
  { icon: <TrendingUp />, text: 'Unlimited users & researchers' }
];

export default function AdminPaymentModal({ open, onClose, onStartTrial, onViewPricing, loading }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          overflow: 'visible'
        }
      }}
    >
      {/* Close button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          color: 'text.secondary',
          zIndex: 1
        }}
      >
        <Close />
      </IconButton>

      <DialogContent sx={{ p: 0, overflow: 'visible' }}>
        {/* Header Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
            color: 'white',
            p: 4,
            pb: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              pointerEvents: 'none'
            }
          }}
        >
          <Stack spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            {/* Trial Badge */}
            <Chip
              icon={<Timer sx={{ color: 'white !important' }} />}
              label="30-Day Free Trial"
              sx={{
                bgcolor: alpha('#fff', 0.25),
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
                px: 1,
                backdropFilter: 'blur(10px)'
              }}
            />

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                textAlign: 'center',
                letterSpacing: '-0.02em'
              }}
            >
              Welcome, Admin! 🎉
            </Typography>

            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                opacity: 0.95,
                maxWidth: 400
              }}
            >
              Start your free trial now and experience the full power of our platform—no credit card required
            </Typography>
          </Stack>
        </Box>

        {/* Benefits Section */}
        <Box sx={{ p: 4, pt: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: 'text.primary'
            }}
          >
            What's included in your trial:
          </Typography>

          <List sx={{ mb: 3 }}>
            {TRIAL_BENEFITS.map((benefit, idx) => (
              <ListItem
                key={idx}
                sx={{
                  px: 0,
                  py: 1,
                  '&:hover': {
                    bgcolor: alpha('#9C27B0', 0.05),
                    borderRadius: 1
                  },
                  transition: 'background-color 0.2s'
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: '#9C27B0'
                  }}
                >
                  <CheckCircle />
                </ListItemIcon>
                <ListItemText
                  primary={benefit.text}
                  primaryTypographyProps={{
                    fontWeight: 500,
                    fontSize: '0.95rem'
                  }}
                />
              </ListItem>
            ))}
          </List>

          {/* Trial Info Alert */}
          <Box
            sx={{
              bgcolor: alpha('#9C27B0', 0.08),
              borderLeft: '4px solid #9C27B0',
              p: 2,
              borderRadius: 1,
              mb: 3
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              💡 <strong>No payment needed now.</strong> Your trial starts immediately and you can upgrade anytime within 30 days.
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Action Buttons */}
          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              onClick={onStartTrial}
              sx={{
                py: 0.5,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                boxShadow: '0 8px 24px rgba(156, 39, 176, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7B1FA2 0%, #6A1B9A 100%)',
                  boxShadow: '0 12px 28px rgba(156, 39, 176, 0.45)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Creating Account...' : 'Start Free Trial →'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={onViewPricing}
              sx={{
                py: 0.01,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                borderColor: '#9C27B0',
                color: '#9C27B0',
                '&:hover': {
                  borderColor: '#7B1FA2',
                  bgcolor: alpha('#9C27B0', 0.05)
                }
              }}
            >
              View Pricing & Upgrade Now
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
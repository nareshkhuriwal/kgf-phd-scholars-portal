// src/pages/Price.jsx
import * as React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';

// Role-specific plan definitions
const ROLE_PLANS = {
  researcher: {
    current: {
      key: 'researcher-current',
      title: 'Researcher',
      price: 'Free',
      subtitle: 'Start free with limited usage.',
      bullets: [
        'Up to 50 papers',
        '5 reports',
        '2 collections',
        'Basic search and filtering',
        'Email support',
      ],
      chip: 'Current plan',
    },
    upgrade: {
      key: 'researcher-upgrade',
      title: 'Researcher Pro',
      price: '₹149',
      subtitle: 'Unlock higher limits for serious work.',
      bullets: [
        'Up to 200 papers',
        '20 reports',
        '10 collections',
        'Advanced search and filtering',
        'Priority email support',
        'Export to multiple formats',
      ],
      chip: 'Upgrade plan',
    },
  },

  supervisor: {
    current: {
      key: 'supervisor-current',
      title: 'Supervisor',
      price: 'Free',
      subtitle: 'Perfect when you are starting with a small team.',
      bullets: [
        'Up to 1 researcher for review',
        'Includes 30 papers',
        '2 reports',
        '1 collection',
        'Basic review and approval workflow',
        'Email notifications',
      ],
      chip: 'Current plan',
    },
    upgrade: {
      key: 'supervisor-upgrade',
      title: 'Supervisor Pro',
      price: '₹249',
      subtitle: 'Scale supervision across more researchers.',
      bullets: [
        'Up to 6 researchers for review',
        'Includes everything in upgraded Researcher plan:',
        '• 200 papers',
        '• 20 reports',
        '• 10 collections',
        'Advanced review and approval workflow',
        'Team collaboration tools',
        'Bulk actions and management',
        'Priority support',
      ],
      chip: 'Upgrade plan',
    },
  },

  admin: {
    current: {
      key: 'admin-current',
      title: 'Admin',
      price: '₹499',
      subtitle: 'Central admin access for your university.',
      bullets: [
        'Paid plan — no free tier for Admin',
        'Central admin access for your university',
        'Manage researchers, supervisors & reports in one place',
        'Unlimited users and researchers',
        'Advanced analytics and reporting',
        'Custom branding options',
        'Dedicated account manager',
        'Priority support with SLA',
      ],
      chip: 'Current plan',
    },
    upgrade: null, // no higher plan
  },
};

export default function PricePage() {
  const user = useSelector((s) => s.auth?.user);
  const role = user?.role || 'researcher';

  const [loading, setLoading] = React.useState(false);
  const [notification, setNotification] = React.useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const { current, upgrade } = ROLE_PLANS[role] || ROLE_PLANS.researcher;
  const roleLabel = current.title;

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle upgrade payment
  const handleUpgrade = async (plan) => {
    try {
      setLoading(true);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Create order on backend (you'll need to implement this API)
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your auth token here
          // 'Authorization': `Bearer ${yourAuthToken}`,
        },
        body: JSON.stringify({
          planKey: plan.key,
          amount: parseInt(plan.price.replace('₹', '')),
          currency: 'INR',
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY_ID', // Replace with your Razorpay key
        amount: orderData.amount, // Amount in paise
        currency: orderData.currency,
        name: 'Research Platform',
        description: `Upgrade to ${plan.title}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // Add your auth token here
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planKey: plan.key,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            setNotification({
              open: true,
              message: `Successfully upgraded to ${plan.title}! Your account will be updated shortly.`,
              severity: 'success',
            });

            // Optionally reload user data or redirect
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (error) {
            setNotification({
              open: true,
              message: 'Payment verification failed. Please contact support.',
              severity: 'error',
            });
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#1976d2',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setNotification({
              open: true,
              message: 'Payment cancelled',
              severity: 'info',
            });
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      setLoading(false);
    } catch (error) {
      console.error('Payment error:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to initiate payment. Please try again.',
        severity: 'error',
      });
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Simple pricing for every role
      </Typography>

      <Typography variant="subtitle1" sx={{ mb: 4, color: 'text.secondary' }}>
        You are currently logged in as <strong>{roleLabel}</strong>.
        {upgrade
          ? ' Compare your current plan with the upgrade below.'
          : ' You are on a paid Admin plan. Contact us if you want to change your subscription.'}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: upgrade
            ? { xs: '1fr', md: '1fr 1fr' }
            : '1fr',
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        {/* Current plan card */}
        <PlanCard
          title={current.title}
          price={current.price}
          subtitle={current.subtitle}
          bullets={current.bullets}
          chipLabel={current.chip}
          buttonLabel="Current plan"
          buttonDisabled
          isCurrent
        />

        {/* Upgrade plan card (if any) */}
        {upgrade && (
          <PlanCard
            title={upgrade.title}
            price={upgrade.price}
            subtitle={upgrade.subtitle}
            bullets={upgrade.bullets}
            chipLabel={upgrade.chip}
            buttonLabel={loading ? 'Processing...' : 'Upgrade plan'}
            isUpgrade
            loading={loading}
            onClick={() => handleUpgrade(upgrade)}
          />
        )}
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

/**
 * Reusable card for current / upgrade plan
 */
function PlanCard({
  title,
  price,
  subtitle,
  bullets,
  chipLabel,
  buttonLabel,
  buttonDisabled = false,
  isCurrent = false,
  isUpgrade = false,
  loading = false,
  onClick,
}) {
  return (
    <Card
      elevation={isUpgrade ? 4 : 2}
      sx={{
        borderRadius: 3,
        border: isUpgrade ? '2px solid #1976d2' : '1px solid #e0e0e0',
        position: 'relative',
        transition: 'all 0.3s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': isUpgrade ? {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        } : {},
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{ 
            fontWeight: 700, 
            letterSpacing: 0.5, 
            mb: 1,
            color: isUpgrade ? 'primary.main' : 'text.primary',
          }}
        >
          {title.toUpperCase()}
        </Typography>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {price}
          {price !== 'Free' && (
            <Typography 
              component="span" 
              variant="body2" 
              sx={{ color: 'text.secondary', ml: 0.5 }}
            >
              /month
            </Typography>
          )}
        </Typography>

        <Typography
          variant="body2"
          sx={{ mb: 3, color: 'text.secondary', minHeight: 40 }}
        >
          {subtitle}
        </Typography>

        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          {bullets.map((b, idx) => (
            <Typography
              key={idx}
              component="li"
              variant="body2"
              sx={{ 
                mb: 0.75,
                color: 'text.secondary',
                '&::marker': {
                  color: isUpgrade ? 'primary.main' : 'text.disabled',
                }
              }}
            >
              {b}
            </Typography>
          ))}
        </Box>

        <Chip
          label={chipLabel}
          size="small"
          variant="outlined"
          color={isUpgrade ? 'primary' : 'default'}
          sx={{
            borderRadius: 2,
            fontWeight: 500,
          }}
        />
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="outlined"
          disabled={buttonDisabled || loading}
          onClick={onClick}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{
            borderRadius: 8,
            py: 1.25,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.95rem',
            border: isUpgrade ? '2px solid' : '1px solid',
            borderColor: isUpgrade ? 'primary.main' : 'grey.300',
            color: isUpgrade ? 'primary.main' : 'text.secondary',
            transition: 'all 0.2s ease',
            '&:hover': isUpgrade ? {
              borderColor: 'primary.dark',
              backgroundColor: 'rgba(25, 118, 210, 0.04)',
              transform: 'scale(1.02)',
            } : {},
            '&:disabled': {
              borderColor: 'grey.300',
              color: 'text.disabled',
            }
          }}
        >
          {buttonLabel}
        </Button>
      </CardActions>
    </Card>
  );
}
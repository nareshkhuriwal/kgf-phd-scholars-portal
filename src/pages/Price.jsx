// src/pages/Price.jsx
import * as React from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import { ROLE_PLANS } from '../config/pricingPlans';
import { loadRazorpayScript } from '../utils/razorpay';
import { meThunk } from '../store/authSlice';
import {
  createPaymentOrderThunk,
  verifyPaymentThunk,
} from '../store/orderSlice';

export default function PricePage() {
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth?.user);
  const orderState = useSelector((s) => s.order);

  // Default role
  const role = user?.role || 'admin';
  const userPlanKey = user?.plan_key || null;

  const [loading, setLoading] = React.useState(false);
  const [notification, setNotification] = React.useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // ---------- CHANGED: determine initial billing cycle from user's plan_key ----------
  const { current, upgrade } = ROLE_PLANS[role] || ROLE_PLANS.researcher;

  const resolveInitialBillingCycle = React.useCallback(() => {
    if (!upgrade) return 'monthly'; // no upgrade available (admin paid etc)
    // if user's current plan key is the yearly plan key -> set yearly
    if (userPlanKey && upgrade.yearlyPlanKey && userPlanKey === upgrade.yearlyPlanKey)
      return 'yearly';
    // if user's current plan key is the monthly plan key -> set monthly
    if (userPlanKey && upgrade.monthlyPlanKey && userPlanKey === upgrade.monthlyPlanKey)
      return 'monthly';
    // if plan is annual-only prefer yearly
    if (upgrade.isAnnualOnly) return 'yearly';
    // default fallback
    return 'monthly';
  }, [userPlanKey, upgrade]);

  const [billingCycle, setBillingCycle] = React.useState(resolveInitialBillingCycle);

  // Update billingCycle when userPlanKey or upgrade changes (e.g., after meThunk refresh)
  React.useEffect(() => {
    setBillingCycle(resolveInitialBillingCycle());
  }, [resolveInitialBillingCycle]);

  // Load user on page load so latest plan is always in Redux
  React.useEffect(() => {
    dispatch(meThunk())
      .unwrap()
      .catch((err) => {
        console.error('Failed to refresh user on PricePage mount', err);
      });
  }, [dispatch]);

  const roleLabel = current.title;

  // derive which plan is current based on plan_key (monthly or yearly keys allowed)
  const isOnBasicPlan =
    !userPlanKey || userPlanKey === current.key; // free/default

  const isOnUpgradePlan =
    upgrade &&
    (userPlanKey === upgrade.monthlyPlanKey ||
      userPlanKey === upgrade.yearlyPlanKey);

  const currentPlanTitle =
    isOnUpgradePlan && upgrade
      ? upgrade.title
      : isOnBasicPlan
      ? current.title
      : null;

  const handleBillingCycleChange = (event, value) => {
    if (!value) return;
    setBillingCycle(value);
  };

  // Handle upgrade payment (no changes here)
  const handleUpgrade = async (selectedPlanKey, displayTitle, displayAmount) => {
    try {
      setLoading(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error(
          'Razorpay SDK failed to load. Please check your internet connection.'
        );
      }

      // 1) Create order using Redux thunk - pass exact plan key (monthly/yearly backend key)
      const orderData = await dispatch(
        createPaymentOrderThunk(selectedPlanKey)
      ).unwrap();
      // orderData: { orderId, amount, currency, key }

      if (!orderData?.orderId) {
        throw new Error('Failed to create payment order');
      }

      const publicKey =
        orderData.key ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        'YOUR_RAZORPAY_KEY_ID';

      // 2) Razorpay Checkout options
      const options = {
        key: publicKey,
        amount: orderData.amount, // in paise
        currency: orderData.currency,
        name: 'KGF Scholars',
        description: `Upgrade to ${displayTitle}`,
        order_id: orderData.orderId,

        handler: async function (response) {
          try {
            // 3) Verify payment on backend via Redux thunk
            await dispatch(
              verifyPaymentThunk({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_key: selectedPlanKey,
              })
            ).unwrap();

            // 4) Refresh user from /auth/me so plan_key & expires_at update in Redux
            await dispatch(meThunk()).unwrap();

            setNotification({
              open: true,
              message: `Successfully upgraded to ${displayTitle}! Your plan status is now updated.`,
              severity: 'success',
            });

            setLoading(false);
          } catch (error) {
            console.error(error);
            setNotification({
              open: true,
              message: 'Payment verification failed. Please contact support.',
              severity: 'error',
            });
            setLoading(false);
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
    } catch (error) {
      console.error('Payment error:', error);
      setNotification({
        open: true,
        message:
          error.message || 'Failed to initiate payment. Please try again.',
        severity: 'error',
      });
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // helper that returns display price and plan key given upgrade config + billingCycle
  const resolvePriceAndKey = (upgradeConfig, cycle) => {
    if (!upgradeConfig) return { displayPrice: null, planKey: null, amountPaise: null };
    if (cycle === 'monthly' && upgradeConfig.monthlyAmountPaise) {
      return {
        displayPrice: `₹${(upgradeConfig.monthlyAmountPaise / 100).toLocaleString()}/month`,
        planKey: upgradeConfig.monthlyPlanKey,
        amountPaise: upgradeConfig.monthlyAmountPaise,
      };
    }
    if (cycle === 'yearly' && upgradeConfig.yearlyAmountPaise) {
      return {
        displayPrice: `₹${(upgradeConfig.yearlyAmountPaise / 100).toLocaleString()}/year`,
        planKey: upgradeConfig.yearlyPlanKey,
        amountPaise: upgradeConfig.yearlyAmountPaise,
      };
    }
    // fallback: if admin and only yearly available
    if (upgradeConfig.isAnnualOnly && upgradeConfig.yearlyAmountPaise) {
      return {
        displayPrice: `₹${(upgradeConfig.yearlyAmountPaise / 100).toLocaleString()}/year`,
        planKey: upgradeConfig.yearlyPlanKey,
        amountPaise: upgradeConfig.yearlyAmountPaise,
      };
    }
    return { displayPrice: 'Contact sales', planKey: null, amountPaise: null };
  };

  const { displayPrice, planKey } = resolvePriceAndKey(upgrade, billingCycle);

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Choose your plan
      </Typography>

      <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
        You are currently seeing pricing for <strong>{roleLabel}</strong>
        {currentPlanTitle && (
          <>
            {' '}
            with plan <strong>{currentPlanTitle}</strong>
          </>
        )}
        {upgrade
          ? '. Compare your current plan with the upgrade below.'
          : '. You are on a paid Admin plan.'}
      </Typography>

      {/* Billing cycle toggle */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <ToggleButtonGroup
          value={billingCycle}
          exclusive
          onChange={handleBillingCycleChange}
          aria-label="billing cycle"
          size="small"
        >
          <ToggleButton value="monthly" aria-label="monthly" disabled={upgrade?.isAnnualOnly}>
            Monthly
          </ToggleButton>
          <ToggleButton value="yearly" aria-label="yearly">
            Yearly
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

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
        {/* Free/basic plan card */}
        <PlanCard
          title={current.title}
          price={current.price}
          subtitle={current.subtitle}
          bullets={current.bullets}
          chipLabel={isOnBasicPlan ? 'Current plan' : 'Free plan'}
          buttonLabel={isOnBasicPlan ? 'Current plan' : 'Free plan'}
          buttonDisabled
          isCurrent={isOnBasicPlan}
        />

        {/* Upgrade plan card (if any) */}
        {upgrade && (
          <PlanCard
            title={upgrade.title}
            price={displayPrice || upgrade.price}
            subtitle={upgrade.subtitle}
            bullets={upgrade.bullets}
            chipLabel={isOnUpgradePlan ? 'Current plan' : upgrade.chip}
            buttonLabel={
              isOnUpgradePlan
                ? 'Current plan'
                : loading || orderState.creating || orderState.verifying
                ? 'Processing...'
                : 'Upgrade plan'
            }
            buttonDisabled={isOnUpgradePlan || !planKey}
            isUpgrade
            loading={
              !isOnUpgradePlan &&
              (loading || orderState.creating || orderState.verifying)
            }
            onClick={() =>
              handleUpgrade(
                planKey,
                `${upgrade.title} (${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'})`,
                displayPrice
              )
            }
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
        '&:hover':
          isUpgrade && !buttonDisabled
            ? {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              }
            : {},
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
                },
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
            '&:hover':
              isUpgrade && !buttonDisabled
                ? {
                    borderColor: 'primary.dark',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    transform: 'scale(1.02)',
                  }
                : {},
            '&:disabled': {
              borderColor: 'grey.300',
              color: 'text.disabled',
            },
          }}
        >
          {buttonLabel}
        </Button>
      </CardActions>
    </Card>
  );
}

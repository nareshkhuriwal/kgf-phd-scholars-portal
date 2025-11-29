// src/pages/monitoring/Analytics.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Grid, Paper, Typography, Stack, Button, Divider, Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageHeader from '../../components/PageHeader';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { loadMonitoringStats, selectMonitoringStats } from '../../store/monitoringStatsSlice';

const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0'];

function StatTile({ title, value, subtitle }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2, minHeight: 96 }}>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700 }}>{value}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Paper>
  );
}

export default function Analytics() {
  const dispatch = useDispatch();
  const { data = {}, loading, error } = useSelector(selectMonitoringStats);

  React.useEffect(() => {
    dispatch(loadMonitoringStats());
  }, [dispatch]);

  const {
    total_users = 0,
    total_admins = 0,
    total_supervisors = 0,
    total_researchers = 0,
    total_payments_count = 0,
    total_payments_amount = 0, // in paise or smallest unit - we will adapt
    total_paid_amount = 0, // in paise or smallest unit - we will adapt
    payment_status_breakdown = [], // [{ status, count }]
    payments_over_time = [], // [{ date: '2025-11-01', amount: 12345, count: 3 }]
    created_payments_count = 0,
    successful_payments_count = 0,
  } = data;

  const amountFormatted = (amt) => {
    if (amt == null) return '-';
    const rupees = Number(amt) / 100;
    return rupees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' INR';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <PageHeader
        title="Analytics"
        subtitle="Monitoring — payments & user statistics (Super Admin only)"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => dispatch(loadMonitoringStats())}>Refresh</Button>
          </Stack>
        }
      />

      <Grid container spacing={2}>
        {/* KPI tiles */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <StatTile title="Total users" value={total_users} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatTile title="Admins" value={total_admins} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatTile title="Supervisors" value={total_supervisors} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatTile title="Researchers" value={total_researchers} />
            </Grid>

            <Grid item xs={12} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <StatTile title="Total payments (count)" value={total_payments_count} subtitle={`Created: ${created_payments_count} • Successful: ${successful_payments_count}`} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <StatTile title="Total payments (amount)" value={amountFormatted(total_payments_amount)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <StatTile title="Total paid payments (amount)" value={amountFormatted(total_paid_amount)} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Charts column */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Payment status</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payment_status_breakdown}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={3}
                    label={(entry) => `${entry.status} (${entry.count})`}
                  >
                    {payment_status_breakdown.map((entry, idx) => (
                      <Cell key={entry.status} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Payments over time chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Payments over time</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payments_over_time}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" tickFormatter={(v) => (v/100).toFixed(0)} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'amount') return [ (value/100).toFixed(2) + ' INR', 'Amount' ];
                    return [value, name];
                  }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="amount" name="Amount (paise)" stroke="#1976d2" dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="count" name="Count" stroke="#4caf50" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Optional bar: top plans or recent payments summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2, minHeight: 260 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Top plans by revenue</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.plans_by_revenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="plan" />
                  <YAxis tickFormatter={(v) => (v/100).toFixed(0)} />
                  <Tooltip formatter={(value) => (value/100).toFixed(2) + ' INR'} />
                  <Bar dataKey="amount" name="Revenue" fill="#ff9800" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2, minHeight: 260 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Recent payments</Typography>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={1}>
              {(data.recent_payments || []).slice(0,6).map((p) => (
                <Box key={p.id} sx={{ display:'flex', justifyContent:'space-between', gap:1 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight:600 }}>{p.user?.name || p.user_email || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.meta?.plan_label || p.plan_key}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2">{(p.amount/100).toFixed(2)} INR</Typography>
                    <Chip label={p.status} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                  </Box>
                </Box>
              ))}
              {(!data.recent_payments || data.recent_payments.length === 0) && <Typography variant="caption" color="text.secondary">No recent payments</Typography>}
            </Stack>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}

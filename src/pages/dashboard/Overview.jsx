// src/pages/overview/Overview.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadDashboardSummary,
  loadDashboardDaily,
  loadDashboardWeekly
} from '../../store/dashboardSlice';

import {
  Grid, Paper, Box, Typography, Stack, Divider, CircularProgress, Alert,
  ToggleButtonGroup, ToggleButton
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const StatCard = ({ label, value }) => (
  <Paper sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
    <Typography variant="h4" sx={{ mb: .5 }}>{value ?? 0}</Typography>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
  </Paper>
);

export default function Overview() {
  const dispatch = useDispatch();
  const {
    loadingSummary, loadingDaily, loadingWeekly,
    errorSummary, errorDaily, errorWeekly,
    totals, byCategory, daily, weekly
  } = useSelector(s => s.dashboard || {});

  const [viewMode, setViewMode] = React.useState('daily'); // 'daily' | 'weekly'

  React.useEffect(() => {
    dispatch(loadDashboardSummary());
    dispatch(loadDashboardDaily());
    dispatch(loadDashboardWeekly());
  }, [dispatch]);

  const dailyRows = React.useMemo(() => {
    const L = daily?.labels || [];
    const A = daily?.added || [];
    const R = daily?.reviewed || [];
    return L.map((x, i) => ({ label: x, added: A[i] ?? 0, reviewed: R[i] ?? 0 }));
  }, [daily]);

  const weeklyRows = React.useMemo(() => {
    const L = weekly?.labels || [];
    const A = weekly?.added || [];
    const R = weekly?.reviewed || [];
    return L.map((x, i) => ({ label: x, added: A[i] ?? 0, reviewed: R[i] ?? 0 }));
  }, [weekly]);

  const seriesRows = viewMode === 'weekly' ? weeklyRows : dailyRows;
  const busy = loadingSummary || loadingDaily || loadingWeekly;
  const anyError = errorSummary || errorDaily || errorWeekly;
  const pieColors = ['#4F46E5', '#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#A78BFA'];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="Dashboard" subtitle="Your research at a glance" />

      {/* KPIs */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={6} md={2.4}><StatCard label="Total Papers" value={totals?.totalPapers} /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard label="Reviewed" value={totals?.reviewedPapers} /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard label="In Review Queue" value={totals?.inQueue} /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard label="Started for Review" value={totals?.started} /></Grid>
        <Grid item xs={12} sm={6} md={2.4}><StatCard label="Collections" value={totals?.collections} /></Grid>
      </Grid>

      {busy ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Grid container spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
          {/* Trend (Daily/Weekly toggleable lines) */}
          <Grid item xs={12} md={7} sx={{ height: { xs: 360, md: 420 }, minHeight: 0 }}>
            <Paper sx={{ p: 2, height: '100%', border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1">Activity Trend</Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={viewMode}
                  onChange={(_, v) => v && setViewMode(v)}
                >
                  <ToggleButton value="daily">Daily</ToggleButton>
                  <ToggleButton value="weekly">Weekly</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={seriesRows}
                    margin={{ left: 24, right: 24, top: 12, bottom: 32 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickMargin={12}
                      minTickGap={10}
                      interval="preserveEnd"
                      allowDuplicatedCategory={false}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="added" stroke="#0EA5E9" strokeWidth={2} dot={false} name="Added" />
                    <Line type="monotone" dataKey="reviewed" stroke="#22C55E" strokeWidth={2} dot={false} name="Reviewed" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Category distribution */}
          <Grid item xs={12} md={5} sx={{ height: { xs: 360, md: 420 }, minHeight: 0 }}>
            <Paper sx={{ p: 2, height: '100%', border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1">By Category</Typography>
                <Typography variant="caption" color="text.secondary">Paper distribution</Typography>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ flex: 1, minHeight: 0, pb: 1 }}>
                {Array.isArray(byCategory) && byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                      <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius="80%" label>
                        {byCategory.map((_, i) => (
                          <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">No category data.</Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Weekly bars (footer) – ensure X-axis visible */}
          <Grid item xs={12} sx={{ height: 380, minHeight: 0 }}>
            <Paper sx={{ p: 2, height: '100%', border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Weekly Activity (Bars)</Typography>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyRows}
                    margin={{ left: 24, right: 24, top: 12, bottom: 32 }}
                    barCategoryGap={8}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickMargin={12}
                      minTickGap={10}
                      interval="preserveEnd"
                      allowDuplicatedCategory={false}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="added" name="Added" fill="#60A5FA" />
                    <Bar dataKey="reviewed" name="Reviewed" fill="#34D399" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {anyError && (
        <Box sx={{ mt: 1 }}>
          {errorSummary && <Alert severity="error" sx={{ mb: .5 }}>Summary: {String(errorSummary)}</Alert>}
          {errorDaily && <Alert severity="error" sx={{ mb: .5 }}>Daily: {String(errorDaily)}</Alert>}
          {errorWeekly && <Alert severity="error">Weekly: {String(errorWeekly)}</Alert>}
        </Box>
      )}
    </Box>
  );
}

// src/pages/overview/Overview.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadDashboardSummary,
  loadDashboardDaily,
  loadDashboardWeekly,
  loadDashboardFilters,
} from '../../store/dashboardSlice';

import {
  Grid,
  Paper,
  Box,
  Typography,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

import { useLocation } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const StatCard = ({ label, value }) => (
  <Paper sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
    <Typography variant="h4" sx={{ mb: 0.5 }}>{value ?? 0}</Typography>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  </Paper>
);

export default function Overview() {
  const dispatch = useDispatch();
  const location = useLocation();

  // -------- Determine which dashboard mode we are in from the URL --------
  const path = location.pathname || '';
  let mode = 'overview'; // /dashboard
  if (path.includes('/dashboard/researchers')) mode = 'researchers';
  else if (path.includes('/dashboard/supervisors')) mode = 'supervisors';

  const { user } = useSelector((s) => s.auth || {});
  const role = user?.role; // 'researcher' | 'supervisor' | 'admin'

  const {
    loadingSummary,
    loadingDaily,
    loadingWeekly,
    loadingFilters,
    errorSummary,
    errorDaily,
    errorWeekly,
    totals,
    byCategory,
    daily,
    weekly,
    filters,
  } = useSelector((s) => s.dashboard || {});

  const supervisors = filters?.supervisors || [];
  const researchers = filters?.researchers || [];

  const [viewMode, setViewMode] = React.useState('daily'); // 'daily' | 'weekly'

  // Primary dropdown: "View" selection (aggregate vs specific)
  const [primaryKey, setPrimaryKey] = React.useState('');
  // Secondary dropdown: specific user id
  const [selectedUserId, setSelectedUserId] = React.useState('');

  // -------- Load filters whenever we might need specific users --------
  React.useEffect(() => {
    if (role === 'admin' || role === 'supervisor') {
      dispatch(loadDashboardFilters());
    }
  }, [dispatch, role]);

  // -------- Initial primary option based on mode + role --------
  React.useEffect(() => {
    if (!role) return;

    if (mode === 'overview') {
      if (role === 'admin') {
        setPrimaryKey('OV_ALL'); // org overview
      } else {
        setPrimaryKey('OV_SELF'); // own dashboard
      }
    } else if (mode === 'researchers') {
      if (role === 'supervisor') {
        setPrimaryKey('RES_ALL_MY'); // all my researchers
      } else if (role === 'admin') {
        setPrimaryKey('RES_ALL'); // all researchers
      } else {
        setPrimaryKey('OV_SELF');
      }
    } else if (mode === 'supervisors') {
      if (role === 'admin') {
        setPrimaryKey('SUP_ALL'); // all supervisors
      } else {
        setPrimaryKey('OV_SELF');
      }
    }

    setSelectedUserId('');
  }, [mode, role]);

  // -------- Primary dropdown options per (mode, role) --------
  const primaryOptions = React.useMemo(() => {
    if (role === 'researcher') return [];

    if (mode === 'overview') {
      if (role === 'admin') {
        return [
          { value: 'OV_ALL', label: 'All supervisors & researchers' },
          { value: 'OV_SPEC_SUP', label: 'Specific supervisor' },
          { value: 'OV_SPEC_RES', label: 'Specific researcher' },
        ];
      }
      if (role === 'supervisor') {
        return [
          { value: 'OV_SELF', label: 'My own activity' },
          { value: 'OV_MY_RESEARCHERS', label: 'All my researchers' },
        ];
      }
    }

    if (mode === 'researchers') {
      if (role === 'supervisor') {
        return [
          { value: 'RES_ALL_MY', label: 'All my researchers' },
          { value: 'RES_SPEC', label: 'Specific researcher' },
        ];
      }
      if (role === 'admin') {
        return [
          { value: 'RES_ALL', label: 'All researchers' },
          { value: 'RES_SPEC', label: 'Specific researcher' },
        ];
      }
    }

    if (mode === 'supervisors') {
      if (role === 'admin') {
        return [
          { value: 'SUP_ALL', label: 'All supervisors' },
          { value: 'SUP_SPEC', label: 'Specific supervisor' },
        ];
      }
    }

    return [];
  }, [mode, role]);

  // -------- Should we show second dropdown and which list to use? --------
  const { showUserDropdown, userDropdownLabel, userOptions } = React.useMemo(() => {
    const labelUser = (u) => u?.name || u?.email || `User #${u?.id}`;

    // default
    let show = false;
    let label = '';
    let options = [];

    if (role === 'researcher') {
      return { showUserDropdown: false, userDropdownLabel: '', userOptions: [] };
    }

    // overview: only admin can pick specific
    if (mode === 'overview' && role === 'admin') {
      if (primaryKey === 'OV_SPEC_SUP') {
        show = true;
        label = 'Supervisor';
        options = supervisors.map((s) => ({
          value: String(s.id),
          label: labelUser(s),
        }));
      } else if (primaryKey === 'OV_SPEC_RES') {
        show = true;
        label = 'Researcher';
        options = researchers.map((r) => ({
          value: String(r.id),
          label: labelUser(r),
        }));
      }
    }

    // researchers dashboard
    if (mode === 'researchers') {
      if (primaryKey === 'RES_SPEC') {
        show = true;
        label = 'Researcher';
        options = researchers.map((r) => ({
          value: String(r.id),
          label: labelUser(r),
        }));
      }
    }

    // supervisors dashboard
    if (mode === 'supervisors') {
      if (primaryKey === 'SUP_SPEC') {
        show = true;
        label = 'Supervisor';
        options = supervisors.map((s) => ({
          value: String(s.id),
          label: labelUser(s),
        }));
      }
    }

    return { showUserDropdown: show, userDropdownLabel: label, userOptions: options };
  }, [mode, role, primaryKey, supervisors, researchers]);

  // -------- Map selection -> API scope + targetUserId + header labels --------
  const config = React.useMemo(() => {
    const labelUser = (u) => u?.name || u?.email || `User #${u?.id}`;

    let title = 'Dashboard';
    let subtitle = 'Your research at a glance';
    let chip = 'My dashboard';
    let scope = 'self';
    let targetUserId = null;

    // researcher: always self
    if (role === 'researcher') {
      if (mode === 'researchers') {
        title = 'Researchers Dashboard';
        subtitle = 'Your own research activity';
      } else if (mode === 'supervisors') {
        title = 'Supervisors Dashboard';
      }
      return { title, subtitle, chip, scope, targetUserId };
    }

    // OVERVIEW mode
    if (mode === 'overview') {
      title = 'Dashboard';
      if (role === 'admin') {
        title = 'Dashboard – Overview';
        subtitle = 'Organisation-wide activity at a glance';

        if (primaryKey === 'OV_ALL' || !primaryKey) {
          scope = 'all';
          chip = 'All supervisors & researchers';
        } else if (primaryKey === 'OV_SPEC_SUP') {
          if (!selectedUserId) {
            scope = null;
            chip = 'Select a supervisor';
          } else {
            const id = Number(selectedUserId);
            const s = supervisors.find((x) => x.id === id);
            scope = 'supervisor';
            targetUserId = id;
            chip = s ? `Supervisor – ${labelUser(s)}` : `Supervisor #${id}`;
          }
        } else if (primaryKey === 'OV_SPEC_RES') {
          if (!selectedUserId) {
            scope = null;
            chip = 'Select a researcher';
          } else {
            const id = Number(selectedUserId);
            const r = researchers.find((x) => x.id === id);
            scope = 'researcher';
            targetUserId = id;
            chip = r ? `Researcher – ${labelUser(r)}` : `Researcher #${id}`;
          }
        }
      } else if (role === 'supervisor') {
        subtitle = 'Your research activity and your team at a glance';
        if (primaryKey === 'OV_SELF' || !primaryKey) {
          scope = 'self';
          chip = 'My dashboard';
        } else if (primaryKey === 'OV_MY_RESEARCHERS') {
          scope = 'my_researchers';
          targetUserId = user?.id || null;
          chip = 'All my researchers';
        }
      }

      return { title, subtitle, chip, scope, targetUserId };
    }

    // RESEARCHERS dashboard
    if (mode === 'researchers') {
      title = 'Researchers Dashboard';
      subtitle = 'Monitor and compare researcher performance';

      if (role === 'supervisor') {
        if (primaryKey === 'RES_ALL_MY' || !primaryKey) {
          scope = 'my_researchers';
          targetUserId = user?.id || null;
          chip = 'All my researchers';
        } else if (primaryKey === 'RES_SPEC') {
          if (!selectedUserId) {
            scope = null;
            chip = 'Select a researcher';
          } else {
            const id = Number(selectedUserId);
            const r = researchers.find((x) => x.id === id);
            scope = 'researcher';
            targetUserId = id;
            chip = r ? `Researcher – ${labelUser(r)}` : `Researcher #${id}`;
          }
        }
      } else if (role === 'admin') {
        if (primaryKey === 'RES_ALL' || !primaryKey) {
          scope = 'all_researchers';
          chip = 'All researchers';
        } else if (primaryKey === 'RES_SPEC') {
          if (!selectedUserId) {
            scope = null;
            chip = 'Select a researcher';
          } else {
            const id = Number(selectedUserId);
            const r = researchers.find((x) => x.id === id);
            scope = 'researcher';
            targetUserId = id;
            chip = r ? `Researcher – ${labelUser(r)}` : `Researcher #${id}`;
          }
        }
      }

      return { title, subtitle, chip, scope, targetUserId };
    }

    // SUPERVISORS dashboard
    if (mode === 'supervisors') {
      title = 'Supervisors Dashboard';
      subtitle = 'Monitor supervisor activity and coverage';

      if (role === 'admin') {
        if (primaryKey === 'SUP_ALL' || !primaryKey) {
          scope = 'all_supervisors';
          chip = 'All supervisors';
        } else if (primaryKey === 'SUP_SPEC') {
          if (!selectedUserId) {
            scope = null;
            chip = 'Select a supervisor';
          } else {
            const id = Number(selectedUserId);
            const s = supervisors.find((x) => x.id === id);
            scope = 'supervisor';
            targetUserId = id;
            chip = s ? `Supervisor – ${labelUser(s)}` : `Supervisor #${id}`;
          }
        }
      }

      return { title, subtitle, chip, scope, targetUserId };
    }

    return { title, subtitle, chip, scope, targetUserId };
  }, [
    mode,
    role,
    primaryKey,
    selectedUserId,
    user,
    supervisors,
    researchers,
  ]);

  const { title, subtitle, chip, scope, targetUserId } = config;

  // -------- Load data when scope / user change (but only when scope is resolved) --------
  React.useEffect(() => {
    if (!scope) return; // e.g., "Select a researcher" state

    const payload = { scope, userId: targetUserId || undefined };

    dispatch(loadDashboardSummary(payload));
    dispatch(loadDashboardDaily(payload));
    dispatch(loadDashboardWeekly(payload));
  }, [dispatch, scope, targetUserId]);

  // -------- Build chart rows --------
  const dailyRows = React.useMemo(() => {
    const L = daily?.labels || [];
    const A = daily?.added || [];
    const R = daily?.reviewed || [];
    return L.map((x, i) => ({
      label: x,
      added: A[i] ?? 0,
      reviewed: R[i] ?? 0,
    }));
  }, [daily]);

  const weeklyRows = React.useMemo(() => {
    const L = weekly?.labels || [];
    const A = weekly?.added || [];
    const R = weekly?.reviewed || [];
    return L.map((x, i) => ({
      label: x,
      added: A[i] ?? 0,
      reviewed: R[i] ?? 0,
    }));
  }, [weekly]);

  const seriesRows = viewMode === 'weekly' ? weeklyRows : dailyRows;
  const busy = loadingSummary || loadingDaily || loadingWeekly;
  const anyError = errorSummary || errorDaily || errorWeekly;
  const pieColors = [
    '#4F46E5',
    '#0EA5E9',
    '#22C55E',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#14B8A6',
    '#A78BFA',
  ];

  const showPrimaryDropdown = role !== 'researcher' && primaryOptions.length > 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ===== Header Card ===== */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: 2.5,
          borderRadius: 2,
          border: '1px solid rgba(15,23,42,0.06)',
          background:
            'linear-gradient(135deg, rgba(59,130,246,0.03), rgba(139,92,246,0.02))',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
        >
          {/* Left side: title + subtitle + chip */}
          <Stack spacing={0.75}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
            {/* {chip && (
              <Chip
                size="small"
                label={chip}
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5, alignSelf: 'flex-start' }}
              />
            )} */}
          </Stack>

          {/* Right side: dropdown(s) */}
          {showPrimaryDropdown && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="dashboard-primary-label">View</InputLabel>
                <Select
                  labelId="dashboard-primary-label"
                  label="View"
                  value={primaryKey || ''}
                  onChange={(e) => {
                    setPrimaryKey(e.target.value);
                    setSelectedUserId('');
                  }}
                >
                  {primaryOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {showUserDropdown && (
                <FormControl
                  size="small"
                  sx={{ minWidth: 220 }}
                  disabled={loadingFilters}
                >
                  <InputLabel id="dashboard-user-label">
                    {userDropdownLabel}
                  </InputLabel>
                  <Select
                    labelId="dashboard-user-label"
                    label={userDropdownLabel}
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    {userOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* ===== KPIs ===== */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="Total Papers" value={totals?.totalPapers} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="Reviewed" value={totals?.reviewedPapers} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="In Review Queue" value={totals?.inQueue} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="Started for Review" value={totals?.started} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard label="Collections" value={totals?.collections} />
        </Grid>
      </Grid>

      {/* ===== Charts ===== */}
      {busy ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Grid container spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
          {/* Trend (Daily / Weekly) */}
          <Grid
            item
            xs={12}
            md={7}
            sx={{ height: { xs: 360, md: 420 }, minHeight: 0 }}
          >
            <Paper
              sx={{
                p: 2,
                height: '100%',
                border: '1px solid #eee',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
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
                    <Line
                      type="monotone"
                      dataKey="added"
                      stroke="#0EA5E9"
                      strokeWidth={2}
                      dot={false}
                      name="Added"
                    />
                    <Line
                      type="monotone"
                      dataKey="reviewed"
                      stroke="#22C55E"
                      strokeWidth={2}
                      dot={false}
                      name="Reviewed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Category distribution */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{ height: { xs: 360, md: 420 }, minHeight: 0 }}
          >
            <Paper
              sx={{
                p: 2,
                height: '100%',
                border: '1px solid #eee',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle1">By Category</Typography>
                <Typography variant="caption" color="text.secondary">
                  Paper distribution
                </Typography>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              <Box sx={{ flex: 1, minHeight: 0, pb: 1 }}>
                {Array.isArray(byCategory) && byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart
                      margin={{
                        top: 12,
                        right: 12,
                        bottom: 12,
                        left: 12,
                      }}
                    >
                      <Pie
                        data={byCategory}
                        dataKey="value"
                        nameKey="name"
                        outerRadius="80%"
                        label
                      >
                        {byCategory.map((_, i) => (
                          <Cell
                            key={i}
                            fill={pieColors[i % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No category data.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Weekly bars */}
          <Grid item xs={12} sx={{ height: 380, minHeight: 0 }}>
            <Paper
              sx={{
                p: 2,
                height: '100%',
                border: '1px solid #eee',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Weekly Activity (Bars)
              </Typography>
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
          {errorSummary && (
            <Alert severity="error" sx={{ mb: 0.5 }}>
              Summary: {String(errorSummary)}
            </Alert>
          )}
          {errorDaily && (
            <Alert severity="error" sx={{ mb: 0.5 }}>
              Daily: {String(errorDaily)}
            </Alert>
          )}
          {errorWeekly && (
            <Alert severity="error">
              Weekly: {String(errorWeekly)}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}

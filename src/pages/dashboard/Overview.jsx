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
  LabelList,
  ReferenceLine,
} from 'recharts';
import { hasRoleAccess } from '../../utils/rbac';

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
  else if (path.includes('/dashboard/admins')) mode = 'admins';

  const { user } = useSelector((s) => s.auth || {});
  const role = user?.role; // 'researcher' | 'supervisor' | 'admin' | 'superuser'

  console.log('Dashboard mode:', mode, 'for role:', role);

  const {
    loadingSummary,
    loadingDaily,
    loadingWeekly,
    loadingFilters,
    errorSummary,
    errorDaily,
    errorWeekly,
    totals,
    derived,

    byCategory,
    yearly,
    daily,
    weekly,
    filters,
  } = useSelector((s) => s.dashboard || {});

  const supervisors = filters?.supervisors || [];
  const researchers = filters?.researchers || [];
  const admins = filters?.admins || [];

  const [viewMode, setViewMode] = React.useState('daily'); // 'daily' | 'weekly'

  // Primary dropdown: "View" selection (aggregate vs specific)
  const [primaryKey, setPrimaryKey] = React.useState('');
  // Secondary dropdown: specific user id
  const [selectedUserId, setSelectedUserId] = React.useState('');


  const weeklyEfficiencyRows = React.useMemo(() => {
    const L = weekly?.labels ?? [];
    const E = weekly?.efficiency ?? [];
    const A = weekly?.added ?? [];
    const R = weekly?.reviewed ?? [];

    return L.map((l, i) => ({
      label: l,
      efficiency: E[i] ?? 0,
      added: A[i] ?? 0,
      reviewed: R[i] ?? 0,
    }));
  }, [weekly]);


  const isMonthlyEfficiency = weekly?.mode === 'monthly';


  const [visibleLines, setVisibleLines] = React.useState({
    added: true,
    reviewed: true,
    started: true,
    cumulativeReviewed: true,
  });


  const handleLegendClick = (e) => {
    const key = e.dataKey;
    setVisibleLines((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };




  // -------- Load filters for supervisor/admin/superuser --------
  React.useEffect(() => {
    if (role === 'supervisor' || role === 'admin' || role === 'superuser') {
      console.log('Loading filters for role:', role);
      dispatch(loadDashboardFilters());
    }
  }, [dispatch, role]);

  // -------- Initial primary option based on mode + role --------
  React.useEffect(() => {
    if (!role) return;

    if (mode === 'overview') {
      if (role === 'superuser' || role === 'admin') {
        setPrimaryKey('OV_ALL');
      } else if (role === 'supervisor') {
        setPrimaryKey('OV_SELF');
      } else {
        setPrimaryKey('OV_SELF');
      }
    } else if (mode === 'researchers') {
      if (role === 'supervisor') {
        setPrimaryKey('RES_ALL_MY');
      } else if (role === 'admin' || role === 'superuser') {
        setPrimaryKey('RES_ALL');
      } else {
        setPrimaryKey('OV_SELF');
      }
    } else if (mode === 'supervisors') {
      if (role === 'admin' || role === 'superuser') {
        setPrimaryKey('SUP_ALL');
      } else {
        setPrimaryKey('OV_SELF');
      }
    } else if (mode === 'admins') {
      if (role === 'superuser') {
        setPrimaryKey('ADM_ALL');
      } else {
        setPrimaryKey('OV_SELF');
      }
    }

    setSelectedUserId('');
  }, [mode, role]);

  // -------- Primary dropdown options per (mode, role) --------
  const primaryOptions = React.useMemo(() => {
    console.log('🔍 primaryOptions calculating...', {
      role,
      mode,
    });

    // Researcher should NOT see dropdowns
    if (role === 'researcher') {
      console.log('❌ Returning empty - is researcher');
      return [];
    }

    if (mode === 'overview') {
      console.log('✅ Mode is overview, checking role...');

      if (role === 'superuser') {
        console.log('✅ Is superuser');
        return [
          { value: 'OV_SELF', label: 'My own activity' },
          { value: 'OV_ALL', label: 'All users (admins + supervisors + researchers)' },
          { value: 'OV_SPEC_ADMIN', label: 'Specific admin' },
          { value: 'OV_SPEC_SUP', label: 'Specific supervisor' },
          { value: 'OV_SPEC_RES', label: 'Specific researcher' },
        ];
      }

      if (role === 'admin') {
        console.log('✅ Is admin');
        return [
          { value: 'OV_SELF', label: 'My own activity' },
          { value: 'OV_ALL', label: 'All my supervisors & researchers' },
          { value: 'OV_SPEC_SUP', label: 'Specific supervisor' },
          { value: 'OV_SPEC_RES', label: 'Specific researcher' },
        ];
      }

      if (role === 'supervisor') {
        console.log('✅ Is supervisor - returning options');
        return [
          { value: 'OV_SELF', label: 'My own activity' },
          { value: 'OV_MY_RESEARCHERS', label: 'All my researchers' },
          { value: 'OV_ALL', label: 'Me + All my researchers' },
          { value: 'OV_SPEC_RES', label: 'Specific researcher' },
        ];
      }

      console.log('❌ Role not matched in overview:', role);
    }

    if (mode === 'researchers') {
      console.log('✅ Mode is researchers');

      if (role === 'superuser') {
        return [
          { value: 'RES_ALL', label: 'All researchers' },
          { value: 'RES_SPEC', label: 'Specific researcher' },
        ];
      }

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
      console.log('✅ Mode is supervisors');

      if (role === 'superuser' || role === 'admin') {
        return [
          { value: 'SUP_ALL', label: 'All supervisors' },
          { value: 'SUP_SPEC', label: 'Specific supervisor' },
        ];
      }
    }

    if (mode === 'admins') {
      console.log('✅ Mode is admins');

      if (role === 'superuser') {
        return [
          { value: 'ADM_ALL', label: 'All admins' },
          { value: 'ADM_SPEC', label: 'Specific admin' },
        ];
      }
    }

    console.log('❌ Returning empty - no condition matched');
    return [];
  }, [mode, role]);

  // -------- Should we show second dropdown and which list to use? --------
  const { showUserDropdown, userDropdownLabel, userOptions } = React.useMemo(() => {
    const labelUser = (u) => u?.name || u?.email || `User #${u?.id}`;

    let show = false;
    let label = '';
    let options = [];

    // Researcher should NOT see any dropdowns
    if (role === 'researcher') {
      return { showUserDropdown: false, userDropdownLabel: '', userOptions: [] };
    }

    // Overview mode
    if (mode === 'overview') {
      if (primaryKey === 'OV_SPEC_ADMIN') {
        show = true;
        label = 'Select Admin';
        options = admins.map((a) => ({
          value: String(a.id),
          label: labelUser(a),
        }));
      } else if (primaryKey === 'OV_SPEC_SUP') {
        show = true;
        label = 'Select Supervisor';
        options = supervisors.map((s) => ({
          value: String(s.id),
          label: labelUser(s),
        }));
      } else if (primaryKey === 'OV_SPEC_RES') {
        show = true;
        label = 'Select Researcher';
        options = researchers.map((r) => ({
          value: String(r.id),
          label: labelUser(r),
        }));
      }
    }

    // Researchers dashboard
    if (mode === 'researchers') {
      if (primaryKey === 'RES_SPEC') {
        show = true;
        label = 'Select Researcher';
        options = researchers.map((r) => ({
          value: String(r.id),
          label: labelUser(r),
        }));
      }
    }

    // Supervisors dashboard
    if (mode === 'supervisors') {
      if (primaryKey === 'SUP_SPEC') {
        show = true;
        label = 'Select Supervisor';
        options = supervisors.map((s) => ({
          value: String(s.id),
          label: labelUser(s),
        }));
      }
    }

    // Admins dashboard
    if (mode === 'admins') {
      if (primaryKey === 'ADM_SPEC') {
        show = true;
        label = 'Select Admin';
        options = admins.map((a) => ({
          value: String(a.id),
          label: labelUser(a),
        }));
      }
    }

    return { showUserDropdown: show, userDropdownLabel: label, userOptions: options };
  }, [mode, role, primaryKey, supervisors, researchers, admins]);

  // -------- Map selection -> API scope + targetUserId + header labels --------
  const config = React.useMemo(() => {
    const labelUser = (u) => u?.name || u?.email || `User #${u?.id}`;

    let title = 'Dashboard';
    let subtitle = 'Your research at a glance';
    let chip = 'My dashboard';
    let scope = 'self';
    let targetUserId = null;

    // Researcher: always self
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

      if (role === 'superuser') {
        title = 'Dashboard – Overview';
        subtitle = 'System-wide activity at a glance';

        if (primaryKey === 'OV_SELF') {
          scope = 'self';
          chip = 'My dashboard';
        } else if (primaryKey === 'OV_ALL' || !primaryKey) {
          scope = 'all';
          chip = 'All users (admins + supervisors + researchers)';
        } else if (primaryKey === 'OV_SPEC_ADMIN') {
          if (!selectedUserId) {
            scope = null;
            chip = 'Select an admin';
          } else {
            const id = Number(selectedUserId);
            const a = admins.find((x) => x.id === id);
            scope = 'admin';
            targetUserId = id;
            chip = a ? `Admin – ${labelUser(a)}` : `Admin #${id}`;
          }
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
      } else if (role === 'admin') {
        title = 'Dashboard – Overview';
        subtitle = 'Organisation-wide activity at a glance';

        if (primaryKey === 'OV_SELF') {
          scope = 'self';
          chip = 'My dashboard';
        } else if (primaryKey === 'OV_ALL' || !primaryKey) {
          scope = 'all';
          chip = 'All my supervisors & researchers';
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
          chip = 'All my researchers';
        } else if (primaryKey === 'OV_ALL') {
          scope = 'all';
          chip = 'Me + All my researchers';
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
      } else if (role === 'admin' || role === 'superuser') {
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

      if (role === 'admin' || role === 'superuser') {
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

    // ADMINS dashboard
    if (mode === 'admins') {
      title = 'Admins Dashboard';
      subtitle = 'Monitor admin activity and management';

      if (role === 'superuser') {
        if (primaryKey === 'ADM_ALL' || !primaryKey) {
          scope = 'all_admins';
          chip = 'All admins';
        } else if (primaryKey === 'ADM_SPEC') {
          if (!selectedUserId) {
            scope = null;
            chip = 'Select an admin';
          } else {
            const id = Number(selectedUserId);
            const a = admins.find((x) => x.id === id);
            scope = 'admin';
            targetUserId = id;
            chip = a ? `Admin – ${labelUser(a)}` : `Admin #${id}`;
          }
        }
      }

      return { title, subtitle, chip, scope, targetUserId };
    }

    return { title, subtitle, chip, scope, targetUserId };
  }, [mode, role, primaryKey, selectedUserId, supervisors, researchers, admins]);

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
    return daily.labels.map((x, i) => ({
      label: x,
      added: daily.added[i] ?? 0,
      reviewed: daily.reviewed[i] ?? 0,
      started: daily.started[i] ?? 0,
      cumulativeReviewed: daily.cumulativeReviewed[i] ?? 0,
    }));
  }, [daily]);


  const weeklyRows = React.useMemo(() => {
    const L = weekly?.labels || [];
    const A = weekly?.added || [];
    const R = weekly?.reviewed || [];
    const S = weekly?.started || [];
    return L.map((x, i) => ({
      label: x,
      added: A[i] ?? 0,
      reviewed: R[i] ?? 0,
      started: S[i] ?? 0,
    }));
  }, [weekly]);

  const yearlyRows = React.useMemo(() => {
    const L = yearly?.labels || [];
    const C = yearly?.counts || [];

    return L.map((year, i) => ({
      year,
      papers: C[i] ?? 0,
    }));
  }, [yearly]);



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

  // Show dropdown for supervisor, admin, and superuser ONLY
  const showPrimaryDropdown = role !== 'researcher' && primaryOptions.length > 0;

  console.log('🔍 Dropdown visibility:', {
    role,
    showPrimaryDropdown,
    primaryOptionsCount: primaryOptions.length,
  });

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
            {chip && (
              <Chip
                size="small"
                label={chip}
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5, alignSelf: 'flex-start' }}
              />
            )}
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
      {/* ===== KPIs ===== */}
      <Grid
        container
        spacing={1.5}
        sx={{
          mb: 1.5,
          flexWrap: { xs: 'wrap', md: 'nowrap' }, // 👈 force one row on desktop
        }}
      >
        <Grid item xs={12} sm={6} md={2}>
          <StatCard label="Total Papers" value={totals?.totalPapers} />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <StatCard label="In Review Queue" value={totals?.inQueue} />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <StatCard label="Started for Review" value={totals?.started} />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <StatCard label="Reviewed" value={totals?.reviewedPapers} />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            label="Review Completion"
            value={`${derived?.reviewCompletionRate ?? 0}%`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            label="Queue Pressure"
            value={`${derived?.queuePressure ?? 0}%`}
          />
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

                    <XAxis dataKey="label" />
                    <YAxis yAxisId="left" allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" allowDecimals={false} />

                    <Tooltip />
                    <Legend
                      onClick={handleLegendClick}
                      wrapperStyle={{ cursor: 'pointer' }}
                    />

                    <Line
                      type="monotone"
                      dataKey="added"
                      name="Added"
                      stroke="#0EA5E9"
                      strokeWidth={visibleLines.added ? 2 : 1}
                      strokeOpacity={visibleLines.added ? 1 : 0.15}
                      dot={visibleLines.added}
                      isAnimationActive={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="reviewed"
                      name="Reviewed"
                      stroke="#22C55E"
                      strokeWidth={visibleLines.reviewed ? 2 : 1}
                      strokeOpacity={visibleLines.reviewed ? 1 : 0.15}
                      dot={visibleLines.reviewed}
                      isAnimationActive={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="started"
                      name="In Review"
                      stroke="#F59E0B"
                      strokeWidth={visibleLines.started ? 2 : 1}
                      strokeOpacity={visibleLines.started ? 1 : 0.15}
                      dot={visibleLines.started}
                      isAnimationActive={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="cumulativeReviewed"
                      name="Cumulative Reviewed"
                      stroke="#6366F1"
                      strokeDasharray="5 5"
                      strokeWidth={visibleLines.cumulativeReviewed ? 2 : 1}
                      strokeOpacity={visibleLines.cumulativeReviewed ? 1 : 0.15}
                      dot={false}
                      isAnimationActive={false}
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
          {/* ===== Bottom Bar Charts ===== */}
          <Grid container item xs={12} spacing={1.5} sx={{ height: 380 }}>

            {/* Weekly Activity Bars (50%) */}
            <Grid item xs={12} md={7} sx={{ height: '100%' }}>
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
                {/* Header */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {isMonthlyEfficiency
                      ? '% of added papers reviewed per month'
                      : '% of added papers reviewed per week'}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    % of added papers reviewed
                  </Typography>
                </Stack>

                <Divider sx={{ mb: 1 }} />

                {/* Chart */}
                <Box sx={{ flex: 1 }}>
                  {weeklyEfficiencyRows.some(r => r.efficiency > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weeklyEfficiencyRows}
                        margin={{ top: 16, right: 24, left: 8, bottom: 32 }}
                        barCategoryGap={12}
                      >
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis
                          dataKey="label"
                          tickMargin={12}
                          interval="preserveEnd"
                        />

                        <YAxis
                          unit="%"
                          allowDecimals={false}
                          domain={[0, (dataMax) =>
                            Math.max(20, Math.ceil(dataMax / 10) * 10)
                          ]}
                        />

                        <Tooltip
                          formatter={(value, _, { payload }) => [
                            `${value}%`,
                            `Reviewed ${payload.reviewed ?? 0} / Added ${payload.added ?? 0}`,
                          ]}
                          labelFormatter={(label) => `Week ${label}`}
                        />

                        {/* Target benchmark */}
                        <ReferenceLine
                          y={70}
                          stroke="#EF4444"
                          strokeDasharray="3 3"
                          label={{
                            value: 'Target 70%',
                            position: 'right',
                            fill: '#EF4444',
                            fontSize: 11,
                          }}
                        />

                        <Bar
                          dataKey="efficiency"
                          name="Review Efficiency"
                          fill="#22C55E"
                          radius={[4, 4, 0, 0]}
                        >
                          <LabelList
                            dataKey="efficiency"
                            position="top"
                            formatter={(v) => (v > 0 ? `${v}%` : '')}
                            style={{
                              fill: '#1F2937',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No reviews completed in the selected period.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>


            {/* Year-wise Paper Distribution (50%) */}
            <Grid item xs={12} md={5} sx={{ height: '100%' }}>
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
                  <Typography variant="subtitle1">
                    Papers by Publication Year
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Year-wise count
                  </Typography>
                </Stack>

                <Divider sx={{ mb: 1 }} />

                <Box sx={{ flex: 1 }}>
                  {yearlyRows.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={yearlyRows}
                        margin={{ left: 16, right: 16, top: 12, bottom: 48 }}
                        barCategoryGap={12}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="papers"
                          name="Total Papers"
                          fill="#6366F1"
                          radius={[4, 4, 0, 0]}
                        >
                          <LabelList
                            dataKey="papers"
                            position="top"
                            style={{ fill: '#1F2937', fontSize: 12, fontWeight: 600 }}
                          />
                        </Bar>

                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No year-wise data available.
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
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
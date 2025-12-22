// src/pages/monitoring/Users.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Paper, Stack, Button, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, TablePagination, Typography, Chip, Avatar, Snackbar, Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import { loadUsers, selectUsersState } from '../../store/usersSlice';

function formatDate(dt) {
  if (!dt) return '-';
  try { return new Date(dt).toLocaleString(); } catch { return dt; }
}

export default function Users() {
  const dispatch = useDispatch();
  const usersState = useSelector(selectUsersState) || {};

  const rows = usersState.rows ?? [];
  const total = usersState.total ?? usersState.meta?.total ?? rows.length;
  const current_page = usersState.current_page ?? usersState.meta?.current_page ?? 1;
  const per_page = usersState.per_page ?? usersState.meta?.per_page ?? 25;
  const loading = usersState.loading ?? false;
  const error = usersState.error ?? null;

  const [page, setPage] = React.useState(current_page - 1);
  const [perPage, setPerPage] = React.useState(per_page);
  const [query, setQuery] = React.useState('');
  const [toast, setToast] = React.useState({ open: false, severity: 'info', message: '' });

  React.useEffect(() => {
    setPage(current_page - 1);
    setPerPage(per_page);
  }, [current_page, per_page]);

  React.useEffect(() => {
    dispatch(loadUsers({ search: '', page: 1, per_page: perPage }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // debounce search
  React.useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      dispatch(loadUsers({ search: query?.trim() || '', page: 1, per_page: perPage }));
    }, 350);
    return () => clearTimeout(t);
  }, [query, dispatch, perPage]);

  const handleChangePage = (_e, newPage) => {
    setPage(newPage);
    dispatch(loadUsers({ search: query?.trim() || '', page: newPage + 1, per_page: perPage }));
  };

  const handleChangeRowsPerPage = (e) => {
    const rp = parseInt(e.target.value, 10);
    setPerPage(rp);
    setPage(0);
    dispatch(loadUsers({ search: query?.trim() || '', page: 1, per_page: rp }));
  };

  const handleSearchChange = (vOrEvent) => {
    const v = typeof vOrEvent === 'string' ? vOrEvent : (vOrEvent?.target?.value ?? '');
    setQuery(v);
  };

  React.useEffect(() => {
    if (error) setToast({ open: true, severity: 'error', message: String(error) });
  }, [error]);

  const handleRefresh = () => {
    dispatch(loadUsers({ search: query?.trim() || '', page: page + 1, per_page: perPage }));
  };

  const handleCloseToast = () => setToast(t => ({ ...t, open: false }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Users" subtitle="List of registered users — server-side paginated." actions={<Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>Refresh</Button></Stack>} />

      <Paper sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ mb: 1.5 }}>
          <SearchBar value={query} onChange={handleSearchChange} placeholder="Search name, email, role…" />
        </Box>

        {loading ? <Typography sx={{ p: 2 }}>Loading…</Typography> : error ? <Typography color="error" sx={{ p: 2 }}>{String(error)}</Typography> : (
          <TableContainer sx={{ flex: 1, maxHeight: 'calc(100vh - 230px)', overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Subscription</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Trial</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Created At</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.length === 0 ? <TableRow><TableCell colSpan={7}><EmptyState hint="No users found." /></TableCell></TableRow> : rows.map((u) => (
                  <TableRow hover key={u.id}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {u.avatar ? <Avatar src={u.avatar} sx={{ width: 28, height: 28 }} /> : <Avatar sx={{ width: 28, height: 28, fontSize: 13 }}>{(u.name || 'U').split(' ').map(x => x?.[0]).slice(0,2).join('').toUpperCase()}</Avatar>}
                        <Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{u.name || '-'}</Typography><Typography variant="caption" color="text.secondary">{u.phone || ''}</Typography></Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{u.email || '-'}</TableCell>
                    <TableCell><Chip size="small" label={u.role || '-'} variant="outlined" color={u.role === 'admin' ? 'error' : u.role === 'supervisor' ? 'secondary' : u.role === 'superuser' ? 'primary' : 'default'} /></TableCell>
                    <TableCell>{u.plan_key || '-'}</TableCell>
                    <TableCell><Chip size="small" label={u.subscription_status || (u.status || '-')} variant="outlined" color={u.subscription_status === 'active' ? 'success' : u.subscription_status === 'trial' ? 'warning' : 'default'} /></TableCell>
                    <TableCell>{u.is_on_trial ? (u.trial_days_remaining != null ? `${u.trial_days_remaining} days` : 'On trial') : '—'}</TableCell>
                    <TableCell>{formatDate(u.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <TablePagination component="div" count={total} page={page} onPageChange={handleChangePage} rowsPerPage={perPage} onRowsPerPageChange={handleChangeRowsPerPage} rowsPerPageOptions={[10,25,50,100]} showFirstButton showLastButton />
        </Box>
      </Paper>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}><Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>{toast.message}</Alert></Snackbar>
    </Box>
  );
}

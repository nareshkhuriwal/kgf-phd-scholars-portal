// src/pages/monitoring/Payments.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Paper, Stack, Button, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, TablePagination, Typography, Chip, Snackbar, Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import { loadPayments, selectPaymentsState } from '../../store/paymentsSlice';

function formatAmount(amount, currency = 'INR') {
  if (amount == null) return '-';
  const rupees = (Number(amount) / 100).toFixed(2);
  return `${rupees} ${currency} (raw: ${amount})`;
}

export default function Payments() {
  const dispatch = useDispatch();
  const paymentsState = useSelector(selectPaymentsState) || {};

  // canonical source of rows and paginator (slices store these fields)
  const rows = paymentsState.rows ?? [];
  const total = paymentsState.total ?? paymentsState.meta?.total ?? rows.length;
  const current_page = paymentsState.current_page ?? paymentsState.meta?.current_page ?? 1;
  const per_page = paymentsState.per_page ?? paymentsState.meta?.per_page ?? 25;
  const loading = paymentsState.loading ?? false;
  const error = paymentsState.error ?? null;

  // UI state (MUI is zero-based page)
  const [page, setPage] = React.useState(current_page - 1);
  const [perPage, setPerPage] = React.useState(per_page);
  const [query, setQuery] = React.useState('');
  const [toast, setToast] = React.useState({ open: false, severity: 'info', message: '' });

  // Sync UI when slice updates paginator from server
  React.useEffect(() => {
    setPage(current_page - 1);
    setPerPage(per_page);
  }, [current_page, per_page]);

  // initial load
  React.useEffect(() => {
    dispatch(loadPayments({ q: '', page: 1, per_page: perPage }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Debounce search: when `query` changes, call server after delay
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      dispatch(loadPayments({ q: query?.trim() || '', page: 1, per_page: perPage }));
    }, 350);
    return () => clearTimeout(timer);
  }, [query, dispatch, perPage]);

  // Page/perPage handlers call server
  const handleChangePage = (_e, newPage) => {
    setPage(newPage);
    dispatch(loadPayments({ q: query?.trim() || '', page: newPage + 1, per_page: perPage }));
  };

  const handleChangeRowsPerPage = (e) => {
    const rp = parseInt(e.target.value, 10);
    setPerPage(rp);
    setPage(0);
    dispatch(loadPayments({ q: query?.trim() || '', page: 1, per_page: rp }));
  };

  // When user types, accept both event and string signatures
  const handleSearchChange = (vOrEvent) => {
    const v = typeof vOrEvent === 'string' ? vOrEvent : (vOrEvent?.target?.value ?? '');
    setQuery(v);
  };

  React.useEffect(() => {
    if (error) setToast({ open: true, severity: 'error', message: String(error) });
  }, [error]);

  const handleRefresh = () => {
    dispatch(loadPayments({ q: query?.trim() || '', page: page + 1, per_page: perPage }));
  };

  const handleCloseToast = () => setToast(t => ({ ...t, open: false }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Payments"
        subtitle="Payments received by users — server-side paginated."
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>Refresh</Button>
          </Stack>
        }
      />

      <Paper sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ mb: 1.5 }}>
          <SearchBar value={query} onChange={handleSearchChange} placeholder="Search order id, payment id, user id, currency, amount…" />
        </Box>

        {loading ? (
          <Typography sx={{ p: 2 }}>Loading…</Typography>
        ) : error ? (
          <Typography color="error" sx={{ p: 2 }}>{String(error)}</Typography>
        ) : (
          <TableContainer sx={{ flex: 1, maxHeight: 'calc(100vh - 240px)', overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Order ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Payment ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>User Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Plan Key</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Plan Label</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Currency</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Created At</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow><TableCell colSpan={11}><EmptyState hint="No payments found." /></TableCell></TableRow>
                ) : rows.map((p) => (
                  <TableRow hover key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell title={p.razorpay_order_id}>{p.razorpay_order_id || '-'}</TableCell>
                    <TableCell title={p.razorpay_payment_id}>{p.razorpay_payment_id || '-'}</TableCell>
                    <TableCell>{p.user?.name || '-'}</TableCell>
                    <TableCell>{p.user?.email || '-'}</TableCell>
                    <TableCell>{p.plan_key || '-'}</TableCell>
                    <TableCell>{p.meta?.plan_label || (p.plan_key || '-')}</TableCell>
                    <TableCell>{formatAmount(p.amount, p.currency)}</TableCell>
                    <TableCell>{p.currency || '-'}</TableCell>
                    <TableCell>
                      <Chip label={p.status || '-'} size="small" variant="outlined" color={p.status === 'paid' ? 'success' : (p.status === 'failed' ? 'error' : 'default')} />
                    </TableCell>
                    <TableCell>{p.created_at ? new Date(p.created_at).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={perPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            showFirstButton
            showLastButton
          />
        </Box>
      </Paper>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}

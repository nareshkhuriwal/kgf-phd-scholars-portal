import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadInvites,
  sendInvite,
  revokeInvite,
  selectResearchersState,
} from '../../store/researchersSlice';

import {
  Paper,
  Box,
  Stack,
  Button,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  LinearProgress,
} from '@mui/material';
import SearchBar from '../../components/SearchBar';

import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import PageHeader from '../../components/PageHeader';

export default function Researchers() {
  const dispatch = useDispatch();
  const { rows, loading, error, sent, page, perPage, total } =
    useSelector(selectResearchersState);
  const [query, setQuery] = React.useState('');

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    researcher_email: '',
    message: 'You have been invited to join the KGF Scholars research platform.',
  });
  const [snack, setSnack] = React.useState({
    open: false,
    severity: 'success',
    msg: '',
  });

  React.useEffect(() => {
    dispatch(loadInvites({ page: 1, perPage: 10 }));
  }, [dispatch]);

  const openDialog = () => setInviteOpen(true);
  const closeDialog = () => setInviteOpen(false);

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSend = async () => {
    const ok = await dispatch(sendInvite(form))
      .unwrap()
      .then(() => true)
      .catch((e) => {
        setSnack({
          open: true,
          severity: 'error',
          msg: e?.message || 'Failed to send invite',
        });
        return false;
      });

    if (ok) {
      setSnack({
        open: true,
        severity: 'success',
        msg: 'Invite sent',
      });
      closeDialog();
      setForm({
        researcher_email: '',
        message: '',
      });
      dispatch(loadInvites({ page: 1, perPage }));
    }
  };

  const onRevoke = async (id) => {
    await dispatch(revokeInvite(id));
    dispatch(loadInvites({ page, perPage }));
  };

  const handlePageChange = (_e, newPage) =>
    dispatch(loadInvites({ page: newPage + 1, perPage }));

  const handleRowsChange = (e) =>
    dispatch(
      loadInvites({ page: 1, perPage: parseInt(e.target.value, 10) })
    );

  return (
    <Box>
      <PageHeader
        title="Researchers"
        subtitle="Invite researchers to review and collaborate under their supervisor."
        actions={
          <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Button
            onClick={openDialog}
            variant="contained"
            startIcon={<PersonAddAltIcon />}
          >
            Invite Researcher
          </Button>
        </Stack>
        }
      />

      <Paper sx={{ p: 2 }}>
         <Box sx={{ mb: 1.5 }}>
                  <SearchBar value={query} onChange={setQuery} placeholder="Search saved researchers…" />
                </Box>

        {loading && <LinearProgress sx={{ mb: 1 }} />}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 60 }}>ID</TableCell> 
                <TableCell>Researcher</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Sent On</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary">
                      No invitations yet. Click &quot;Invite Researcher&quot;.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.researcher_name || '-'}</TableCell>
                  <TableCell>{r.researcher_email}</TableCell>
                  <TableCell>{r.sent_at_display || r.sent_at}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.status}
                      color={
                        r.status === 'Accepted'
                          ? 'success'
                          : r.status === 'Pending'
                          ? 'warning'
                          : r.status === 'Expired'
                          ? 'default'
                          : 'info'
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Revoke invite">
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => onRevoke(r.id)}
                          disabled={r.status !== 'pending'}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          rowsPerPage={perPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsChange}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Paper>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Researcher</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Researcher Email"
              name="researcher_email"
              value={form.researcher_email}
              onChange={onChange}
              type="email"
              required
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={onSend}>
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

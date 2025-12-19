// src/pages/supervisors/Supervisors.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Stack,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { isAdminRole } from '../../utils/roles';

import SupervisorFormDialog from '../../components/supervisors/SupervisorFormDialog';
import {
  loadSupervisors,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor,
  selectSupervisorsState,
} from '../../store/supervisorsSlice';

export default function Supervisors() {
  const dispatch = useDispatch();
  const { rows, loading, error, saving } = useSelector(selectSupervisorsState);

  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rpp, setRpp] = React.useState(10);

  const [editItem, setEditItem] = React.useState(null);
  const [formOpen, setFormOpen] = React.useState(false);

  const [toDelete, setToDelete] = React.useState(null);

  const { user } = useSelector((s) => s.auth || {});
  const canManage = isAdminRole(user?.role);



  // Toast state
  const [toast, setToast] = React.useState({
    open: false,
    severity: 'info',
    message: '',
  });

  React.useEffect(() => {
    dispatch(loadSupervisors());
  }, [dispatch]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows || [];
    return (rows || []).filter((s) =>
      [s.name, s.email, s.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, query]);

  const start = page * rpp;
  const viewRows = filtered.slice(start, start + rpp);

  const handleOpenCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditItem(row);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditItem(null);
  };

  const handleSubmitForm = async (data) => {
    let action;

    if (editItem?.id) {
      // Update existing supervisor
      action = await dispatch(updateSupervisor({ id: editItem.id, data }));
    } else {
      // Create new supervisor (ensure role=supervisor if backend expects it)
      action = await dispatch(createSupervisor({ ...data, role: 'supervisor' }));
    }

    // If rejected → show error toast (e.g. "The email has already been taken.")
    if (createSupervisor.rejected.match(action) || updateSupervisor.rejected.match(action)) {
      const msg =
        action.payload ||
        action.error?.message ||
        'Failed to save supervisor';

      setToast({
        open: true,
        severity: 'error',
        message: msg,
      });

      // keep dialog open so user can fix fields
      return;
    }

    // If fulfilled → success toast + close dialog
    setToast({
      open: true,
      severity: 'success',
      message: editItem?.id
        ? 'Supervisor updated successfully'
        : 'Supervisor created successfully',
    });

    setFormOpen(false);
    setEditItem(null);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const action = await dispatch(deleteSupervisor(toDelete.id));

    if (deleteSupervisor.rejected.match(action)) {
      const msg =
        action.payload ||
        action.error?.message ||
        'Failed to delete supervisor';

      setToast({
        open: true,
        severity: 'error',
        message: msg,
      });
    } else {
      setToast({
        open: true,
        severity: 'success',
        message: 'Supervisor deleted successfully',
      });
    }

    setToDelete(null);
  };

  const handleCloseToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((t) => ({ ...t, open: false }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Supervisors"
        subtitle="Manage supervisor accounts for your scholars."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => dispatch(loadSupervisors())}
            >
              Refresh
            </Button>
            {/* <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Add Supervisor
            </Button> */}

            {canManage && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
              >
                Add Supervisor
              </Button>
            )}


          </Stack>
        }
      />

      <Paper
        sx={{
          p: 1.5,
          border: '1px solid #eee',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <Box sx={{ mb: 1.5 }}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name, email, notes…"
          />
        </Box>

        {loading ? (
          <Typography sx={{ p: 2 }}>Loading…</Typography>
        ) : error ? (
          <Typography color="error" sx={{ p: 2 }}>
            {String(error)}
          </Typography>
        ) : (
          <TableContainer
            sx={{
              flex: 1,
              maxHeight: 'calc(100vh - 230px)',
              overflow: 'auto',
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>
                    Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>
                    Email
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 140 }}>
                    Role
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>
                    Notes
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 140 }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState hint="No supervisors found. Click 'Add Supervisor' to create one." />
                    </TableCell>
                  </TableRow>
                ) : (
                  viewRows.map((s) => (
                    <TableRow hover key={s.id}>
                      <TableCell>{s.name || '-'}</TableCell>
                      <TableCell>{s.email || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={s.role || 'Supervisor'}
                          color="secondary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={s.notes || ''}
                        >
                          {s.notes || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit supervisor">
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEdit(s)}
                              >
                                <EditIcon fontSize="inherit" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Delete supervisor">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setToDelete(s)}
                              >
                                <DeleteOutlineIcon fontSize="inherit" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_e, p) => setPage(p)}
            rowsPerPage={rpp}
            onRowsPerPageChange={(e) => {
              setRpp(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            showFirstButton
            showLastButton
          />
        </Box>
      </Paper>

      {/* Add/Edit form dialog */}
      <SupervisorFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        initialData={editItem}
        saving={saving}
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete supervisor?"
        content={
          toDelete
            ? `Supervisor "${toDelete.name || toDelete.email}" will be deleted.`
            : ''
        }
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
        confirmText="Delete"
        confirmColor="error"
        loading={saving}
      />

      {/* Toast (top-right) */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

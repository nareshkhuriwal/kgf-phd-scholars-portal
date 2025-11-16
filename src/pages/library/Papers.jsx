// src/pages/library/Papers.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadPapers, removePaper, removePapersBulk } from '../../store/papersSlice';
import { useNavigate, Link } from 'react-router-dom';
import { addToQueue } from '../../store/reviewsSlice';

import {
  Paper,
  Box,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Stack,
  Typography,
  CircularProgress,
  Checkbox,
  Toolbar,
  Snackbar,
  Alert
} from '@mui/material';

import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RateReviewIcon from '@mui/icons-material/RateReview';



// --- helpers to read fields regardless of API casing ---
const val = (row, keys) => {
  for (const k of keys) {
    if (row && row[k] != null && row[k] !== '') return row[k];
  }
  return '';
};
const idOf = (r) => r?.id ?? r?.['Paper ID'] ?? r?.paper_id;

export default function Papers() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading, error } = useSelector(s => s.papers || { list: [], loading: false, error: null });

  // load once
  React.useEffect(() => { dispatch(loadPapers()); }, [dispatch]);

  // state
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRpp] = React.useState(10);
  const [confirm, setConfirm] = React.useState(null);     // single delete confirm (stores row)
  const [bulkCfm, setBulkCfm] = React.useState(null);     // bulk delete confirm (stores ids)
  const [selected, setSelected] = React.useState([]);       // selected ids

  // toast state
  const [snack, setSnack] = React.useState({ open: false, msg: '', sev: 'success' });
  const openSnack = (msg, sev = 'success') => setSnack({ open: true, msg, sev });
  const closeSnack = () => setSnack(s => ({ ...s, open: false }));

  // normalize list -> array
  const all = React.useMemo(() => {
    if (Array.isArray(list)) return list;
    if (list && Array.isArray(list.data)) return list.data;
    return [];
  }, [list]);

  const meta = list?.meta || {};

  // search (client-side)
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(r => {
      const s = [
        val(r, ['title', 'Title']),
        val(r, ['authors', 'Author(s)']),
        val(r, ['year', 'Year']),
        val(r, ['doi', 'DOI']),
        val(r, ['journal', 'Name of Journal/Conference']),
        val(r, ['category', 'Category of Paper'])
      ].join(' ').toLowerCase();
      return s.includes(q);
    });
  }, [all, query]);

  // paginate (client-side for now)
  // const start = page * rowsPerPage;
  // const rows = filtered.slice(start, start + rowsPerPage);
  const rows = filtered;

  // ----- selection helpers -----
  const pageIds = React.useMemo(() => rows.map(idOf).filter(Boolean), [rows]);
  const pageSelCount = pageIds.filter(id => selected.includes(id)).length;
  const pageAllChecked = pageSelCount > 0 && pageSelCount === pageIds.length;
  const pageSomeChecked = pageSelCount > 0 && pageSelCount < pageIds.length;

  const toggleAllOnPage = (checked) => {
    if (!pageIds.length) return;
    setSelected(prev => {
      const set = new Set(prev);
      if (checked) pageIds.forEach(id => set.add(id));
      else pageIds.forEach(id => set.delete(id));
      return Array.from(set);
    });
  };

  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const clearSelection = () => setSelected([]);

  // ----- single delete -----
  const handleDelete = async () => {
    if (!confirm) return;
    const id = idOf(confirm);
    setConfirm(null);
    if (id) await dispatch(removePaper(id));
    setSelected(prev => prev.filter(x => x !== id));
  };

  // ----- bulk delete -----
  const askBulkDelete = () => {
    if (selected.length === 0) return;
    setBulkCfm({
      title: 'Delete selected papers?',
      message: `You are about to delete ${selected.length} paper(s). This will also remove their attached files.`,
      ids: [...selected]
    });
  };

  const doBulkDelete = async () => {
    if (!bulkCfm?.ids?.length) { setBulkCfm(null); return; }
    try {
      await dispatch(removePapersBulk(bulkCfm.ids)).unwrap();
    } finally {
      setBulkCfm(null);
      clearSelection();
    }
  };

  // ----- add to review (single) with toast -----
  const handleReview = async (id) => {
    try {
      await dispatch(addToQueue(id)).unwrap?.() ?? dispatch(addToQueue(id));
      openSnack('Added to review queue', 'success');
    } catch (e) {
      openSnack(e?.message || 'Failed to add to review queue', 'error');
    }
  };

  // ----- bulk: add to review queue (optional toast) -----
  const addSelectedToQueue = async () => {
    let ok = 0, fail = 0;
    for (const id of selected) {
      try { await dispatch(addToQueue(id)).unwrap?.() ?? dispatch(addToQueue(id)); ok++; }
      catch { fail++; }
    }
    openSnack(`Queued ${ok} paper(s)${fail ? `, ${fail} failed` : ''}`, fail ? 'warning' : 'success');
  };


  console.log("meta: ", meta)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Library — Papers"
        subtitle="Your master library (imported, uploaded, or synced)"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => window.open('/api/papers/export?format=csv', '_blank')}>
              Export CSV
            </Button>
            <Button variant="contained" onClick={() => navigate('/library/papers/new')}>
              Add Paper
            </Button>
          </Stack>
        }
      />

      {/* Bulk selection toolbar */}
      {selected.length > 0 && (
        <Toolbar
          sx={{
            bgcolor: 'rgba(0,0,0,0.03)',
            borderTop: '1px solid #eee',
            borderBottom: '1px solid #eee',
            gap: 1
          }}
        >
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {selected.length} selected
          </Typography>
          <Button size="small" variant="outlined" onClick={addSelectedToQueue}>
            Add to Review Queue
          </Button>
          <Button size="small" color="error" variant="contained" onClick={askBulkDelete}>
            Delete Selected
          </Button>
          <Button size="small" color="inherit" onClick={clearSelection}>
            Clear
          </Button>
        </Toolbar>
      )}

      <Paper sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ mb: 1.5 }}>
          <SearchBar
            value={query}
            onChange={(v) => { setQuery(v); setPage(0); }}
            placeholder="Search title, authors, year, DOI…"
          />
        </Box>

        {loading ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Typography color="error">Failed to load papers: {String(error)}</Typography>
            <Button size="small" sx={{ mt: 1 }} onClick={() => dispatch(loadPapers())}>Retry</Button>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ flex: 1, maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 48, bgcolor: '#f7f7f9' }} padding="checkbox">
                      <Checkbox
                        indeterminate={pageSomeChecked}
                        checked={pageAllChecked}
                        onChange={(e) => toggleAllOnPage(e.target.checked)}
                        inputProps={{ 'aria-label': 'select all on page' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Authors</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Year</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>DOI</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 220 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <EmptyState hint={query ? 'No matches. Clear the search.' : 'Try importing or uploading papers.'} />
                      </TableCell>
                    </TableRow>
                  ) : rows.map(r => {
                    const id = idOf(r);
                    const checked = selected.includes(id);
                    const title = val(r, ['title', 'Title']) || '(Untitled)';
                    return (
                      <TableRow hover key={String(id)} selected={checked}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={checked}
                            onChange={() => toggleOne(id)}
                            inputProps={{ 'aria-label': `select paper ${id}` }}
                          />
                        </TableCell>
                        <TableCell>{id}</TableCell>

                        {/* Title clickable -> view/edit page */}
                        <TableCell>
                          <Typography
                            component={Link}
                            to={`/library/papers/${id}/view`}
                            sx={{
                              textDecoration: 'none',
                              color: 'primary.main',
                              '&:hover': { textDecoration: 'underline' },
                              cursor: 'pointer'
                            }}
                          >
                            {title}
                          </Typography>
                        </TableCell>

                        <TableCell>{val(r, ['authors', 'Author(s)'])}</TableCell>
                        <TableCell>{val(r, ['year', 'Year'])}</TableCell>
                        <TableCell>{val(r, ['doi', 'DOI'])}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="nowrap">
                            <Tooltip title="Edit paper">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/library/papers/${id}`)}
                                >
                                  <EditIcon fontSize="inherit" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Delete paper">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setConfirm(r)}
                                >
                                  <DeleteIcon fontSize="inherit" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Review paper">
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleReview(id)}
                                >
                                  <RateReviewIcon fontSize="inherit" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>


                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              {/* <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_e, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRpp(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                showFirstButton showLastButton
              /> */}

              <TablePagination
  component="div"
  // ✅ total number of rows from backend
  count={meta.total ?? filtered.length}

  // ✅ MUI page is 0-based, Laravel page is 1-based
  page={meta.current_page ? meta.current_page - 1 : page}

  onPageChange={(_e, newPage) => {
    setPage(newPage);
    // 🔁 load that page from API (adjust params to your loadPapers)
    dispatch(loadPapers({ page: newPage + 1, perPage: rowsPerPage }));
  }}

  // ✅ rows per page – keep your local state, or use meta.per_page
  rowsPerPage={rowsPerPage}

  onRowsPerPageChange={e => {
    const next = parseInt(e.target.value, 10);
    setRpp(next);
    setPage(0);
    // reload from page 1 with new per-page size
    dispatch(loadPapers({ page: 1, perPage: next }));
  }}

  rowsPerPageOptions={[10, 25, 50, 100]}
  showFirstButton
  showLastButton
/>

            </Box>
          </>
        )}
      </Paper>

      {/* Single delete confirm */}
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete paper?"
        content={`This will remove "${val(confirm, ['title', 'Title'])}" from your library.`}
        onCancel={() => setConfirm(null)}
        onConfirm={handleDelete}
        confirmText="Delete"
      />

      {/* Bulk delete confirm */}
      <ConfirmDialog
        open={Boolean(bulkCfm)}
        title={bulkCfm?.title || 'Delete selected papers?'}
        content={bulkCfm?.message || `You are about to delete ${selected.length} paper(s).`}
        onCancel={() => setBulkCfm(null)}
        onConfirm={doBulkDelete}
        confirmText="Delete"
      />

      {/* Toast */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnack} severity={snack.sev} variant="filled" sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

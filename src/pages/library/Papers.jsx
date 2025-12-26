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
  Alert,
  TableSortLabel
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
import { useTheme, useMediaQuery } from '@mui/material';
import { initialsOf } from '../../utils/text/cleanRich';

// --- helpers to read fields regardless of API casing ---
const val = (row, keys) => {
  for (const k of keys) {
    if (row && row[k] != null && row[k] !== '') return row[k];
  }
  return '';
};
const idOf = (r) => r?.id ?? r?.['Paper ID'] ?? r?.paper_id;

// Map displayed column keys to backend fields (used for sort param)
const COLUMN_TO_FIELD = {
  id: 'id',
  title: 'title',
  authors: 'authors',
  year: 'year',
  doi: 'doi',
  created_by: 'created_by'
};

// Helper to get value for sorting (normalize numbers)
const sortValue = (row, field) => {
  if (!row) return '';
  switch (field) {
    case 'id':
      return Number(idOf(row)) || 0;
    case 'title':
      return (val(row, ['title', 'Title']) || '').toString().toLowerCase();
    case 'authors':
      return (val(row, ['authors', 'Author(s)']) || '').toString().toLowerCase();
    case 'year':
      // year may be string or number
      return Number(val(row, ['year', 'Year'])) || 0;
    case 'doi':
      return (val(row, ['doi', 'DOI']) || '').toString().toLowerCase();
    case 'created_by':
      return (val(row, ['created_by', 'CreatedBy']) || '').toString().toLowerCase();
    default:
      return (val(row, [field]) || '').toString().toLowerCase();
  }
};

// comparator returns -1/0/1
const compare = (a, b, field, dir = 'asc') => {
  const va = sortValue(a, field);
  const vb = sortValue(b, field);
  if (va < vb) return dir === 'asc' ? -1 : 1;
  if (va > vb) return dir === 'asc' ? 1 : -1;
  return 0;
};

export default function Papers() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // read list + meta from store (meta used for pagination)
  const { list, meta, loading, error } = useSelector(s => s.papers || { list: [], meta: null, loading: false, error: null });

  // local UI state
  const [query, setQuery] = React.useState('');
  const PAPERS_PAGINATION_KEY = 'papers.pagination';

  // const [page, setPage] = React.useState(0);            // MUI 0-based
  // const [rowsPerPage, setRpp] = React.useState(10);

  const savedPagination = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(PAPERS_PAGINATION_KEY)) || {};
    } catch {
      return {};
    }
  }, []);

  const [page, setPage] = React.useState(savedPagination.page ?? 0);
  const [rowsPerPage, setRpp] = React.useState(savedPagination.rowsPerPage ?? 10);


  const [confirm, setConfirm] = React.useState(null);
  const [bulkCfm, setBulkCfm] = React.useState(null);
  const [selected, setSelected] = React.useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const userRole = useSelector(s => s.auth?.user?.role);
  const isResearcher = userRole === 'researcher';




  // sorting state
  const [sortBy, setSortBy] = React.useState('title');     // use backend field names (id, title, authors, year, doi)
  const [sortDir, setSortDir] = React.useState('asc'); // 'asc' | 'desc'

  // toast
  const [snack, setSnack] = React.useState({ open: false, msg: '', sev: 'success' });
  const openSnack = (msg, sev = 'success') => setSnack({ open: true, msg, sev });
  const closeSnack = () => setSnack(s => ({ ...s, open: false }));

  // load once on mount — request server with current rowsPerPage & current sort
  const initialLoaded = React.useRef(false);


  // React.useEffect(() => {
  //   if (!initialLoaded.current) {
  //     dispatch(loadPapers({ page: 1, perPage: rowsPerPage, sort_by: sortBy, sort_dir: sortDir }));
  //     initialLoaded.current = true;
  //   }
  // }, [dispatch, rowsPerPage, sortBy, sortDir]);

  React.useEffect(() => {
    if (initialLoaded.current) return;

    dispatch(loadPapers({
      page: page + 1,
      perPage: rowsPerPage,
      sort_by: sortBy,
      sort_dir: sortDir
    }));

    initialLoaded.current = true;
  }, [dispatch]); // 👈 run ONCE, using restored page


  // keep UI controls in sync with backend meta (when meta arrives)
  React.useEffect(() => {
    if (!meta) return;
    if (meta.per_page && meta.per_page !== rowsPerPage) {
      setRpp(meta.per_page);
    }
    if (meta.current_page !== undefined && (meta.current_page - 1) !== page) {
      setPage(meta.current_page - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);

  React.useEffect(() => {
    localStorage.setItem(
      PAPERS_PAGINATION_KEY,
      JSON.stringify({ page, rowsPerPage })
    );
  }, [page, rowsPerPage]);


  // ----- backend list -> array of rows -----
  const all = React.useMemo(() => {
    if (Array.isArray(list)) return list;
    if (list && Array.isArray(list.data)) return list.data;
    return [];
  }, [list]);

  // ----- search (client-side over current page's rows) -----
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

  // ----- sorting + pagination for display -----
  // If a search query is present we sort client-side (over `filtered`) then paginate locally.
  // If no query, rely on server-side sort (we asked server with sort_by/sort_dir) and display `all`.
  const rows = React.useMemo(() => {
    if (query) {
      // client side sort then paginate
      const fld = sortBy || 'id';
      const dir = sortDir || 'asc';
      const sorted = [...filtered].sort((a, b) => compare(a, b, fld, dir));
      const start = page * rowsPerPage;
      return sorted.slice(start, start + rowsPerPage);
    }
    // server pagination + sorting: `all` is already the page we received
    return all;
  }, [query, filtered, all, page, rowsPerPage, sortBy, sortDir]);

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


  const orderedIds = React.useMemo(
    () => rows.map(r => idOf(r)).filter(Boolean),
    [rows]
  );


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

  // ----- sorting: handler that requests server when no query, or only changes local sort if query active -----
  const handleSort = (colKey) => {
    const field = COLUMN_TO_FIELD[colKey] ?? colKey;
    const isSame = sortBy === field;
    const nextDir = isSame ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';

    setSortBy(field);
    setSortDir(nextDir);

    // reset to first page
    // setPage(0);
    // 
    // If there's an active search (client-side), we don't call server; sorting is applied client-side.
    if (query) {
      // rows will recompute because sortBy/sortDir changed (useMemo)
      return;
    }

    // otherwise call backend to request fresh sorted page
    // dispatch(loadPapers({
    //   page: 1,
    //   perPage: rowsPerPage,
    //   query: undefined,
    //   sort_by: field,
    //   sort_dir: nextDir
    // }));

    dispatch(loadPapers({
      page: page + 1, // 👈 KEEP CURRENT PAGE
      perPage: rowsPerPage,
      sort_by: field,
      sort_dir: nextDir
    }));


  };


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Library — Papers"
        subtitle="Your master library (imported, uploaded, or synced)"
        actions={
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
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
            <Button size="small" sx={{ mt: 1 }} onClick={() => dispatch(loadPapers({ page: 1, perPage: rowsPerPage, sort_by: sortBy, sort_dir: sortDir }))}>Retry</Button>
          </Box>
        ) : (
          <>
            <TableContainer
              sx={{
                flex: 1,
                overflowX: 'auto',
                maxHeight: isMobile ? 'none' : 'calc(100vh - 230px)',
              }}
            >
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

                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>
                      <TableSortLabel
                        active={sortBy === 'id'}
                        direction={sortBy === 'id' ? sortDir : 'asc'}
                        onClick={() => handleSort('id')}
                      >
                        ID
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>
                      <TableSortLabel
                        active={sortBy === 'title'}
                        direction={sortBy === 'title' ? sortDir : 'asc'}
                        onClick={() => handleSort('title')}
                      >
                        Title
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>
                      <TableSortLabel
                        active={sortBy === 'authors'}
                        direction={sortBy === 'authors' ? sortDir : 'asc'}
                        onClick={() => handleSort('authors')}
                      >
                        Authors
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>
                      <TableSortLabel
                        active={sortBy === 'year'}
                        direction={sortBy === 'year' ? sortDir : 'asc'}
                        onClick={() => handleSort('year')}
                      >
                        Year
                      </TableSortLabel>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>
                      <TableSortLabel
                        active={sortBy === 'doi'}
                        direction={sortBy === 'doi' ? sortDir : 'asc'}
                        onClick={() => handleSort('doi')}
                      >
                        DOI
                      </TableSortLabel>
                    </TableCell>

                    {!isResearcher && (
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>
                        <TableSortLabel
                          active={sortBy === 'created_by'}
                          direction={sortBy === 'created_by' ? sortDir : 'asc'}
                          onClick={() => handleSort('created_by')}
                        >
                          CreatedBy
                        </TableSortLabel>
                      </TableCell>
                    )}


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

                        {!isResearcher && (
                          <TableCell>
                            <Tooltip title={r?.creator?.name || 'Unknown user'}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <Stack
                                  alignItems="center"
                                  justifyContent="center"
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    bgcolor: 'grey.100',
                                    border: '1px solid',
                                    borderColor: 'grey.300',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: 'text.primary',
                                    letterSpacing: 0.5,
                                    userSelect: 'none',
                                  }}
                                >
                                  {initialsOf(r?.creator?.name || val(r, ['created_by', 'CreatedBy']))}
                                </Stack>

                                {/* Optional: show name on desktop only */}

                              </Stack>
                            </Tooltip>
                          </TableCell>
                        )}



                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="nowrap">
                            <Tooltip title="Edit paper">
                              <span>
                                <IconButton
                                  size="small"
                                  // onClick={() => navigate(`/library/papers/${id}`)}
                                  onClick={() => {
                                    const index = orderedIds.indexOf(id);

                                    navigate(`/library/papers/${id}`, {
                                      state: {
                                        from: 'papers-list',
                                        orderedIds,
                                        index,
                                      },
                                    });
                                  }}

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
              <TablePagination
                component="div"
                count={meta?.total ?? filtered.length}
                page={meta?.current_page ? meta.current_page - 1 : page}
                onPageChange={(_e, newPage) => {
                  setPage(newPage);
                  dispatch(loadPapers({
                    page: newPage + 1,
                    perPage: rowsPerPage,
                    query: query || undefined,
                    sort_by: !query ? sortBy : undefined,
                    sort_dir: !query ? sortDir : undefined
                  }));
                }}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => {
                  const next = parseInt(e.target.value, 10);
                  setRpp(next);
                  setPage(0);
                  dispatch(loadPapers({
                    page: 1,
                    perPage: next,
                    query: query || undefined,
                    sort_by: !query ? sortBy : undefined,
                    sort_dir: !query ? sortDir : undefined
                  }));
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

// src/pages/reviews/ReviewQueue.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Paper, Stack, Button, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, TablePagination, Chip, Typography, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { loadReviewQueue, removeFromQueue } from '../../store/reviewsSlice';
import ReviewCard from '../../components/reviews/ReviewCard';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTheme, useMediaQuery } from '@mui/material';
import { initialsOf } from '../../utils/text/cleanRich';
import useDebounce from '../../hooks/useDebounce';

const PAGINATION_KEY = 'reviewQueue.pagination';
const FILTERS_KEY = 'reviewQueue.filters';

export default function ReviewQueue() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const persisted = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(PAGINATION_KEY)) || {};
    } catch {
      return {};
    }
  }, []);

  const persistedFilters = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(FILTERS_KEY)) || {};
    } catch {
      return {};
    }
  }, []);

  const [confirm, setConfirm] = React.useState(null);

  // 🔽 SORT STATE
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const userRole = useSelector(s => s.auth?.user?.role);
  const isResearcher = userRole === 'researcher';

  const { queue, meta, loading, error } = useSelector(s => s.reviews);

  const [page, setPage] = React.useState(persisted.page ?? 0);
  const [rpp, setRpp] = React.useState(persisted.rpp ?? 10);

  // const [query, setQuery] = React.useState('');
  // const [status, setStatus] = React.useState('');
  // const [sortBy, setSortBy] = React.useState('updated_at');
  // const [sortDir, setSortDir] = React.useState('desc');

  const [query, setQuery] = React.useState(persistedFilters.query ?? '');
  const [status, setStatus] = React.useState(persistedFilters.status ?? '');
  const [paperId, setPaperId] = React.useState(persistedFilters.paperId ?? '');
  const [sortBy, setSortBy] = React.useState(persistedFilters.sortBy ?? 'updated_at');
  const [sortDir, setSortDir] = React.useState(persistedFilters.sortDir ?? 'desc');

  const debouncedQuery = useDebounce(query, 400);


  const STATUS_OPTIONS = React.useMemo(() => ([
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Reviewed' },
    { value: 'archived', label: 'Archived' },
  ]), []);

  const rows = queue || [];


  React.useEffect(() => {
    dispatch(loadReviewQueue({
      page: page + 1,
      perPage: rpp,
      search: debouncedQuery || undefined,
      status: status || undefined,
      sort_by: sortBy,
      sort_dir: sortDir,
    }));
  }, [dispatch, page, rpp, debouncedQuery, status, sortBy, sortDir]);


  React.useEffect(() => {
    localStorage.setItem(
      PAGINATION_KEY,
      JSON.stringify({ page, rpp })
    );
  }, [page, rpp]);

  React.useEffect(() => {
    localStorage.setItem(
      FILTERS_KEY,
      JSON.stringify({
        query,
        status,
        paperId,
        sortBy,
        sortDir,
      })
    );
  }, [query, status, paperId, sortBy, sortDir]);


  // 🔽 SORT HANDLER
  const onSort = (col) => {
    if (sortBy !== col) {
      setSortBy(col);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortBy(null);
      setSortDir('asc');
    }
    setPage(0);
  };



  const sortIcon = (col) =>
    sortBy === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Reviews — Queue"
        subtitle="Papers you’ve queued up to review"
        actions={
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <Button
              variant="outlined"
              onClick={() => dispatch(loadReviewQueue())}
              fullWidth={isMobile}
            >
              Refresh
            </Button>
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

          <Stack direction="row" spacing={2}>
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search title, authors, DOI…"
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={status}
                displayEmpty
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">
                  <em>All Status</em>
                </MenuItem>

                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="done">Reviewed</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>

          </Stack>

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
              overflowX: 'auto',
              maxHeight: isMobile ? 'none' : 'calc(100vh - 230px)',
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: 600, bgcolor: '#f7f7f9', cursor: 'pointer' }}
                    onClick={() => onSort('id')}
                  >
                    ID{sortIcon('id')}
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, bgcolor: '#f7f7f9', cursor: 'pointer' }}
                    onClick={() => onSort('title')}
                  >
                    Paper{sortIcon('title')}
                  </TableCell>

                  {!isMobile && (
                    <TableCell sx={{ fontWeight: 600 }} onClick={() => onSort('authors')}>
                      Authors{sortIcon('authors')}
                    </TableCell>
                  )}

                  <TableCell
                    sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 90, cursor: 'pointer' }}
                    onClick={() => onSort('year')}
                  >
                    Year{sortIcon('year')}
                  </TableCell>

                  {!isTablet && !isMobile && (
                    <TableCell sx={{ fontWeight: 600 }} onClick={() => onSort('doi')}>
                      DOI{sortIcon('doi')}
                    </TableCell>
                  )}

                  <TableCell
                    sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 160, cursor: 'pointer' }}
                    onClick={() => onSort('review_status')}
                  >
                    Status{sortIcon('review_status')}
                  </TableCell>

                  {!isResearcher && !isMobile && (
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 160 }}>
                      Created By
                    </TableCell>
                  )}


                  {!isMobile && (
                    <TableCell sx={{ fontWeight: 600 }} onClick={() => onSort('updated_at')}>
                      Updated At{sortIcon('updated_at')}
                    </TableCell>
                  )}


                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 220 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState hint="Add papers to the review queue from Library or Collections." />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map(r => (
                    <TableRow hover key={r.id}>
                      <TableCell>
                        {r.id}
                      </TableCell>
                      <TableCell>
                        <ReviewCard paper={r} compact />
                      </TableCell>
                      {!isMobile && <TableCell>{r.authors || '-'}</TableCell>}
                      <TableCell>{r.year || '-'}</TableCell>
                      {!isTablet && !isMobile && <TableCell>{r.doi || '-'}</TableCell>}
                      <TableCell>
                        {(() => {
                          const status = r.review_status || 'draft';
                          let label = 'Draft';
                          let color = 'default';

                          if (status === 'in_progress') { label = 'In Progress'; color = 'warning'; }
                          else if (status === 'done') { label = 'Reviewed'; color = 'success'; }
                          else if (status === 'archived') { label = 'Archived'; }

                          return <Chip label={label} color={color} size="small" />;
                        })()}
                      </TableCell>

                      {!isResearcher && !isMobile && (
                        <TableCell>
                          <Tooltip title={r?.created_by || 'Unknown user'}>
                            <Stack direction="row" spacing={1} alignItems="center">
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
                                {initialsOf(r?.created_by)}
                              </Stack>

                              {!isTablet && (
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500, color: 'text.secondary' }}
                                >
                                  {r?.creator?.name}
                                </Typography>
                              )}
                            </Stack>
                          </Tooltip>
                        </TableCell>
                      )}


                      {!isMobile && (
                        <TableCell>
                          {r.updated_at ? new Date(r.updated_at).toLocaleString() : '-'}
                        </TableCell>
                      )}



                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Open review">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/reviews/${r.id}`)}
                            >
                              <VisibilityIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Remove from queue">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setConfirm(r)}
                            >
                              <DeleteOutlineIcon fontSize="inherit" />
                            </IconButton>
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
            count={meta?.total ?? 0}
            page={meta?.current_page ? meta.current_page - 1 : 0}
            rowsPerPage={rpp}
            onPageChange={(_, newPage) => {
              setPage(newPage);
            }}
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

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Remove from queue?"
        content={`"${confirm?.title}" will be removed from your review queue.`}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          dispatch(removeFromQueue(confirm.id));
          setConfirm(null);
        }}
        confirmText="Remove"
      />
    </Box>
  );
}

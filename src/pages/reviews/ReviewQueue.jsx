// src/pages/reviews/ReviewQueue.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Paper, Stack, Button, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, TablePagination, Chip, Typography
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

export default function ReviewQueue() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { queue, loading, error } = useSelector(s => s.reviews || { queue: [] });

  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rpp, setRpp] = React.useState(10);
  const [confirm, setConfirm] = React.useState(null);

  // 🔽 SORT STATE
  const [sortBy, setSortBy] = React.useState(null);   // column key
  const [sortDir, setSortDir] = React.useState('asc'); // asc | desc
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const userRole = useSelector(s => s.auth?.user?.role);
const isResearcher = userRole === 'researcher';


  React.useEffect(() => {
    dispatch(loadReviewQueue());
  }, [dispatch]);

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

  // 🔽 SORT FUNCTION
  const sortRows = React.useCallback((rows) => {
    if (!sortBy) return rows;

    const dir = sortDir === 'asc' ? 1 : -1;

    return [...rows].sort((a, b) => {
      let av = a?.[sortBy];
      let bv = b?.[sortBy];

      // handle dates (updated_at)
      if (sortBy === 'updated_at') {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
        return (av - bv) * dir;
      }

      // numbers
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }

      // strings
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });


  }, [sortBy, sortDir]);

  // 🔽 SEARCH + SORT (existing behavior preserved)
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = queue || [];

    if (q) {
      rows = rows.filter(p =>
        [p?.title, p?.authors, p?.doi, p?.year]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }

    return sortRows(rows);
  }, [queue, query, sortRows]);

  const start = page * rpp;
  const rows = filtered.slice(start, start + rpp);

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
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search title, authors, DOI…"
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
              overflowX: 'auto',
              maxHeight: isMobile ? 'none' : 'calc(100vh - 230px)',
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
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
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rpp}
            onRowsPerPageChange={e => {
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

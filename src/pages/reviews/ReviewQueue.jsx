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


export default function ReviewQueue() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { queue, loading, error } = useSelector(s => s.reviews || { queue: [] });

  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rpp, setRpp] = React.useState(10);
  const [confirm, setConfirm] = React.useState(null);

  React.useEffect(() => { dispatch(loadReviewQueue()); }, [dispatch]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return queue || [];
    return (queue || []).filter(p =>
      [p?.title, p?.authors, p?.doi, p?.year].join(' ').toLowerCase().includes(q)
    );
  }, [queue, query]);

  const start = page * rpp;
  const rows = filtered.slice(start, start + rpp);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Reviews — Queue"
        subtitle="Papers you’ve queued up to review"
        actions={<Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => dispatch(loadReviewQueue())}>Refresh</Button>
        </Stack>}
      />

      <Paper sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ mb: 1.5 }}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search title, authors, DOI…" />
        </Box>

        {loading ? (
          <Typography sx={{ p: 2 }}>Loading…</Typography>
        ) : error ? (
          <Typography color="error" sx={{ p: 2 }}>{String(error)}</Typography>
        ) : (
          <TableContainer sx={{ flex: 1, maxHeight: 'calc(100vh - 230px)', overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Paper</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Authors</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 90 }}>Year</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>DOI</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 160 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 220 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState hint="Add papers to the review queue from Library or Collections." />
                    </TableCell>
                  </TableRow>
                ) : rows.map(r => (
                  <TableRow hover key={r.id}>
                    <TableCell><ReviewCard paper={r} compact /></TableCell>
                    <TableCell>{r.authors || '-'}</TableCell>
                    <TableCell>{r.year || '-'}</TableCell>
                    <TableCell>{r.doi || '-'}</TableCell>
                    <TableCell>
                      {(() => {
                        const status = r.review_status || 'draft';

                        let label = 'Draft';
                        let color = 'default'; // MUI Chip color

                        switch (status) {
                          case 'in_progress':
                            label = 'In Progress';
                            color = 'warning';
                            break;
                          case 'done':
                            label = 'Reviewed';
                            color = 'success';
                            break;
                          case 'archived':
                            label = 'Archived';
                            color = 'default';
                            break;
                          case 'draft':
                          default:
                            label = 'Draft';
                            color = 'default';
                            break;
                        }

                        return <Chip label={label} color={color} size="small" />;
                      })()}
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Open review">
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/reviews/${r.id}`)}
                            >
                              <VisibilityIcon fontSize="inherit" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Remove from queue">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setConfirm(r)}
                            >
                              <DeleteOutlineIcon fontSize="inherit" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>

                  </TableRow>
                ))}
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
            onRowsPerPageChange={e => { setRpp(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            showFirstButton showLastButton
          />
        </Box>
      </Paper>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Remove from queue?"
        content={`"${confirm?.title}" will be removed from your review queue.`}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { dispatch(removeFromQueue(confirm.id)); setConfirm(null); }}
        confirmText="Remove"
      />
    </Box>
  );
}

// -------------------------------------------------
// src/pages/chapters/ChaptersPage.jsx
// -------------------------------------------------
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';

import {
  fetchChapters, createChapter, deleteChapter, reorderChapters,
  selectAllChapters, setUserId
} from '../../store/chaptersSlice';
import {
  Paper, Box, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, Stack, Typography, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Tooltip, CircularProgress
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';


const copyText = async (t) => { try { await navigator.clipboard.writeText(t || ''); } catch { } };

export default function ChaptersPage({ userId: userIdProp }) {
  const dispatch = useDispatch();
  const chapters = useSelector(selectAllChapters);
  const loading = useSelector((s) => s.chapters.loading);
  const authUserId = useSelector((s) => s.auth?.user?.id);
  const userId = userIdProp ?? authUserId ?? null;

  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRpp] = React.useState(10);
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [reorderMode, setReorderMode] = React.useState(false);
  const nav = useNavigate();

  React.useEffect(() => {
    if (userId) dispatch(setUserId(userId));
    dispatch(fetchChapters(userId));
  }, [dispatch, userId]);

  const normalized = React.useMemo(
    () => [...chapters].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [chapters]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter(c =>
      [c.title, (c.updated_at || c.created_at || '')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [normalized, query]);

  const start = page * rowsPerPage;
  const rows = filtered.slice(start, start + rowsPerPage);

  const handleCreate = async () => {
    if (!title.trim()) return;
    const payload = { title: title.trim(), order_index: chapters.length, body_html: '' };
    if (userId) payload.user_id = userId; // only if backend requires it
    await dispatch(createChapter(payload)).unwrap();
    setOpen(false); setTitle('');
  };

  const handleDelete = async (id) => {
    await dispatch(deleteChapter(id));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    // Avoid reorder while filtered or paginated
    if (query || rowsPerPage !== filtered.length) return;
    const newOrder = Array.from(normalized);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    dispatch(reorderChapters(newOrder.map((c) => c.id)));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Chapters"
        subtitle="Create, edit and organize your chapters"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant={reorderMode ? 'outlined' : 'text'} onClick={() => setReorderMode(v => !v)}>
              {reorderMode ? 'Done Reordering' : 'Reorder'}
            </Button>
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)}>
              Add Chapter
            </Button>
          </Stack>
        }
      />

      <Paper sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box sx={{ mb: 1.5 }}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search chapters…" />
        </Box>

        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
        ) : (
          <TableContainer sx={{ flex: 1, maxHeight: 'calc(100vh - 230px)', overflow: 'auto' }}>
            {reorderMode && !query && (filtered.length === normalized.length) ? (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="chapters-dd">
                  {(provided) => (
                    <Table stickyHeader size="small" ref={provided.innerRef} {...provided.droppableProps}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 60 }} />
                          <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Title</TableCell>
                          <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 200 }}>Updated</TableCell>
                          <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 140 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {normalized.map((c, idx) => (
                          <Draggable key={c.id} draggableId={String(c.id)} index={idx}>
                            {(p) => (
                              <TableRow ref={p.innerRef} {...p.draggableProps} hover>
                                <TableCell {...p.dragHandleProps}><DragIndicatorIcon fontSize="small" /></TableCell>
                                <TableCell>{c.title || '—'}</TableCell>
                                <TableCell>{(c.updated_at || c.created_at || '').toString().replace('T', ' ').replace('.000000Z', '')}</TableCell>
                                <TableCell>
                                  <Tooltip title="Edit"><IconButton size="small" onClick={() => nav(`/chapters/${c.id}`)}><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                                  <Tooltip title="Copy Title"><IconButton size="small" onClick={() => copyText(c.title)}><ContentCopyIcon fontSize="inherit" /></IconButton></Tooltip>
                                  <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(c.id)}><DeleteIcon fontSize="inherit" /></IconButton></Tooltip>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 70 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 200 }}>Updated</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 140 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          No chapters found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : rows.map((c, i) => (
                    <TableRow hover key={String(c.id ?? i)}>
                      <TableCell>{start + i + 1}</TableCell>
                      <TableCell>
                        <Typography
                          component={Link}
                          to={`/chapters/${c.id}`}
                          sx={{
                            textDecoration: 'none',
                            color: 'primary.main',
                            '&:hover': { textDecoration: 'underline' },
                            cursor: 'pointer'
                          }}
                        >
                          {c.title || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>{(c.updated_at || c.created_at || '').toString().replace('T', ' ').replace('.000000Z', '')}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => nav(`/chapters/${c.id}`)}><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                        <Tooltip title="Copy Title"><IconButton size="small" onClick={() => copyText(c.title)}><ContentCopyIcon fontSize="inherit" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(c.id)}><DeleteIcon fontSize="inherit" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_e, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRpp(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            showFirstButton showLastButton
          />
        </Box>
      </Paper>

      {/* Quick add (title only) */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Chapter</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

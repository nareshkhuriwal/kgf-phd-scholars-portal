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
  DialogActions, TextField, Tooltip, CircularProgress, MenuItem
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Snackbar, Alert } from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import { initialsOf } from '../../utils/text/cleanRich';

// Helper to copy text to clipboard

const PAGINATION_KEY = 'chapters.pagination';
const CHAPTER_TYPE_FILTER_KEY = 'chapters.chapterTypeFilter';

const copyText = async (t) => { try { await navigator.clipboard.writeText(t || ''); } catch { } };

const CHAPTER_TYPES = [
  { value: 'thesis_chapter', label: 'Thesis Chapter', desc: 'Full thesis content' },
  { value: 'presentation', label: 'Presentation Chapter', desc: 'Slides / Viva / Seminar' },
  { value: 'front_matter', label: 'Front Matter', desc: 'Title, Declaration, Certificates' },
  { value: 'appendix', label: 'Appendix', desc: 'Supplementary material' },
];

const CHAPTER_SECTIONS = [
  { value: 'overview', label: 'Overview' },
  { value: 'rol', label: 'Review of Literature (ROL)' },
  { value: 'problem_statement', label: 'Problem Statement' },
  { value: 'scope', label: 'Scope of Research' },
  { value: 'findings', label: 'Findings' },
  { value: 'gaps', label: 'Research Gaps' },
  { value: 'objectives', label: 'Objectives' },
  { value: 'methodology', label: 'Framework / Methodology' },
  { value: 'timeline', label: 'Timeline / Plan of Work' },
  { value: 'conclusion', label: 'Conclusion' },
  { value: 'appendix', label: 'Appendix / Supplementary' },
];


const chapterTypeLabel = (value) =>
  CHAPTER_TYPES.find(t => t.value === value)?.label || '—';


export default function ChaptersPage({ userId: userIdProp }) {
  const dispatch = useDispatch();
  const chapters = useSelector(selectAllChapters);
  const loading = useSelector((s) => s.chapters.loading);
  const authUserId = useSelector((s) => s.auth?.user?.id);
  const userId = userIdProp ?? authUserId ?? null;

  const [query, setQuery] = React.useState('');
  // const [page, setPage] = React.useState(0);
  // const [rowsPerPage, setRpp] = React.useState(10);

  const persisted = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(PAGINATION_KEY)) || {};
    } catch {
      return {};
    }
  }, []);

  const [page, setPage] = React.useState(persisted.page ?? 0);
  const [rowsPerPage, setRpp] = React.useState(persisted.rpp ?? 10);


  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [reorderMode, setReorderMode] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  const [dragIndex, setDragIndex] = React.useState(null);
  const [hoverIndex, setHoverIndex] = React.useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const userRole = useSelector(s => s.auth?.user?.role);
  const isResearcher = userRole === 'researcher';

  const [confirmDelete, setConfirmDelete] = React.useState({
    open: false,
    id: null,
    title: '',
  });

  const [chapterType, setChapterType] = React.useState('thesis_chapter');
  const [chapterSection, setChapterSection] = React.useState('overview');

  const [error, setError] = React.useState('');
  // Chapter type FILTER (list page)
  const persistedChapterType = React.useMemo(() => {
    try {
      return localStorage.getItem(CHAPTER_TYPE_FILTER_KEY) || 'all';
    } catch {
      return 'all';
    }
  }, []);

  const [chapterTypeFilter, setChapterTypeFilter] = React.useState(persistedChapterType);
  const chapterSectionLabel = (value) =>
    CHAPTER_SECTIONS.find(s => s.value === value)?.label || '—';


  const nav = useNavigate();

  React.useEffect(() => {
    if (userId) dispatch(setUserId(userId));
    dispatch(fetchChapters(userId));
  }, [dispatch, userId]);

  const normalized = React.useMemo(
    () => [...chapters].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    [chapters]
  );
  React.useEffect(() => {
    localStorage.setItem(CHAPTER_TYPE_FILTER_KEY, chapterTypeFilter);
  }, [chapterTypeFilter]);

  // const filtered = React.useMemo(() => {
  //   const q = query.trim().toLowerCase();
  //   if (!q) return normalized;
  //   return normalized.filter(c =>
  //     [c.title, (c.updated_at || c.created_at || '')]
  //       .filter(Boolean)
  //       .join(' ')
  //       .toLowerCase()
  //       .includes(q)
  //   );
  // }, [normalized, query]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    let rows = normalized;

    // 🔹 Chapter type filter
    if (chapterTypeFilter !== 'all') {
      rows = rows.filter(c => c.chapter_type === chapterTypeFilter);
    }

    // 🔹 Search filter
    if (q) {
      rows = rows.filter(c =>
        [c.title, (c.updated_at || c.created_at || '')]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }

    return rows;
  }, [normalized, query, chapterTypeFilter]);



  // ✅ SAFE PLACE — filtered is initialized
  const canReorder =
    !isMobile &&
    !query &&
    filtered.length === normalized.length;


  const start = page * rowsPerPage;
  const rows = filtered.slice(start, start + rowsPerPage);

  React.useEffect(() => {
    if (reorderMode) return; // do not persist while reordering

    localStorage.setItem(
      PAGINATION_KEY,
      JSON.stringify({ page, rpp: rowsPerPage })
    );
  }, [page, rowsPerPage, reorderMode]);


  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Chapter title is required');
      return;
    }

    const payload = {
      title: title.trim(),
      chapter_type: chapterType,
      chapter_section: chapterSection,
      body_html: '',
      order_index: chapters.length,
    };

    if (userId) payload.user_id = userId;

    try {
      await dispatch(createChapter(payload)).unwrap();
      setOpen(false);
      setTitle('');
      setChapterType('thesis_chapter');
      setChapterSection('overview');

      setError('');
    } catch (e) {
      setError('Failed to create chapter');
    }
  };


  const handleDelete = async (id) => {
    await dispatch(deleteChapter(id));
  };

  const handleDeleteClick = (id, title) => {
    setConfirmDelete({ open: true, id, title });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.id) return;

    try {
      await dispatch(deleteChapter(confirmDelete.id)).unwrap();
      setToast({ severity: 'success', msg: 'Chapter deleted successfully' });
    } catch (err) {
      setToast({ severity: 'error', msg: err || 'Failed to delete chapter' });
    } finally {
      setConfirmDelete({ open: false, id: null, title: '' });
    }
  };

  React.useEffect(() => {
    if (reorderMode) setPage(0);
  }, [reorderMode]);


  const onDragEnd = (result) => {
    if (!result.destination) return;
    // Avoid reorder while filtered or paginated
    if (query || rowsPerPage !== filtered.length) return;
    const newOrder = Array.from(normalized);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    dispatch(reorderChapters(newOrder.map((c) => c.id)));
  };

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault(); // REQUIRED
    setHoverIndex(index);
  };

  const handleDrop = async () => {
    if (dragIndex === null || hoverIndex === null) return;

    const items = [...normalized];
    const [moved] = items.splice(dragIndex, 1);
    items.splice(hoverIndex, 0, moved);

    setDragIndex(null);
    setHoverIndex(null);

    try {
      const res = await dispatch(
        reorderChapters(items.map(c => c.id))
      ).unwrap();

      setToast({
        severity: 'success',
        msg: res?.message || 'Chapter order updated',
      });

      // setReorderMode(false);
    } catch (err) {
      setToast({
        severity: 'error',
        msg: err || 'Failed to reorder chapters',
      });
    }
  };


  const handleDragEnd = () => {
    setDragIndex(null);
    setHoverIndex(null);
  };



  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title="Chapters"
        subtitle="Create, edit and organize your chapters"
        actions={
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <Button
              variant={reorderMode ? 'contained' : 'text'}
              color={reorderMode ? 'warning' : 'primary'}
              onClick={() => setReorderMode(v => !v)}
              fullWidth={isMobile}
            >
              {reorderMode ? 'Save Order' : 'Reorder'}
            </Button>

            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => setOpen(true)}
              fullWidth={isMobile}
            >
              Add Chapter
            </Button>
          </Stack>
        }

      />

      <Paper sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* <Box sx={{ mb: 1.5 }}>
          <SearchBar disabled={reorderMode} value={query} onChange={setQuery} placeholder="Search chapters…" />
        </Box> */}

        <Box
          sx={{
            mb: 1.5,
            display: 'flex',
            gap: 1.5,
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <SearchBar
            disabled={reorderMode}
            value={query}
            onChange={setQuery}
            placeholder="Search chapters…"
          />

          <TextField
            select
            size="small"
            disabled={reorderMode}
            value={chapterTypeFilter}
            onChange={(e) => {
              setChapterTypeFilter(e.target.value);
              setPage(0); // reset pagination safely
            }}
            sx={{ minWidth: 220 }}
            label="Chapter Type"
          >
            <MenuItem value="all">All Chapter Types</MenuItem>
            {CHAPTER_TYPES.map(t => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>


        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
        ) : (
          <TableContainer
            sx={{
              flex: 1,
              overflowX: 'auto',
              maxHeight: isMobile ? 'none' : 'calc(100vh - 230px)',
            }}
          >

            {reorderMode && canReorder && !query && (filtered.length === normalized.length) ? (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="chapters-dd">
                  {(provided) => (
                    <Table stickyHeader size="small" ref={provided.innerRef} {...provided.droppableProps}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 60 }} />
                          <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Title</TableCell>
                          <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 160 }}>
                            Chapter Type
                          </TableCell>

                          <TableCell sx={{ fontWeight: 600, width: 180 }}>
                            Section
                          </TableCell>


                          {!isResearcher && (
                            <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 180 }}>
                              Created By
                            </TableCell>
                          )}

                          {!isMobile && (
                            <TableCell sx={{ fontWeight: 600, width: 200 }}>
                              Updated
                            </TableCell>
                          )}

                          <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 140 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>


                      <TableBody>
                        {normalized.map((c, idx) => (
                          <TableRow
                            key={c.id}
                            hover
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            sx={{
                              cursor: 'grab',
                              opacity: dragIndex === idx ? 0.5 : 1,
                              backgroundColor:
                                hoverIndex === idx && dragIndex !== idx
                                  ? 'rgba(25, 118, 210, 0.08)'
                                  : 'inherit',
                            }}
                          >
                            <TableCell width={60}>
                              <DragIndicatorIcon fontSize="small" />
                            </TableCell>

                            <TableCell>{c.title || '—'}</TableCell>

                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {chapterTypeLabel(c.chapter_type)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {chapterSectionLabel(c.chapter_section)}
                              </Typography>
                            </TableCell>

                            {!isResearcher && (
                              <TableCell>
                                <Tooltip title={c?.creator?.name || 'Unknown user'}>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Stack
                                      alignItems="center"
                                      justifyContent="center"
                                      sx={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: '50%',
                                        bgcolor: 'grey.100',
                                        border: '1px solid',
                                        borderColor: 'grey.300',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        userSelect: 'none',
                                      }}
                                    >
                                      {initialsOf(c?.creator?.name)}
                                    </Stack>

                                  </Stack>
                                </Tooltip>
                              </TableCell>
                            )}



                            {!isMobile && (
                              <TableCell>
                                {(c.updated_at || c.created_at || '')
                                  .toString()
                                  .replace('T', ' ')
                                  .replace('.000000Z', '')}
                              </TableCell>
                            )}


                            <TableCell width={140}>
                              <IconButton size="small" disabled>
                                <EditIcon fontSize="inherit" />
                              </IconButton>
                              <IconButton size="small" disabled>
                                <DeleteIcon fontSize="inherit" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
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
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 70 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 160 }}>
                      Chapter Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 180 }}>
                      Section
                    </TableCell>


                    {!isResearcher && !isMobile && (
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f7f7f9', width: 180 }}>
                        Created By
                      </TableCell>
                    )}
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

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {chapterTypeLabel(c.chapter_type)}
                        </Typography>

                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {chapterSectionLabel(c.chapter_section)}
                          </Typography>
                        </TableCell>


                      </TableCell>
                      {!isResearcher && !isMobile && (
                        <TableCell>
                          <Tooltip title={c?.creator?.name || 'Unknown user'}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Stack
                                alignItems="center"
                                justifyContent="center"
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: '50%',
                                  bgcolor: 'grey.100',
                                  border: '1px solid',
                                  borderColor: 'grey.300',
                                  fontSize: 13,
                                  fontWeight: 700,
                                  userSelect: 'none',
                                }}
                              >
                                {initialsOf(c?.creator?.name)}
                              </Stack>

                            </Stack>
                          </Tooltip>
                        </TableCell>
                      )}



                      <TableCell>{(c.updated_at || c.created_at || '').toString().replace('T', ' ').replace('.000000Z', '')}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => nav(`/chapters/${c.id}`)}><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                        <Tooltip title="Copy Title"><IconButton size="small" onClick={() => copyText(c.title)}><ContentCopyIcon fontSize="inherit" /></IconButton></Tooltip>
                        {/* <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(c.id)}><DeleteIcon fontSize="inherit" /></IconButton></Tooltip> */}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(c.id, c.title)}
                          >
                            <DeleteIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>


                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {!reorderMode && <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_e, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRpp(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            showFirstButton showLastButton
          />}
        </Box>
      </Paper>

      {/* Quick add (title only) */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>
          Create New Chapter
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Chapter Title"
              placeholder="e.g. Research Objectives"
              value={title}
              error={!!error}
              helperText={error || 'Use clear academic naming'}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />

            <TextField
              select
              label="Chapter Type"
              value={chapterType}
              onChange={(e) => setChapterType(e.target.value)}
              helperText={
                CHAPTER_TYPES.find(t => t.value === chapterType)?.desc
              }
            >
              {CHAPTER_TYPES.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Chapter Section"
              value={chapterSection}
              onChange={(e) => setChapterSection(e.target.value)}
            >
              {CHAPTER_SECTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>


            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'grey.50',
                border: '1px dashed',
                borderColor: 'grey.300',
                fontSize: 13,
                color: 'text.secondary',
              }}
            >
              This chapter will be available for:
              <ul style={{ margin: '6px 0 0 18px' }}>
                {chapterType === 'thesis_chapter' && <li>Thesis Report</li>}
                {chapterType === 'synopsis' && <li>Synopsis & Presentation</li>}
                {chapterType === 'presentation' && <li>Seminar / Viva</li>}
                {chapterType === 'front_matter' && <li>All document types</li>}
                {chapterType === 'appendix' && <li>Thesis & Synopsis</li>}
              </ul>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!title.trim()}
          >
            Create Chapter
          </Button>
        </DialogActions>
      </Dialog>



      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 6 }}
      >
        {toast && (
          <Alert severity={toast.severity} variant="filled">
            {toast.msg}
          </Alert>
        )}
      </Snackbar>

      <Dialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null, title: '' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Chapter</DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Are you sure you want to delete the chapter
            <strong> “{confirmDelete.title || 'this chapter'}”</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDelete({ open: false, id: null, title: '' })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>



    </Box>
  );
}

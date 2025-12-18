// -------------------------------------------------
// src/pages/chapters/ChapterEditor.jsx  (stable hooks order)
// -------------------------------------------------
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { selectAllChapters, fetchChapters, updateChapter, deleteChapter } from '../../store/chaptersSlice';
import {
  Paper, Stack, TextField, Button, Typography, Box, Divider, LinearProgress, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton, Skeleton
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import makeEditorConfig from '../reviews/EditorConfig';

import { Snackbar, Alert } from '@mui/material';


// CKEditor
import { CKEditor } from '@ckeditor/ckeditor5-react';
// import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';


export default function ChapterEditor() {
  const { id } = useParams();
  const cid = Number(id);
  const dispatch = useDispatch();
  const nav = useNavigate();

  // ---- hooks are always called, in the same order ----
  const chapters = useSelector(selectAllChapters);
  const chapter = chapters.find((c) => c.id === cid);
  const toolbarRef = React.useRef(null);

  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const [toast, setToast] = React.useState({ open: false, severity: 'success', msg: '' });
  const openToast = (severity, msg) => setToast({ open: true, severity, msg });
  const closeToast = () => setToast((t) => ({ ...t, open: false }));


  // Fetch once if needed (unconditional hook)
  React.useEffect(() => {
    if (!chapters.length) dispatch(fetchChapters());
  }, [chapters.length, dispatch]);

  // Initialize local state when chapter becomes available (unconditional hook, guarded inside)
  React.useEffect(() => {
    if (chapter) {
      setTitle(chapter.title || '');
      setBody(chapter.body_html || '');
    }
  }, [chapter?.id]); // dependency value changes, but the hook itself is not conditional

  // Ctrl/Cmd+S to save (unconditional hook)
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!saving) handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, title, body, cid]);

  // ------------- handlers (no hooks) -------------
  const isLoaded = !!chapter;
  const isDirty =
    (title !== (chapter?.title || '')) || (body !== (chapter?.body_html || ''));

  const editorConfig = React.useMemo(
    () => makeEditorConfig(cid),
    [cid]
  );

  // replace your handleSave with this version
  const handleSave = async () => {
    if (!isLoaded) return;
    setSaving(true);
    try {
      await dispatch(updateChapter({ id: cid, changes: { title, body_html: body } })).unwrap();
      openToast('success', 'Chapter saved successfully.');
    } catch (err) {
      openToast('error', err?.message || 'Failed to save chapter.');
    } finally {
      setSaving(false);
    }
  };



  const handleCancel = () => {
    if (isDirty) setConfirmOpen(true);
    else nav('/chapters');
  };

  const confirmLeave = () => {
    setConfirmOpen(false);
    nav('/chapters');
  };

  // (optional) toast for delete too
  const handleDelete = async () => {
    if (!isLoaded) return;
    try {
      await dispatch(deleteChapter(cid)).unwrap();
      openToast('success', 'Chapter deleted.');
      nav('/chapters');
    } catch (err) {
      openToast('error', err?.message || 'Delete failed.');
    }
  };


  // ------------- render (no early return) -------------
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sticky Header Bar */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: (t) => t.zIndex.appBar,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {saving && <LinearProgress />}
        <Box sx={{ px: 2, py: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Back">
                <IconButton onClick={handleCancel}><ArrowBackIcon /></IconButton>
              </Tooltip>
              <Box>
                <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                  {isLoaded ? 'Edit Chapter' : 'Loading Chapter…'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID #{cid} {isLoaded && isDirty ? '• Unsaved changes' : ''}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button onClick={handleCancel} disabled={!isLoaded}>Cancel</Button>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={handleSave}
                disabled={!isLoaded || saving || !isDirty || !title.trim()}
              >
                Save
              </Button>
              {/* <Tooltip title="Delete chapter">
                <span>
                  <IconButton color="error" onClick={handleDelete} disabled={!isLoaded}>
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip> */}
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* Content Blocks */}
      <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
        {/* Details Block */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Details</Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            {isLoaded ? (
              <TextField
                fullWidth
                label="Chapter Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction"
              />
            ) : (
              <Skeleton variant="rounded" height={48} />
            )}
          </Stack>
        </Paper>

        {/* Body Block */}
        <Paper
          sx={{
            p: 2,
            // ⬇️ increase editor height
            '& .ck-editor': {
              border: '1px solid #e0e0e0',
              borderRadius: 6,
            },
            '& .ck-editor__editable': {
              minHeight: 400,
              padding: '16px',
            }

          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Body</Typography>
          <Divider sx={{ mb: 2 }} />
          {isLoaded ? (
            <>
              <Box
                ref={toolbarRef}
                sx={{
                  borderBottom: '1px solid #eee',
                  backgroundColor: '#fafafa',
                  px: 1,
                  py: 0.5,
                  '& .ck-toolbar': {
                    border: 'none'
                  }
                }}
              />

              <CKEditor
                key={cid}
                editor={DecoupledEditor}
                data={body || ''}
                config={editorConfig}   //  REQUIRED
                onReady={(editor) => {
                  if (toolbarRef.current) {
                    toolbarRef.current.innerHTML = '';
                    toolbarRef.current.appendChild(editor.ui.view.toolbar.element);
                  }
                }}
                onChange={(_, editor) => {
                  const data = editor.getData();
                  setBody(data);
                }}
              />



              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Tip: Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>S</kbd> to save.
              </Typography>
            </>
          ) : (
            <Stack spacing={1}>
              <Skeleton variant="rounded" height={220} />
              <Skeleton width={180} />
            </Stack>
          )}
        </Paper>

      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.msg}
        </Alert>
      </Snackbar>

      {/* Confirm leave dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Discard changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Are you sure you want to leave this page?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Stay</Button>
          <Button color="error" onClick={confirmLeave}>Discard</Button>
        </DialogActions>
      </Dialog>



    </Box>


  );

}

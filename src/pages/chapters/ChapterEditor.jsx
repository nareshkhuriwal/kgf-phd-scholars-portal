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

const CHAR_WARN = 150;
const CHAR_GOOD = 1000;
const WORD_TARGET = 150;   // recommended minimum words

const getCharMeta = (count) => {
  if (count > CHAR_GOOD) {
    return {
      color: '#2e7d32', // MUI success green
      label: `Characters: ${count} ✓`
    };
  }

  if (count > CHAR_WARN) {
    return {
      color: '#ed6c02', // warning amber
      label: `Characters: ${count} / ${CHAR_GOOD}`
    };
  }

  return {
    color: '#6b7280', // text.secondary gray
    label: `Characters: ${count}`
  };
};


const getWordCharMeta = (wordCount, charCount) => {
  const wordsOk = wordCount >= WORD_TARGET;
  const charsOk = charCount >= CHAR_GOOD;

  if (wordsOk && charsOk) {
    return {
      color: '#2e7d32',
      label: `Words: ${wordCount} ✓ | Characters: ${charCount} ✓`
    };
  }

  if (wordsOk || charsOk) {
    return {
      color: '#ed6c02',
      label: `Words: ${wordCount}${wordsOk ? ' ✓' : ''} | Characters: ${charCount}${charsOk ? ' ✓' : ''}`
    };
  }

  return {
    color: '#6b7280',
    label: `Words: ${wordCount} / ${WORD_TARGET}+ | Characters: ${charCount} / ${CHAR_GOOD}+`
  };
};



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
  const [charCount, setCharCount] = React.useState(0);
  const [wordCount, setWordCount] = React.useState(0);

  const [autoSaving, setAutoSaving] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState(null);



  // Fetch once if needed (unconditional hook)
  React.useEffect(() => {
    if (!chapters.length) dispatch(fetchChapters());
  }, [chapters.length, dispatch]);

  React.useEffect(() => {
    if (chapter?.body_html) {
      const text = chapter.body_html.replace(/<[^>]*>/g, '').trim();
      setCharCount(text.length);
      setWordCount(text ? text.split(/\s+/).length : 0);
    }
  }, [chapter?.id]);


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
      await dispatch(updateChapter({ id: cid, changes: { title, body_html: btoa(unescape(encodeURIComponent(body))) } })).unwrap();
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

  // ---------------- AUTOSAVE CHAPTER ----------------
  React.useEffect(() => {
    if (!isLoaded) return;
    if (!isDirty) return;
    if (!body) return;

    setAutoSaving(true);

    const t = setTimeout(async () => {
      try {
        await dispatch(
          updateChapter({
            id: cid,
            changes: {
              title,
              body_html: btoa(unescape(encodeURIComponent(body))),
            },
            autosave: true, // optional backend hint
          })
        ).unwrap();

        setLastSavedAt(new Date());
      } finally {
        setAutoSaving(false);
      }
    }, 1500); // ⏱ debounce window

    return () => clearTimeout(t);
  }, [cid, title, body, isLoaded, isDirty, dispatch]);

  const SaveStatus = ({ saving, autoSaving, isDirty, lastSavedAt }) => {
    if (saving || autoSaving) {
      return (
        <Stack direction="row" spacing={0.75} alignItems="center">
          <LinearProgress
            sx={{
              width: 60,
              height: 3,
              borderRadius: 1,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Saving…
          </Typography>
        </Stack>
      );
    }

    if (isDirty) {
      return (
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#ed6c02', // warning
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Unsaved changes
          </Typography>
        </Stack>
      );
    }

    if (lastSavedAt) {
      return (
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#2e7d32', // success
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Saved {lastSavedAt.toLocaleTimeString()}
          </Typography>
        </Stack>
      );
    }

    return null;
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


              <SaveStatus
                saving={saving}
                autoSaving={autoSaving}
                isDirty={isDirty}
                lastSavedAt={lastSavedAt}
              />

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
            display: 'flex',
            flexDirection: 'column',
            height: 520,
            maxWidth: '100%',           // 🔒 CRITICAL
            overflow: 'hidden',         // 🔒 stop page overflow
            borderRadius: 2,

            /* CKEditor root */
            '& .ck-editor': {
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '100%',
              overflow: 'hidden',       // 🔒 contain overflow
              border: '1px solid #e0e0e0',
              borderRadius: 1,
            },

            /* Editable area */
            '& .ck-editor__editable': {
              flex: 1,
              minHeight: 0,
              padding: '16px',
              maxWidth: '100%',         // 🔒 HARD STOP WIDTH
              overflowY: 'auto',
              overflowX: 'auto',        // ✅ horizontal scrollbar
              whiteSpace: 'normal',
              wordBreak: 'break-word',  // 🔥 handles long strings
              boxSizing: 'border-box',
            },

            /* Ensure CK content respects width */
            '& .ck-content': {
              maxWidth: '100%',
              overflowX: 'auto',
            },

            /* Tables must scroll, not expand */
            '& .ck-content table': {
              display: 'block',
              maxWidth: '100%',
              overflowX: 'auto',
            },

            /* Images never expand container */
            '& .ck-content img': {
              maxWidth: '100%',
              height: 'auto',
            },
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
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  '& .ck-toolbar': {
                    border: 'none',
                  },
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
                  const text = data.replace(/<[^>]*>/g, '').trim();
                  setCharCount(text.length);
                  setWordCount(text ? text.split(/\s+/).length : 0);

                }}

              />

              {(() => {
                const meta = getWordCharMeta(wordCount, charCount);

                return (
                  <Box
                    sx={{
                      mt: 1,
                      px: 1,
                      py: 0.75,
                      borderTop: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#fafafa',
                      position: 'sticky',
                      bottom: 0,               // ✅ stays visible
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: meta.color,
                        fontWeight: (wordCount >= WORD_TARGET || charCount >= CHAR_GOOD) ? 600 : 400,
                      }}
                    >
                      {meta.label}
                    </Typography>


                    <Typography variant="caption" color="text.secondary">
                      Recommended: {WORD_TARGET}+ words • {CHAR_GOOD}+ characters
                    </Typography>

                  </Box>
                );
              })()}



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

import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  TextField,
  Stack,
  Button,
  Divider,
  Typography,
  IconButton,
} from '@mui/material';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPaper,
  savePaper,
  addPaperSection,
  deletePaperSection,
} from '../../store/authoredPapersSlice';
import PaperPreviewDialog from '../../components/papers/PaperPreviewDialog';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import makeEditorConfig from '../reviews/EditorConfig';


export default function MyPaperEditor() {
  const { id } = useParams();
  const cid = Number(id);

  const dispatch = useDispatch();
  const paper = useSelector(s => s.authoredPapers.current);

  const toolbarRef = useRef(null);

  const [tab, setTab] = useState(0);
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState([]);
  const [preview, setPreview] = useState(false);

  const [adding, setAdding] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // ---------------- FETCH PAPER ----------------
  useEffect(() => {
    dispatch(fetchPaper(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (!paper) return;
    setTitle(paper.title || '');
    setSections(paper.sections || []);
    setTab(0);
  }, [paper]);

  const editorConfig = React.useMemo(
    () => makeEditorConfig(cid),
    [cid]
  );

  // ---------------- UPDATE SECTION CONTENT ----------------
  const updateSection = (html) => {
    setSections(prev =>
      prev.map((s, i) =>
        i === tab ? { ...s, body_html: html } : s
      )
    );
  };

  // ---------------- FINAL SAVE ----------------
  const handleFinalSave = async () => {
    await dispatch(savePaper({
      id,
      payload: {
        title,
        sections: sections.map(s => ({
          id: s.id,
          body_html: s.body_html,
        })),
      },
    }));
  };

  // ---------------- AUTOSAVE ----------------
  useEffect(() => {
    if (!sections.length) return;
    const t = setTimeout(() => {
      dispatch(savePaper({
        id,
        payload: {
          title,
          sections: sections.map(s => ({
            id: s.id,
            body_html: s.body_html,
          })),
        },
      }));
    }, 1500);

    return () => clearTimeout(t);
  }, [title, sections, id, dispatch]);

  if (!paper) return null;

  const activeSection = sections[tab];

  return (
    <Box>
      {/* ================= HEADER ================= */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          p: 1.5,
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          bgcolor: '#fafafa',
        }}
      >
        <TextField
          variant="standard"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Paper Title"
          InputProps={{
            disableUnderline: true,
            sx: { fontSize: 20, fontWeight: 600 },
          }}
          sx={{ flex: 1, mr: 2 }}
        />

        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => setPreview(true)}>
            Preview
          </Button>
          <Button variant="outlined" onClick={handleFinalSave}>
            Save
          </Button>
        </Stack>
      </Box>

      {/* ================= BODY ================= */}
      <Box
        sx={{
          display: 'flex',
          minHeight: '70vh',
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* ========== SIDEBAR (DOCUMENT OUTLINE) ========== */}
        <Box
          sx={{
            width: 230,
            minWidth: 230,
            bgcolor: '#f7f7f9',
            borderRight: '1px solid #e0e0e0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >

          {sections.map((s, i) => {
            const active = i === tab;

            return (
              <Box key={s.id}>
                <Box
                  onClick={() => setTab(i)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    bgcolor: active ? '#fff' : 'transparent',
                    borderLeft: active
                      ? '4px solid #1976d2'
                      : '4px solid transparent',
                    '&:hover': { bgcolor: '#fff' },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                      color: active
                        ? 'primary.main'
                        : 'text.secondary',
                    }}
                  >
                    {s.section_title}
                  </Typography>

                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(deletePaperSection(s.id));
                      if (tab === i) setTab(0);
                    }}
                    sx={{
                      color: '#9e9e9e',
                      '&:hover': { color: '#d32f2f' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Divider />
              </Box>
            );
          })}

          {/* -------- ADD SECTION -------- */}
          <Box sx={{ p: 2, mt: 'auto' }}>
            {!adding ? (
              <Button
                fullWidth
                startIcon={<AddIcon />}
                variant="text"
                onClick={() => setAdding(true)}
                sx={{
                  justifyContent: 'flex-start',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Add Section
              </Button>
            ) : (
              <Stack spacing={1}>
                <TextField
                  size="small"
                  autoFocus
                  placeholder="Section title"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (!newSectionTitle.trim()) return;
                      dispatch(addPaperSection({
                        paperId: paper.id,
                        title: newSectionTitle.trim(),
                      }));
                      setNewSectionTitle('');
                      setAdding(false);
                    }
                    if (e.key === 'Escape') {
                      setAdding(false);
                      setNewSectionTitle('');
                    }
                  }}
                />

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      if (!newSectionTitle.trim()) return;
                      dispatch(addPaperSection({
                        paperId: paper.id,
                        title: newSectionTitle.trim(),
                      }));
                      setNewSectionTitle('');
                      setAdding(false);
                    }}
                  >
                    Add
                  </Button>

                  <Button
                    size="small"
                    onClick={() => {
                      setAdding(false);
                      setNewSectionTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            )}
          </Box>
        </Box>

        {/* ========== EDITOR ========== */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            bgcolor: '#fff',
            '& .ck-editor__editable': {
              minHeight: 500,
              padding: '24px',
              fontSize: '16px',
              lineHeight: 1.7,
            },
          }}
        >
          <Box ref={toolbarRef} sx={{ mb: 1 }} />

          {activeSection && (
            <CKEditor
              key={activeSection.id}
              editor={DecoupledEditor}
              config={editorConfig}   //  REQUIRED

              data={activeSection.body_html || ''}
              onReady={(editor) => {
                if (toolbarRef.current) {
                  toolbarRef.current.innerHTML = '';
                  toolbarRef.current.appendChild(
                    editor.ui.view.toolbar.element
                  );
                }
              }}
              onChange={(_, ed) => updateSection(ed.getData())}
            />
          )}
        </Box>
      </Box>

      {/* ================= PREVIEW ================= */}
      <PaperPreviewDialog
        open={preview}
        onClose={() => setPreview(false)}
        paper={{ title, sections }}
      />
    </Box>
  );
}

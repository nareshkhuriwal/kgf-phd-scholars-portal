import React, { useEffect, useState } from 'react';
import { Box, Tabs, Tab, TextField, Stack, Button } from '@mui/material';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaper, savePaper } from '../../store/authoredPapersSlice';
import PaperPreviewDialog from '../../components/papers/PaperPreviewDialog';

export default function MyPaperEditor() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const paper = useSelector(s => s.authoredPapers.current);

  const toolbarRef = React.useRef(null);


  const [tab, setTab] = useState(0);
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState([]);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    dispatch(fetchPaper(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (!paper) return;
    setTitle(paper.title);
    setSections(paper.sections || []);
  }, [paper]);

  const updateSection = (html) => {
    setSections(prev =>
      prev.map((s, i) =>
        i === tab ? { ...s, body_html: html } : s
      )
    );
  };

  // autosave
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

  return (
    <Box>
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

        <Button
          variant="contained"
          onClick={() => setPreview(true)}
        >
          Preview
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          minHeight: '70vh',
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >

        <Tabs
          orientation="vertical"
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minWidth: 220,
            bgcolor: '#f7f7f9',
            borderRight: '1px solid #e0e0e0',
            '& .MuiTab-root': {
              alignItems: 'flex-start',
              textTransform: 'none',
              fontWeight: 500,
              px: 2,
            },
            '& .Mui-selected': {
              bgcolor: '#fff',
              fontWeight: 600,
              color: 'primary.main',
            },
          }}
        >

          {sections.map(s => (
            <Tab key={s.id} label={s.section_title} />
          ))}
        </Tabs>

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

          <CKEditor
            editor={DecoupledEditor}
            data={sections[tab]?.body_html || ''}
            onReady={(editor) => {
              if (toolbarRef.current) {
                toolbarRef.current.innerHTML = '';
                toolbarRef.current.appendChild(editor.ui.view.toolbar.element);
              }
            }}
            onChange={(_, ed) => updateSection(ed.getData())}
          />
        </Box>

      </Box>


      <PaperPreviewDialog
        open={preview}
        onClose={() => setPreview(false)}
        paper={{ title, sections }}
      />
    </Box>
  );
}

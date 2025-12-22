import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';


import {
  Box, Paper, Grid, Typography, Button, Stack, Chip, Alert,
  Tabs, Tab, Divider, IconButton, Tooltip
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import makeEditorConfig from '../../pages/reviews/EditorConfig';


import PageHeader from '../../components/PageHeader';
import ReviewToolbar from '../../components/reviews/ReviewToolbar';
import ReviewSidebar from '../../components/reviews/ReviewSidebar';
import PdfPane from '../../components/pdf/PdfPane';
import CommentsPanel from '../../components/comments/CommentsPanel';


import { CKEditor } from '@ckeditor/ckeditor5-react';
// import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';

import {
  loadReview,
  saveReviewSection,   // save only the active tab
  setReviewStatus      // mark complete / pending
} from '../../store/reviewsSlice';

import { debounce } from '../../utils/debounce';

// ---- Tabs / mapping ----
const EDITOR_ORDER = [
  'Literature Review',
  'Key Issue',
  'Solution Approach / Methodology used',
  'Related Work',
  'Input Parameters used',
  'Hardware / Software / Technology Used',
  'Results',
  'Key advantages',
  'Limitations',
  'Citations',
  'Remarks'
];

const LEGACY_KEY_MAP = {
  'Literature Review': ['literature_review', 'litracture_review', 'review', 'html'],
  'Key Issue': ['key_issue', 'key_issues'],
  'Solution Approach / Methodology used': ['solution_approach', 'methodology', 'methodology_used'],
  'Related Work': ['related_work'],
  'Input Parameters used': ['input_parameters', 'parameters'],
  'Hardware / Software / Technology Used': ['hardware_software_technology', 'technology_used'],
  'Results': ['results'],
  'Key advantages': ['key_advantages', 'advantages'],
  'Limitations': ['limitations'],
  'Citations': ['citations', 'references'],
  'Remarks': ['remarks']
};

const pickFirst = (obj, keys) => {
  for (const k of keys) if (obj && obj[k] != null) return obj[k];
  return '';
};

// ---- Height dials ----
const WORKPANE_VH = 50;   // fixed work area height (viewport-based)
const WORKPANE_MIN = 600; // absolute minimum height

const CHAR_WARN = 150;
const CHAR_GOOD = 300;
// Replace these constants (around line 67-69)
const WORD_TARGET = 300;
const CHAR_TARGET = 1000;

const getCharMeta = (count) => {
  if (count > CHAR_GOOD) {
    return {
      color: '#2e7d32', // MUI success.main (professional green)
      label: `Characters: ${count} ✓`
    };
  }

  if (count > CHAR_WARN) {
    return {
      color: '#ed6c02', // MUI warning.main
      label: `Characters: ${count} / ${CHAR_GOOD}`
    };
  }

  return {
    color: '#6b7280', // text.secondary
    label: `Characters: ${count}`
  };
};

// Replace the getCountMeta function (around line 71-91)
const getCountMeta = (wordCount, charCount) => {
  const wordsMet = wordCount >= WORD_TARGET;
  const charsMet = charCount >= CHAR_TARGET;

  if (wordsMet && charsMet) {
    return {
      color: '#2e7d32', // success green
      label: `Words: ${wordCount} / ${WORD_TARGET}+ ✓ | Characters: ${charCount} / ${CHAR_TARGET}+ ✓`
    };
  }

  if (wordsMet || charsMet) {
    return {
      color: '#ed6c02', // warning orange
      label: `Words: ${wordCount} / ${WORD_TARGET}+ ${wordsMet ? '✓' : ''} | Characters: ${charCount} / ${CHAR_TARGET}+ ${charsMet ? '✓' : ''}`
    };
  }

  return {
    color: '#6b7280', // text.secondary
    label: `Words: ${wordCount} / ${WORD_TARGET}+ | Characters: ${charCount} / ${CHAR_TARGET}+`
  };
};



export default function ReviewEditor() {
  const { paperId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, error } = useSelector((s) => s.reviews || {});
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [charCount, setCharCount] = React.useState(0);
  const toolbarRef = React.useRef(null);
  // Add this state variable (around line 108)
  const [wordCount, setWordCount] = React.useState(0);


  console.log("current: ", current)
  const [tab, setTab] = React.useState(0);

  const [sections, setSections] = React.useState(() => {
    const init = {}; EDITOR_ORDER.forEach((k) => (init[k] = ''));
    return init;
  });


  const [editorKeys] = React.useState(() => {
    const o = {}; EDITOR_ORDER.forEach((k) => (o[k] = `ck-${k.replace(/\W+/g, '_')}`));
    return o;
  });

  const [saving, setSaving] = React.useState(false);
  const [savedOnce, setSavedOnce] = React.useState(false);

  const pid = React.useMemo(
    () => (paperId ?? current?.id ?? current?.paper_id) ?? null,
    [paperId, current]
  );

  React.useEffect(() => {
    const blockEnterSubmit = (e) => {
      if (e.key === 'Enter' && e.target?.closest('.ck')) {
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', blockEnterSubmit, true);
    return () => document.removeEventListener('keydown', blockEnterSubmit, true);
  }, []);


  const editorConfig = React.useMemo(
    () => makeEditorConfig(pid),
    [pid]
  );


  // Load paper/review once
  React.useEffect(() => { dispatch(loadReview(paperId)); }, [dispatch, paperId]);

  // Hydrate editor data when review loads/changes
  React.useEffect(() => {
    if (!current) return;
    const obj = {};
    if (current.review_sections && typeof current.review_sections === 'object') {
      EDITOR_ORDER.forEach((k) => (obj[k] = current.review_sections[k] || ''));
    } else {
      EDITOR_ORDER.forEach((label) => {
        const legacy = pickFirst(current, LEGACY_KEY_MAP[label] || []);
        obj[label] = legacy || '';
      });
    }
    setSections(obj);
  }, [current]);

  // Debounced change handler – prevents parent re-render on every keystroke
  const debouncedSetSectionsRef = React.useRef(
    debounce((label, value) => {
      setSections(prev => (prev[label] === value ? prev : { ...prev, [label]: value }));
    }, 250) // tweak delay as needed
  );

  React.useEffect(() => {
    const d = debouncedSetSectionsRef.current;
    return () => d && d.cancel && d.cancel();
  }, []);

  // const onEditorChange = React.useCallback((label, editor) => {
  //   debouncedSetSectionsRef.current(label, editor.getData());
  // }, []);

  // Replace the onEditorChange callback (around line 162-171)
  const onEditorChange = React.useCallback((label, editor) => {
    const data = editor.getData();

    // Strip HTML to count characters and words
    const text = data.replace(/<[^>]*>/g, '').trim();
    setCharCount(text.length);

    // Count words (split by whitespace and filter empty strings)
    const words = text.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);

    debouncedSetSectionsRef.current(label, data);
  }, []);


  // Replace the useEffect for tab changes (around line 173-179)
  React.useEffect(() => {
    const activeLabel = EDITOR_ORDER[tab];
    const html = sections[activeLabel] || '';
    const text = html.replace(/<[^>]*>/g, '').trim();
    setCharCount(text.length);

    // Count words
    const words = text.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [tab, sections]);


  // Save only CURRENT tab
  const onSaveCurrentTab = async () => {
    const activeLabel = EDITOR_ORDER[tab];
    const activeHtml = sections[activeLabel] || '';
    setSaving(true);
    try {
      await dispatch(
        saveReviewSection({ paperId, section_key: activeLabel, html: btoa(unescape(encodeURIComponent(activeHtml))) })
      ).unwrap();
      setSavedOnce(true);
    } finally { setSaving(false); }
  };

  // Reviewed
  const Reviewed = async () => {
    setSaving(true);
    try {
      await dispatch(setReviewStatus({ paperId, status: 'done' })).unwrap();
      setSavedOnce(true);
    } finally { setSaving(false); }
  };

  return (
    // Use minHeight so the page can grow with comments below
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PageHeader
        title={current?.title || 'Review Editor'}
        subtitle={
          current?.authors
            ? `${current.authors} • ${current.year || ''}`
            : 'Compose your literature review'
        }
        actions={
          <Stack direction="row" spacing={1}>
            {savedOnce && <Chip label="Saved" size="small" color="success" variant="outlined" />}
            <Button variant="outlined" onClick={() => navigate('/reviews/queue')}>Back to Queue</Button>
            <Button variant="contained" disabled={saving} onClick={onSaveCurrentTab}>
              {saving ? 'Saving…' : `Save: ${EDITOR_ORDER[tab]}`}
            </Button>
            <Button variant="outlined" color="success" onClick={Reviewed}>
              Reviewed
            </Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mx: 1.5, mb: 1 }}>{String(error)}</Alert>}

      {/* WORK PANE */}
      <Box
        sx={{
          flex: '0 0 auto',
          height: { xs: 'min(150vh, 900px)', md: `${WORKPANE_VH}vh` },
          minHeight: WORKPANE_MIN,
          p: 1.5,
          position: 'relative',          // ⬅️ for the floating reopen button
        }}
      >

        <Grid container spacing={1.5} sx={{ p: 1.5, height: '100%', overflow: 'hidden' }}>
          {/* LEFT: PDF */}
          <Grid item xs={12} lg={6} sx={{ height: '100%', minHeight: 300 }}>
            <PdfPane
              fileUrl={current?.pdf_url || current?.file_url || ''}
              paperId={pid}
            />
          </Grid>

          {/* CENTER: Editors – grow when sidebar is hidden */}
          <Grid
            item
            xs={12}
            lg={sidebarOpen ? 4 : 6}
            sx={{
              height: '100%',
              minHeight: 320,
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.25s ease-in-out', // smooth resize
            }}
          >
            <Paper
              sx={{
                flex: 1,
                minHeight: 0,
                border: '1px solid #eee',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ReviewToolbar
                onSave={onSaveCurrentTab}
                saving={saving}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(v => !v)}
              />

              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons
                allowScrollButtonsMobile
                sx={{ px: 1, '.MuiTabs-flexContainer': { flexWrap: 'nowrap' }, minHeight: 40 }}
              >
                {EDITOR_ORDER.map((label) => (
                  <Tab key={label} label={label} sx={{ minHeight: 40 }} />
                ))}
              </Tabs>

              <Divider />

              <Box
                ref={toolbarRef}
                sx={{
                  borderBottom: '1px solid #eee',
                  backgroundColor: '#fafafa',
                  px: 1,
                  py: 0.5,
                  '& .ck-toolbar': { border: 'none' }
                }}
              />


              <Box sx={{ flex: 1, minHeight: 0, p: 1.5 }}>
                {EDITOR_ORDER.map((label, i) => (
                  <Box key={editorKeys[label]} role="tabpanel" hidden={tab !== i} sx={{ height: '100%' }}>
                    <Box
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >

                      {tab === i && (
                        <Box
                          sx={{
                            flex: 1,
                            minHeight: 0,
                            overflow: 'auto',
                            '& .ck-editor__editable': {
                              minHeight: '300px',
                              padding: '16px',
                              borderRadius: 6,
                            },
                          }}
                        >
                          <CKEditor
                            key={editorKeys[label]}
                            editor={DecoupledEditor}
                            data={sections[label] || ''}
                            config={editorConfig}
                            onReady={(editor) => {
                              if (toolbarRef.current) {
                                toolbarRef.current.innerHTML = '';
                                toolbarRef.current.appendChild(editor.ui.view.toolbar.element);
                              }
                            }}
                            // Update the onChange in CKEditor (around line 320-329)
                            onChange={(_, editor) => {
                              const data = editor.getData();
                              const text = data.replace(/<[^>]*>/g, '').trim();
                              setCharCount(text.length);

                              // Count words
                              const words = text.split(/\s+/).filter(word => word.length > 0);
                              setWordCount(words.length);

                              debouncedSetSectionsRef.current(label, data);
                            }}

                          />
                        </Box>

                      )}
                      {(() => {
                        const meta = getCountMeta(wordCount, charCount);

                        return (
                          <Typography
                            variant="caption"
                            sx={{
                              mt: 0.5,
                              px: 1,
                              py: 0.25,
                              textAlign: 'right',
                              color: meta.color,
                              backgroundColor: '#fafafa',
                              borderTop: '1px solid #eee',
                              fontWeight: (wordCount >= WORD_TARGET || charCount >= CHAR_TARGET) ? 600 : 400,
                              display: 'block'
                            }}
                          >
                            {meta.label}
                          </Typography>
                        );
                      })()}



                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* RIGHT: Metadata sidebar – hidden completely when closed */}
          {sidebarOpen && (

            <Grid item xs={12} lg={2}>
              <ReviewSidebar
                paper={current}
                open={sidebarOpen}
                onToggle={() => setSidebarOpen(false)}
                sections={sections}
                activeTab={tab}
                onSelectSection={setTab}
                editorOrder={EDITOR_ORDER}
              />
            </Grid>
          )}
        </Grid>

      </Box>

      {/* COMMENTS below work pane (page scrolls) */}
      <Box sx={{ mt: 2, px: 1.5, pb: 4 }}>
        <CommentsPanel paperId={paperId} />
      </Box>
    </Box>
  );
}

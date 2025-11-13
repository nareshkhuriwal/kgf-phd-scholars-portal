import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Typography, Button, Stack, Chip, Alert,
  Tabs, Tab, Divider
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import ReviewToolbar from '../../components/reviews/ReviewToolbar';
import ReviewSidebar from '../../components/reviews/ReviewSidebar';
import PdfPane from '../../components/pdf/PdfPane';
import CommentsPanel from '../../components/comments/CommentsPanel';
import PdfHighlighter from '../../components/reviews/PdfHighlighter';


import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import {
  loadReview,
  saveReviewSection,   // save only the active tab
  setReviewStatus      // mark complete / pending
} from '../../store/reviewsSlice';

import { debounce } from '../../utils/debounce';

// ---- Tabs / mapping ----
const EDITOR_ORDER = [
  'Litracture Review',
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
  'Litracture Review': ['literature_review', 'litracture_review', 'review', 'html'],
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
const WORKPANE_VH = 65;   // fixed work area height (viewport-based)
const WORKPANE_MIN = 600; // absolute minimum height

export default function ReviewEditor() {
  const { paperId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, error } = useSelector((s) => s.reviews || {});

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

  const onEditorChange = React.useCallback((label, editor) => {
    debouncedSetSectionsRef.current(label, editor.getData());
  }, []);

  // Save only CURRENT tab
  const onSaveCurrentTab = async () => {
    const activeLabel = EDITOR_ORDER[tab];
    const activeHtml = sections[activeLabel] || '';
    setSaving(true);
    try {
      await dispatch(
        saveReviewSection({ paperId, section_key: activeLabel, html: activeHtml })
      ).unwrap();
      setSavedOnce(true);
    } finally { setSaving(false); }
  };

  // Mark as complete
  const onMarkComplete = async () => {
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
            <Button variant="outlined" color="success" onClick={onMarkComplete}>
              Mark Complete
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
          p: 1.5
        }}
      >
        <Grid container spacing={1.5} sx={{ p: 1.5, height: '100%', overflow: 'hidden' }}>
          {/* LEFT: Memoized PDF preview – won’t re-render while typing */}
          <Grid item xs={12} lg={5} sx={{ height: '100%', minHeight: 300 }}>
            <PdfPane
              fileUrl={current?.pdf_url || current?.file_url || ''}  // whichever your API returns
              paperId={pid}                                         // << pass it
            />
            {/* <PdfHighlighter
              pdfUrl={current?.pdf_url || current?.file_url || ''}
              uploadUrl={`/pdfs/upload`} // adjust to your route
              tokenFetchInit={{ credentials: 'include' }}                 // or headers: { Authorization: ... }
              onSaved={(res) => {
                // optional: refresh the paper/review or show toast with res.url
                // dispatch(loadReview(paperId));
              }}
            /> */}

          </Grid>

          {/* CENTER: Editors */}
          <Grid item xs={12} lg={5} sx={{ height: '100%', minHeight: 300, display: 'flex', flexDirection: 'column' }}>
            <Paper
              sx={{ flex: 1, minHeight: 0, border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column' }}
            >
              <ReviewToolbar onSave={onSaveCurrentTab} saving={saving} />

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

              <Box sx={{ flex: 1, minHeight: 0, p: 1.5 }}>
                {EDITOR_ORDER.map((label, i) => (
                  <Box key={editorKeys[label]} role="tabpanel" hidden={tab !== i} sx={{ height: '100%' }}>
                    <Box
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        // CKEditor full-height
                        '& .ck.ck-editor': { display: 'flex', flexDirection: 'column', height: '100%' },
                        '& .ck.ck-editor__main': { flex: 1, minHeight: 0, display: 'flex' },
                        '& .ck-editor__editable_inline': { flex: 1, minHeight: 0 },
                        // rounded corners
                        '& .ck.ck-toolbar': { borderTopLeftRadius: 6, borderTopRightRadius: 6 },
                        '& .ck.ck-editor__editable': { borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }
                      }}
                    >
                      {tab === i && (
                        <CKEditor
                          key={editorKeys[label]}           // stable but distinct per tab
                          editor={ClassicEditor}
                          data={sections[label] || ''}
                          onChange={(_, ed) => onEditorChange(label, ed)}  // debounced
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* RIGHT: Metadata sidebar */}
          <Grid item xs={12} lg={2} sx={{ height: '100%', minHeight: 300 }}>
            <ReviewSidebar paper={current} />
          </Grid>
        </Grid>
      </Box>

      {/* COMMENTS below work pane (page scrolls) */}
      <Box sx={{ mt: 2, px: 1.5, pb: 4 }}>
        <CommentsPanel paperId={paperId} />
      </Box>
    </Box>
  );
}

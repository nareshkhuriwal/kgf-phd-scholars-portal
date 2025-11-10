// =============================
// src/pages/reviews/ReviewEditor.jsx (full-height work pane; page-scroll comments)
// =============================
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  Stack,
  Chip,
  Alert,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import ReviewToolbar from '../../components/reviews/ReviewToolbar';
import ReviewSidebar from '../../components/reviews/ReviewSidebar';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import {
  loadReview,
  saveReviewSection,   // save only the active tab
  setReviewStatus      // mark complete / pending
} from '../../store/reviewsSlice';
import CommentsPanel from '../../components/comments/CommentsPanel';

// ---- Config ----
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
const WORKPANE_MIN = 600; // absolute minimum height (your request)

export default function ReviewEditor() {
  const { paperId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, error } = useSelector((s) => s.reviews || {});

  const [tab, setTab] = React.useState(0);
  const [sections, setSections] = React.useState(() => {
    const init = {}; EDITOR_ORDER.forEach((k) => (init[k] = ''));
    return init;
  });
  const [editorKeys] = React.useState(() => {
    const o = {}; EDITOR_ORDER.forEach((k) => (o[k] = `ck-${k.replace(/\W+/g, '_')}`)); return o;
  });

  const [saving, setSaving] = React.useState(false);
  const [savedOnce, setSavedOnce] = React.useState(false);

  React.useEffect(() => { dispatch(loadReview(paperId)); }, [dispatch, paperId]);

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

  const onChangeSection = (label, value) =>
    setSections((prev) => ({ ...prev, [label]: value }));

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

  const PdfPane = () => (
    <Paper sx={{ height: '100%', border: '1px solid #eee', borderRadius: 2, p: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>PDF Preview</Typography>
      {!current?.pdf_url ? (
        <Typography variant="body2" color="text.secondary">
          No PDF attached. Upload a PDF in Library → Paper Files and refresh.
        </Typography>
      ) : (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <embed
            src={`${current.pdf_url}#toolbar=1&navpanes=0`}
            type="application/pdf"
            style={{ width: '100%', height: '100%', border: 0, borderRadius: 8 }}
          />
        </Box>
      )}
    </Paper>
  );

  return (
    // Important: use minHeight so the page can grow with comments (browser scroll)
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PageHeader
        title={current?.title || 'Review Editor'}
        subtitle={current?.authors ? `${current.authors} • ${current.year || ''}` : 'Compose your literature review'}
        actions={
          <Stack direction="row" spacing={1}>
            {savedOnce && <Chip label="Saved" size="small" color="success" variant="outlined" />}
            <Button variant="outlined" onClick={() => navigate('/reviews')}>Back to Queue</Button>
            <Button variant="contained" disabled={saving} onClick={onSaveCurrentTab}>
              {saving ? 'Saving…' : `Save: ${EDITOR_ORDER[tab]}`}
            </Button>
            <Button variant="outlined" color="success" onClick={onMarkComplete}>Mark Complete</Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mx: 1.5, mb: 1 }}>{String(error)}</Alert>}

      {/* WORK PANE: fixed height; never collapses when comments grow */}
      <Box
        sx={{
          flex: '0 0 auto',
          height: { xs: 'min(150vh, 900px)', md: `${WORKPANE_VH}vh` },
          minHeight: WORKPANE_MIN,
          p: 1.5
        }}
      >
        <Grid container spacing={1.5} sx={{ p: 1.5, height: '100%', overflow: 'hidden' }}>
          {/* PDF (left) */}
          <Grid item xs={12} lg={5} sx={{ height: '100%', minHeight: 300 }}>
            <PdfPane />
          </Grid>

          {/* Editors (center) */}
          <Grid item xs={12} lg={5} sx={{ height: '100%', minHeight: 300, display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ flex: 1, minHeight: 0, border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
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
                          key={editorKeys[label]}
                          editor={ClassicEditor}
                          data={sections[label] || ''}
                          onChange={(_, ed) => onChangeSection(label, ed.getData())}
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar (right) – meta */}
          <Grid item xs={12} lg={2} sx={{ height: '100%', minHeight: 300 }}>
            <ReviewSidebar paper={current} />
          </Grid>
        </Grid>
      </Box>

      {/* COMMENTS: below work pane; no inner scrollbar — the page scrolls */}
      <Box sx={{ mt: 2, px: 1.5, pb: 4 }}>
        <CommentsPanel paperId={paperId} />
      </Box>
    </Box>
  );
}

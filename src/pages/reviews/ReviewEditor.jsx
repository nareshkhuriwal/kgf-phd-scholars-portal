import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';

import {
  Box, Paper, Grid, Typography, Button, Stack, Chip, Alert,
  Tabs, Tab, Divider, IconButton, Tooltip, useMediaQuery, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions  // <-- ADD THESE 3
} from '@mui/material';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import makeEditorConfig from '../../pages/reviews/EditorConfig';

import PageHeader from '../../components/PageHeader';
import ReviewToolbar from '../../components/reviews/ReviewToolbar';
import ReviewSidebar from '../../components/reviews/ReviewSidebar';
import PdfPane from '../../components/pdf/PdfPane';
import CommentsPanel from '../../components/comments/CommentsPanel';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import { SECTION_PLACEHOLDERS } from '../../components/reviews/sectionPlaceholders';
import { SECTION_LIMITS } from '../../components/reviews/sectionLimits';
import { extractCitationKeys, renumberCitations, buildCitationMap } from '../../utils/citations';
import { fetchSettings } from '../../store/settingsSlice';
import CitationPickerDialog from '../../components/citations/CitationPickerDialog';


import {
  loadReview,
  saveReviewSection,
  setReviewStatus,
  syncReviewCitations,
  loadReviewCitations
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
const WORKPANE_VH = 50;
const WORKPANE_MIN = 600;

const getCountMeta = (sectionLabel, wordCount, charCount) => {
  const limits = SECTION_LIMITS[sectionLabel] || {};

  const minWords = limits.minWords ?? 0;
  const minChars = limits.minChars ?? 0;

  const wordsMet = wordCount >= minWords;
  const charsMet = charCount >= minChars;

  if (wordsMet && charsMet) {
    return {
      color: '#2e7d32',
      label: `Words: ${wordCount} / ${minWords}+ ✓ | Characters: ${charCount} / ${minChars}+ ✓`,
    };
  }

  if (wordsMet || charsMet) {
    return {
      color: '#ed6c02',
      label: `Words: ${wordCount} / ${minWords}+ ${wordsMet ? '✓' : ''} | Characters: ${charCount} / ${minChars}+ ${charsMet ? '✓' : ''}`,
    };
  }

  return {
    color: '#6b7280',
    label: `Words: ${wordCount} / ${minWords}+ | Characters: ${charCount} / ${minChars}+`,
  };
};

export default function ReviewEditor() {
  const { paperId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  const { current, error } = useSelector((s) => s.reviews || {});
  const [sidebarOpen, setSidebarOpen] = React.useState(true); // Start closed on mobile/tablet
  const [pdfOpen, setPdfOpen] = React.useState(true);
  const [charCount, setCharCount] = React.useState(0);
  const [wordCount, setWordCount] = React.useState(0);
  const toolbarRef = React.useRef(null);

  // const [autoSaving, setAutoSaving] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState(null);
  // const lastSavedContentRef = React.useRef({});

  const [citationOpen, setCitationOpen] = React.useState(false);
  const editorRef = React.useRef(null);
  const [citeOpen, setCiteOpen] = React.useState(false);
  const { data: settings, loading: settingsLoading } = useSelector((s) => s.settings);
  const citationStyle = settings?.citationStyle || 'mla'; // ✅ Default to 'mla' to match backend

  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const savedContentRef = useRef({});
  const hydratedRef = useRef(false);
  const initialLoadRef = useRef(false);
  const previousTabRef = useRef(0);


  // ✅ NEW: Store citation map for ID lookup
  const [citationMap, setCitationMap] = React.useState({});
  const [tab, setTab] = React.useState(0);

  const [sections, setSections] = React.useState(() => {
    const init = {};
    EDITOR_ORDER.forEach((k) => (init[k] = ''));
    return init;
  });

  const [editorKeys] = React.useState(() => {
    const o = {};
    EDITOR_ORDER.forEach((k) => (o[k] = `ck-${k.replace(/\W+/g, '_')}`));
    return o;
  });

  const [saving, setSaving] = React.useState(false);


  const pid = React.useMemo(
    () => (paperId ?? current?.id ?? current?.paper_id) ?? null,
    [paperId, current]
  );



  // ✅ Warn user before closing/refreshing browser
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [unsavedChanges]);

  // ✅ Load settings when component mounts
  useEffect(() => {
    console.log('Component mounted - loading settings...');
    dispatch(fetchSettings());
  }, [dispatch]);

  // ✅ Log when settings change
  useEffect(() => {
    console.log('Settings updated:', settings);
    console.log('Current citation style:', citationStyle);
  }, [settings, citationStyle]);

  // ✅ Load citations and build map when needed (either for mapping or Citations tab)
  useEffect(() => {
    if (!pid || settingsLoading) return;

    const needsMap = EDITOR_ORDER[tab] === 'Literature Review';
    const needsCitationTab = EDITOR_ORDER[tab] === 'Citations';

    if (!needsMap && !needsCitationTab) return;

    console.log('Loading review citations for:', needsMap ? 'citation mapping' : 'Citations tab');
    dispatch(loadReviewCitations({ paperId: pid, style: citationStyle }))
      .unwrap()
      .then((response) => {
        console.log('Full API response:', response);
        const citations = response.citations || [];
        console.log('Extracted citations array:', citations);

        // Build citation key -> citation object map for Literature Review tab
        if (needsMap) {
          const map = buildCitationMap(citations);
          setCitationMap(map);
        }

        // Build HTML for Citations tab
        if (needsCitationTab) {
          if (citations.length > 0) {
            const citationHtml = citations
              .map((citation) => `<p>${citation.text}</p>`)
              .join('');

            console.log('Setting citations HTML for tab');
            setSections(prev => ({
              ...prev,
              'Citations': citationHtml
            }));
          } else {
            console.log('No citations found');
            setSections(prev => ({
              ...prev,
              'Citations': '<p><em>No citations found for this review.</em></p>'
            }));
          }
        }
      })
      .catch((error) => {
        console.error('Error loading citations:', error);
        if (needsCitationTab) {
          setSections(prev => ({
            ...prev,
            'Citations': '<p><em>Error loading citations. Please try again.</em></p>'
          }));
        }
      });
  }, [tab, pid, citationStyle, settingsLoading, dispatch]);



  // Auto-close sidebar on mobile/tablet
  React.useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
      setPdfOpen(false);
    } else {
      setPdfOpen(true);
    }
  }, [isDesktop]);

  React.useEffect(() => {
    const blockEnterSubmit = (e) => {
      if (e.key === 'Enter' && e.target?.closest('.ck')) {
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', blockEnterSubmit, true);
    return () => document.removeEventListener('keydown', blockEnterSubmit, true);
  }, []);

  const editorConfig = React.useMemo(() => {
    const label = EDITOR_ORDER[tab];
    return makeEditorConfig(
      pid,
      SECTION_PLACEHOLDERS[label] || 'Start writing here…'
    );
  }, [pid, tab]);

  useEffect(() => {
    if (!paperId) return;

    console.log('Loading review for paper ID:', paperId);
    hydratedRef.current = false; // ✅ ADD - Reset hydration flag
    initialLoadRef.current = false; // ✅ ADD

    dispatch(loadReview(paperId));
  }, [dispatch, paperId]);

  React.useEffect(() => {
    if (!current || hydratedRef.current) return;
    const obj = {};
    if (current.review_sections && typeof current.review_sections === 'object') {
      EDITOR_ORDER.forEach((k) => {
        const content = current.review_sections[k] || '';
        // ✅ Apply citation ID mapping when loading content
        obj[k] = k === 'Literature Review' ? renumberCitations(content, citationMap) : content;
      });
    } else {
      EDITOR_ORDER.forEach((label) => {
        const legacy = pickFirst(current, LEGACY_KEY_MAP[label] || []);
        obj[label] = legacy || '';
      });
    }
    setSections(obj);
    savedContentRef.current = { ...obj }; // ✅ ADD THIS - Initialize saved content
    hydratedRef.current = true;
    initialLoadRef.current = true;  // ✅ ADD THIS
    setUnsavedChanges(false);  // ✅ ADD THIS

    console.log('Sections hydrated successfully');  // ✅ ADD THIS (optional)

  }, [current, citationMap]);



  const activeLabel = React.useMemo(() => EDITOR_ORDER[tab], [tab]);
  const activeHtml = sections[activeLabel] || '';



  // ✅ Track content changes without auto-saving
  const onEditorChange = useCallback((label, editor) => {
    const data = editor.getData();
    const normalizedHtml = label === 'Literature Review'
      ? renumberCitations(data, citationMap)
      : data;

    setSections(prev => ({ ...prev, [label]: normalizedHtml }));

    // Check if content is different from saved version
    const savedContent = savedContentRef.current[label] || '';
    setUnsavedChanges(normalizedHtml !== savedContent);
  }, [citationMap]);





  // ✅ ADD: Save current tab before switching
  const saveCurrentTab = useCallback(async (label, content) => {
    if (!pid || !content) return false;

    const savedContent = savedContentRef.current[label] || '';
    if (content === savedContent) {
      console.log('No changes to save for:', label);
      return true;
    }

    console.log('Saving section:', label);
    setSaving(true);

    try {
      // Extract and sync citations if Literature Review
      let citationKeys = [];
      if (label === 'Literature Review') {
        citationKeys = extractCitationKeys(content);

        if (citationKeys.length > 0) {
          try {
            const syncResult = await dispatch(syncReviewCitations({
              reviewId: pid,
              citation_keys: citationKeys
            })).unwrap();

            const syncedCitations = syncResult?.citations || [];
            if (syncedCitations.length > 0) {
              const newMap = buildCitationMap(syncedCitations);
              setCitationMap(newMap);
            }
          } catch (error) {
            console.error('Failed to sync citations:', error);
          }
        }
      }

      // Save the section
      await dispatch(
        saveReviewSection({
          paperId: pid,
          section_key: label,
          html: btoa(unescape(encodeURIComponent(content))),
          citation_keys: citationKeys,
        })
      ).unwrap();

      savedContentRef.current[label] = content;
      setLastSavedAt(new Date());
      setUnsavedChanges(false);

      console.log('Section saved successfully:', label);
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [pid, dispatch]);

  // ✅ ADD: Handle tab change with auto-save
  const handleTabChange = useCallback(async (event, newTab) => {
    if (newTab === tab) return;

    const currentLabel = EDITOR_ORDER[tab];
    const currentContent = sections[currentLabel] || '';


    // Check if current tab has unsaved changes
    const savedContent = savedContentRef.current[currentLabel] || '';
    const hasChanges = currentContent !== savedContent;

    if (hasChanges) {
      console.log('Unsaved changes detected, saving before tab switch...');
      const saved = await saveCurrentTab(currentLabel, currentContent);


      if (!saved) {
        console.error('Failed to save, but allowing tab switch');
      }
    }

    previousTabRef.current = tab;
    setTab(newTab);
  }, [tab, sections, saveCurrentTab]);



  React.useEffect(() => {
    const activeLabel = EDITOR_ORDER[tab];
    const html = sections[activeLabel] || '';
    console.log("html before clean: ", html)
    const text = html.replace(/<[^>]*>/g, '').trim();
    setCharCount(text.length);

    const words = text.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [sections, tab]);

  const onSaveCurrentTab = async () => {
    const activeLabel = EDITOR_ORDER[tab];
    const activeHtml = sections[activeLabel] || '';
    await saveCurrentTab(activeLabel, activeHtml);
  };

  const Reviewed = async () => {
    // Save current tab first if there are unsaved changes
    const currentLabel = EDITOR_ORDER[tab];
    const currentContent = sections[currentLabel] || '';
    const savedContent = savedContentRef.current[currentLabel] || '';

    if (currentContent !== savedContent) {
      await saveCurrentTab(currentLabel, currentContent);
    }

    setSaving(true);
    try {
      await dispatch(setReviewStatus({ paperId, status: 'done' })).unwrap();
    } finally {
      setSaving(false);
    }
  };

  const ellipsize = (str, max = 40) =>
    str && str.length > max ? `${str.slice(0, max)}…` : str;

  const STATUS_META = {
    draft: { label: 'Draft', color: 'default' },
    in_progress: { label: 'In Progress', color: 'warning' },
    done: { label: 'Completed', color: 'success' },
  };


  function insertCitationAtCursor(citation) {
    const editor = editorRef.current;
    if (!editor) return;

    editor.model.change((writer) => {
      const selection = editor.model.document.selection;
      const position = selection.getFirstPosition();

      // Create the span element with attributes
      const span = writer.createElement('htmlSpan', {
        dataCite: citation.citation_key,
        className: 'citation-token'
      });

      // ✅ Use actual citation ID from database
      const citationId = citation.id || citation.citation_key;
      const textNode = writer.createText(`[${citationId}]`);
      writer.append(textNode, span);

      // Insert the span
      writer.insert(span, position);

      // Insert non-breaking space after
      const nbsp = writer.createText('\u00A0');
      const afterSpan = writer.createPositionAfter(span);
      writer.insert(nbsp, afterSpan);

      // Move selection after the space
      const finalPosition = writer.createPositionAfter(nbsp);
      writer.setSelection(finalPosition);
    });

    console.log("Citation inserted with ID:", citation.id, "Key:", citation.citation_key);

    // ✅ Update citation map immediately
    setCitationMap(prev => ({
      ...prev,
      [citation.citation_key]: citation
    }));
  }

  const SaveStatus = ({ saving, unsavedChanges, lastSavedAt }) => {
    if (saving) {  // ✅ Just saving, no autoSaving
      return (
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ transition: 'opacity 0.2s ease-in-out' }}
        >
          <Box sx={{ width: { xs: 40, sm: 60 } }}>
            <Divider
              sx={{
                height: 3,
                borderRadius: 1,
                bgcolor: 'primary.main',
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Saving…
          </Typography>
        </Stack>
      );
    }

    if (unsavedChanges) {
      return (
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#ed6c02',
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
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
              bgcolor: '#2e7d32',
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Saved {lastSavedAt.toLocaleTimeString()}
          </Typography>
        </Stack>
      );
    }

    return null;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Responsive Header */}
      <PageHeader
        title={
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600 }}>
            {current?.title || 'Review Editor'}
          </Typography>
        }
        subtitle={
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {[
                current?.authors,
                current?.year,
                current?.journal,
              ].filter(Boolean).join(' • ') || 'Compose your literature review'}
            </Typography>

            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
              {current?.area && (
                <Chip
                  size="small"
                  label={current.area}
                  variant="outlined"
                  sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                />
              )}

              {current?.category && (
                <Chip
                  size="small"
                  label={current.category}
                  variant="outlined"
                  sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                />
              )}

              {!isMobile && current?.doi && (
                <Tooltip title={current.doi}>
                  <Chip
                    size="small"
                    label={`DOI: ${ellipsize(current.doi, 20)}`}
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </Tooltip>
              )}

              {current?.status && (
                <Chip
                  size="small"
                  label={STATUS_META[current.status]?.label ?? current.status}
                  color={STATUS_META[current.status]?.color ?? 'default'}
                  variant="outlined"
                  sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                />
              )}
            </Stack>
          </Stack>
        }
        actions={
          <Stack
            direction={{ xs: 'column', sm: 'column', lg: 'row' }}  // Changed to lg breakpoint
            spacing={1}
            sx={{ width: { xs: '100%', sm: '100%', lg: 'auto' } }}  // Changed to lg breakpoint
          >
            <SaveStatus
              saving={saving}
              unsavedChanges={unsavedChanges}
              lastSavedAt={lastSavedAt}
            />

            <Button
              variant="outlined"
              onClick={() => navigate('/reviews/queue')}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={!isDesktop}  // Changed: fullWidth when NOT desktop
            >
              Back
            </Button>

            <Button
              variant="contained"
              disabled={saving}
              onClick={onSaveCurrentTab}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={!isDesktop}  // Changed: fullWidth when NOT desktop
            >
              {saving ? 'Saving…' : isMobile ? 'Save' : `Save: ${EDITOR_ORDER[tab]}`}
            </Button>

            <Button
              variant="outlined"
              color="success"
              onClick={Reviewed}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={!isDesktop}  // Changed: fullWidth when NOT desktop
            >
              Reviewed
            </Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mx: 1.5, mb: 1 }}>{String(error)}</Alert>}

      {/* Mobile/Tablet View Toggle Buttons */}
      {!isDesktop && (
        <Stack direction="row" spacing={1} sx={{ px: 1.5, py: 1 }}>
          <Button
            variant={pdfOpen ? 'contained' : 'outlined'}
            size="small"
            onClick={() => {
              setPdfOpen(true);
              setSidebarOpen(false);
            }}
            fullWidth
          >
            PDF
          </Button>
          <Button
            variant={!pdfOpen && !sidebarOpen ? 'contained' : 'outlined'}
            size="small"
            onClick={() => {
              setPdfOpen(false);
              setSidebarOpen(false);
            }}
            fullWidth
          >
            Editor
          </Button>
          <Button
            variant={sidebarOpen ? 'contained' : 'outlined'}
            size="small"
            onClick={() => {
              setPdfOpen(false);
              setSidebarOpen(true);
            }}
            fullWidth
          >
            Info
          </Button>
        </Stack>
      )}

      {/* WORK PANE */}
      <Box
        sx={{
          flex: '0 0 auto',
          height: {
            xs: 'auto',
            md: `${WORKPANE_VH}vh`
          },
          minHeight: { xs: 400, md: WORKPANE_MIN },
          p: { xs: 1, md: 1.5 },
          position: 'relative',
        }}
      >
        <Grid container spacing={{ xs: 1, md: 1.5 }} sx={{ height: '100%', overflow: 'hidden' }}>
          {/* LEFT: PDF - Desktop always shown, Mobile/Tablet conditional */}
          {(isDesktop || pdfOpen) && (
            <Grid
              item
              xs={12}
              lg={sidebarOpen ? 6 : (isDesktop ? 6 : 12)}
              sx={{
                height: '100%',
                minHeight: { xs: 400, md: 300 },
                display: { xs: pdfOpen ? 'block' : 'none', lg: 'block' }
              }}
            >
              <PdfPane
                fileUrl={current?.pdf_url || current?.file_url || ''}
                paperId={pid}
              />
            </Grid>
          )}

          {/* CENTER: Editors */}
          {(isDesktop || (!pdfOpen && !sidebarOpen)) && (
            <Grid
              item
              xs={12}
              lg={sidebarOpen ? 4 : 6}
              sx={{
                height: '100%',
                minHeight: { xs: 400, md: 320 },
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.25s ease-in-out',
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
                  onInsertCitation={() => setCiteOpen(true)}
                />

                <Tabs
                  value={tab}
                  onChange={handleTabChange}  // ✅ CHANGED: was (_, v) => setTab(v)
                  variant="scrollable"
                  scrollButtons
                  allowScrollButtonsMobile
                  sx={{
                    px: 1,
                    '.MuiTabs-flexContainer': { flexWrap: 'nowrap' },
                    minHeight: { xs: 36, sm: 40 },
                    '.MuiTab-root': {
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      minHeight: { xs: 36, sm: 40 },
                      px: { xs: 1, sm: 2 }
                    }
                  }}
                >
                  {EDITOR_ORDER.map((label) => (
                    <Tab key={label} label={label} />
                  ))}
                </Tabs>

                <Divider />

                <Box
                  ref={toolbarRef}
                  sx={{
                    borderBottom: '1px solid #eee',
                    backgroundColor: '#fafafa',
                    px: { xs: 0.5, sm: 1 },
                    py: 0.5,
                    '& .ck-toolbar': { border: 'none' }
                  }}
                />

                <Box sx={{ flex: 1, minHeight: 0, p: { xs: 1, sm: 1.5 } }}>
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
                                minHeight: { xs: '250px', sm: '300px' },
                                padding: { xs: '12px', sm: '16px' },
                                borderRadius: 6,
                                fontSize: { xs: '0.875rem', sm: '1rem' }
                              },
                            }}
                          >
                            <CKEditor
                              key={editorKeys[label]}
                              editor={DecoupledEditor}
                              data={sections[label] || ''}
                              config={editorConfig}
                              onReady={(editor) => {
                                editorRef.current = editor;
                                editor.on('openCitationPicker', () => {
                                  setCitationOpen(true);
                                })
                                if (toolbarRef.current) {
                                  toolbarRef.current.innerHTML = '';
                                  toolbarRef.current.appendChild(editor.ui.view.toolbar.element);
                                }
                              }}
                              onChange={(_, editor) => onEditorChange(label, editor)}
                            />
                          </Box>
                        )}

                        {(() => {
                          const activeLabel = EDITOR_ORDER[tab];
                          const meta = getCountMeta(activeLabel, wordCount, charCount);

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
                                fontWeight: (meta.color === '#2e7d32') ? 600 : 400,
                                display: 'block',
                                fontSize: { xs: '0.65rem', sm: '0.75rem' }
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
          )}

          {/* RIGHT: Metadata sidebar */}
          {sidebarOpen && (
            <Grid
              item
              xs={12}
              lg={2}
              sx={{
                display: { xs: sidebarOpen && !pdfOpen ? 'block' : 'none', lg: 'block' }
              }}
            >
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


      <CitationPickerDialog
        open={citeOpen}
        onClose={() => setCiteOpen(false)}
        onSelect={(citation) => {
          insertCitationAtCursor(citation);
          setCiteOpen(false);
        }}
      />


      {/* COMMENTS below work pane */}
      <Box sx={{ mt: 2, px: { xs: 1, sm: 1.5 }, pb: 4 }}>
        <CommentsPanel paperId={paperId} />
      </Box>
    </Box>
  );
}
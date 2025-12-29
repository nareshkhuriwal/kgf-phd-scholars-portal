// src/pages/reports/builder/ReportBuilder.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadChapters, loadUsers, fetchReportPreview, generateReport,
  createSavedReport, updateSavedReport, fetchSavedReport
} from '../../store/reportsSlice';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Stack, Paper, Typography, TextField, MenuItem, Button,
  Chip, Divider, LinearProgress, FormControlLabel, Checkbox,
  Snackbar, Alert, IconButton, Tooltip, Grid
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import CloseIcon from '@mui/icons-material/Close';

const REPORT_TEMPLATES = [
  { value: 'synopsis', label: 'Thesis Report' },
  { value: 'rol', label: 'Review of Literature (ROL)' },
  { value: 'presentation', label: 'Presentation' }
];
const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'Word (.docx)' },
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'pptx', label: 'PowerPoint (.pptx)' }
];
const EDITOR_ORDER = [
  'Literature Review', 'Key Issue', 'Solution Approach / Methodology used', 'Related Work',
  'Input Parameters used', 'Hardware / Software / Technology Used', 'Results',
  'Key advantages', 'Limitations', 'Citations', 'Remarks'
];
const ALL_OPTION = { id: '__ALL__', label: 'Select All Chapters' };

const TEMPLATE_CAPS = {
  synopsis: {
    showSections: true,
    showChapters: true,
    showFilters: true,
    chapterTypes: null, // null = all
  },
  presentation: {
    showSections: true,
    showChapters: true,
    showFilters: false,
    chapterTypes: ['presentation', 'synopsis'],
  },
  rol: {
    showSections: true,
    showChapters: false,
    showFilters: true,
    chapterTypes: null,
  },
};



// Utility: get current month and year formatted
const getCurrentMonthYear = () => {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Utility: make a full include map from partial include (ensures every key exists)
const normalizeInclude = (maybeInclude) => {
  const base = Object.fromEntries(EDITOR_ORDER.map(k => [k, false]));
  if (!maybeInclude || typeof maybeInclude !== 'object') return base;
  for (const k of EDITOR_ORDER) {
    base[k] = !!maybeInclude[k];
  }
  return base;
};

// Utility: coerce server saved report into UI shape (defensive)
const coerceSaved = (r) => {
  const filters = {
    areas: Array.isArray(r?.filters?.areas) ? r.filters.areas : [],
    years: Array.isArray(r?.filters?.years) ? r.filters.years : [],
    venues: Array.isArray(r?.filters?.venues) ? r.filters.venues : [],
    userId: r?.filters?.userId || null, // Changed from userIds array to single userId
  };
  const selections = {
    include: normalizeInclude(r?.selections?.include),
    includeOrder: Array.isArray(r?.selections?.includeOrder) ? r.selections.includeOrder : [...EDITOR_ORDER],
    chapters: Array.isArray(r?.selections?.chapters) ? r.selections.chapters : [],
  };

  // Add header/footer settings - always use current month/year for footerCenter
  const headerFooter = {
    headerTitle: r?.headerFooter?.headerTitle ?? '',
    headerRight: r?.headerFooter?.headerRight ?? 'SET',

    footerLeft: r?.headerFooter?.footerLeft ?? 'Poornima University, Jaipur',
    footerCenter: getCurrentMonthYear(), // Always use current month and year
  };

  return {
    name: r?.name ?? '',
    template: r?.template ?? 'rol',
    format: r?.format ?? 'pdf',
    filename: r?.filename ?? 'report',
    filters,
    selections,
    headerFooter,
  };
};

export default function ReportBuilder() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: pathId } = useParams();
  const editingId = pathId ? String(pathId) : null;

  const {
    preview, loadingPreview, generating, lastDownloadUrl, error,
    chapters, users, currentSaved, saving
  } = useSelector(s => s.reports);

  // Get current user and role
  const { user } = useSelector(s => s.auth || {});
  const role = user?.role; // 'researcher' | 'supervisor' | 'admin' | 'superuser'
  const isResearcher = role === 'researcher';
  const EMPTY_HELPER = ' ';

  // Load static data
  React.useEffect(() => {
    dispatch(loadChapters());
    dispatch(loadUsers());
  }, [dispatch]);

  // Fetch existing saved report if editing
  React.useEffect(() => {
    if (editingId) dispatch(fetchSavedReport(editingId));
  }, [dispatch, editingId]);

  // Local form state
  const [name, setName] = React.useState('');
  const [template, setTemplate] = React.useState('rol');
  const [format, setFormat] = React.useState('pdf');
  const [filename, setFilename] = React.useState('report');
  const [filters, setFilters] = React.useState({
    areas: [],
    years: [],
    venues: [],
    userId: null // Changed from userIds array to single userId
  });
  const [include, setInclude] = React.useState(normalizeInclude());
  const [chapterIds, setChapterIds] = React.useState([]);
  const [snack, setSnack] = React.useState(null);

  const caps = TEMPLATE_CAPS[template];


  // Flag to prevent hydration immediately after save
  const [justSaved, setJustSaved] = React.useState(false);

  // Header/Footer settings - footerCenter always uses current date
  const [headerFooter, setHeaderFooter] = React.useState({
    headerTitle: '',
    headerRight: 'SET',
    footerLeft: 'Poornima University, Jaipur',
    footerCenter: getCurrentMonthYear(),
  });

  // Auto-set userId to current user's ID for researchers (only if not already set)
  React.useEffect(() => {
    if (isResearcher && user?.id && !filters.userId && !editingId) {
      console.log('🔧 Auto-setting userId for researcher:', user.id);
      setFilters(f => ({ ...f, userId: String(user.id) }));
    }
  }, [isResearcher, user?.id, filters.userId, editingId]);

  // Warn if non-researcher is editing a report without userId
  React.useEffect(() => {
    if (!isResearcher && editingId && !filters.userId) {
      console.warn('⚠️ Editing a report without userId - user must select one');
    }
  }, [isResearcher, editingId, filters.userId]);

  // Hydrate form when currentSaved arrives/changes
  React.useEffect(() => {
    if (!editingId || !currentSaved) return;

    // Don't re-hydrate if we just saved - the form already has correct data
    if (justSaved) {
      console.log('⏭️ Skipping hydration - just saved');
      setJustSaved(false);
      return;
    }

    const s = coerceSaved(currentSaved);

    console.log('🔄 Hydrating form with saved report:', s);

    setName(s.name);
    setTemplate(s.template);
    setFormat(s.format);
    setFilename(s.filename);

    // Only update filters if we don't already have a userId set
    // This prevents overwriting the user's selection with stale DB data
    setFilters(prevFilters => {
      const newFilters = {
        ...s.filters,
        // Preserve existing userId if it's already set and the saved one is null
        userId: s.filters.userId || prevFilters.userId || null
      };
      console.log('🔄 Hydrating filters - prev:', prevFilters, 'new:', newFilters);
      return newFilters;
    });

    setInclude(s.selections.include);
    setChapterIds(s.selections.chapters);
    setHeaderFooter(s.headerFooter);
  }, [currentSaved, editingId, justSaved]);

  React.useEffect(() => {
    // Clear chapters if template doesn't support them
    if (!caps.showChapters) {
      setChapterIds([]);
    }

    // Clear filters if template doesn't support them
    if (!caps.showFilters) {
      setFilters(f => ({
        areas: [],
        years: [],
        venues: [],
        userId: isResearcher ? user?.id : null,
      }));
    }
  }, [template]);

  // Update header title when report name changes (if header title is empty)
  React.useEffect(() => {
    if (name && !headerFooter.headerTitle) {
      setHeaderFooter(prev => ({ ...prev, headerTitle: name }));
    }
  }, [name, headerFooter.headerTitle]);

  // Update footer center to current month/year when template changes to synopsis
  React.useEffect(() => {
    if (template === 'synopsis') {
      setHeaderFooter(prev => ({ ...prev, footerCenter: getCurrentMonthYear() }));
    }
  }, [template]);

  const payloadBase = {
    name,
    template,
    format,
    filename,
    filters: caps.showFilters ? {
      areas: filters.areas || [],
      years: filters.years || [],
      venues: filters.venues || [],
      userId: filters.userId ? parseInt(filters.userId, 10) : null,
    } : null,
    selections: {
      include: caps.showSections ? include : {},
      includeOrder: caps.showSections ? EDITOR_ORDER : [],
      chapters: caps.showChapters ? chapterIds : [],
    },
    headerFooter,
  };


  // Debug: Log filters state
  React.useEffect(() => {
    console.log('📊 Current filters state:', filters);
  }, [filters]);

  const chapterOptions = React.useMemo(() => {
    let list = chapters || [];

    // Apply template-based chapter type filtering
    if (caps?.chapterTypes) {
      list = list.filter(ch =>
        caps.chapterTypes.includes(ch.chapter_type)
      );
    }

    const mapped = list.map(ch => ({
      id: String(ch.id),
      label: ch.title,
    }));

    return mapped.length > 0 ? [ALL_OPTION, ...mapped] : [];
  }, [chapters, caps]);


  const selectedChapterObjects = React.useMemo(() => {
    return (chapterIds || []).map(id => {
      const ch = (chapters || []).find(c => String(c.id) === String(id));
      return { id: String(id), label: ch?.title || `Chapter ${id}` };
    });
  }, [chapterIds, chapters]);

  // Get selected user object for display
  const selectedUserObject = React.useMemo(() => {
    if (!filters.userId) return null;
    const u = (users || []).find(x => String(x.id) === String(filters.userId));
    return u ? { id: String(u.id), label: u.name || u.email || `User ${u.id}` } : null;
  }, [filters.userId, users]);

  const onSave = async () => {
    console.log('💾 Saving report with payload:', payloadBase);

    const action = editingId
      ? await dispatch(updateSavedReport({ id: editingId, ...payloadBase }))
      : await dispatch(createSavedReport(payloadBase));

    if (action.type.endsWith('/fulfilled')) {
      setJustSaved(true); // Prevent re-hydration
      setSnack({ severity: 'success', msg: 'Saved' });

      // Don't navigate or re-fetch if editing - just show success message
      if (!editingId) {
        const newId = action.payload?.data?.id ?? action.payload?.id;
        if (newId) {
          // Navigate to edit page
          navigate(`/reports/builder/${newId}`);
        }
      }
      // If editing, the form already has the correct data, no need to re-hydrate
    } else {
      setSnack({ severity: 'error', msg: 'Failed to save' });
    }
  };

  const onSaveAndGenerate = async () => {
    console.log('🚀 Generating report with payload:', payloadBase);

    const saved = editingId
      ? await dispatch(updateSavedReport({ id: editingId, ...payloadBase }))
      : await dispatch(createSavedReport(payloadBase));

    if (saved.type.endsWith('/fulfilled')) {
      setJustSaved(true); // Prevent re-hydration

      // Generate the report
      const g = await dispatch(generateReport(payloadBase));
      if (g.type.endsWith('/fulfilled')) setSnack({ severity: 'success', msg: 'Report ready.' });
      else setSnack({ severity: 'error', msg: 'Generate failed' });

      // Don't navigate or re-fetch if editing
      if (!editingId) {
        const newId = saved.payload?.data?.id ?? saved.payload?.id;
        if (newId) {
          navigate(`/reports/builder/${newId}`);
        }
      }
      // If editing, the form already has the correct data, no need to re-hydrate
    } else {
      setSnack({ severity: 'error', msg: 'Save failed' });
    }
  };

  const onPreview = () => {
    console.log('👁️ Previewing report with payload:', payloadBase);
    dispatch(fetchReportPreview(payloadBase));
  };

  // helpers
  const parseCsv = (val) => val.split(',').map(s => s.trim()).filter(Boolean);
  const selectAllSections = () => setInclude(Object.fromEntries(EDITOR_ORDER.map(k => [k, true])));
  const clearAllSections = () => setInclude(Object.fromEntries(EDITOR_ORDER.map(k => [k, false])));
  const clearFilters = () => setFilters({ areas: [], years: [], venues: [], userId: isResearcher ? user?.id : null });

  // Show header/footer ONLY for Thesis Report (synopsis template)
  const showHeaderFooter = template === 'synopsis';

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {editingId ? `Edit Report #${editingId}` : 'Build Report'}
        </Typography>

        {/* Toolbar */}
        <Box
          sx={{
            display: 'flex', gap: 1.5, alignItems: 'center',
            overflowX: 'auto', whiteSpace: 'nowrap', pb: 1,
            '& > *': { flex: '0 0 auto' }
          }}
        >
          <TextField
            label="Report Name"
            value={name}
            onChange={e => setName(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
            required
          />

          <TextField
            select
            label="Template"
            value={template}
            onChange={e => setTemplate(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          >
            {REPORT_TEMPLATES.map(o => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
          </TextField>

          <TextField
            select
            label="Format"
            value={format}
            onChange={e => setFormat(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          >
            {FORMATS.map(o => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
          </TextField>
        </Box>
      </Paper>

      {/* Header & Footer Settings (only for Thesis Report) */}
      {showHeaderFooter && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Header & Footer Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customize the header and footer that will appear on each page of your document
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Header Title"
                value={headerFooter.headerTitle}
                onChange={(e) => setHeaderFooter(prev => ({ ...prev, headerTitle: e.target.value }))}
                fullWidth
                size="small"
                helperText="This will appear in the center of the header on each page"
                placeholder={name || "Enter report title"}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Header Right Section"
                value={headerFooter.headerRight}
                onChange={(e) => setHeaderFooter(prev => ({ ...prev, headerRight: e.target.value }))}
                fullWidth
                size="small"
                helperText="Short text for the right side of header (e.g., SET, Department code)"
                placeholder="SET"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Footer Left"
                value={headerFooter.footerLeft}
                onChange={(e) => setHeaderFooter(prev => ({ ...prev, footerLeft: e.target.value }))}
                fullWidth
                size="small"
                helperText="e.g., University or Organization name"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Footer Center"
                value={headerFooter.footerCenter}
                onChange={(e) => setHeaderFooter(prev => ({ ...prev, footerCenter: e.target.value }))}
                fullWidth
                size="small"
                helperText="Current month and year (auto-updates)"
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info" variant="outlined">
                Page numbers will automatically appear on the right side of the footer
              </Alert>
            </Grid>
          </Grid>
        </Paper>
      )}

      {caps?.showFilters && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1">Filters Applied</Typography>

          {/* Warning for missing userId */}
          {!isResearcher && !filters.userId && (
            <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
              <strong>User selection required!</strong> Please select a user below to generate the report for.
            </Alert>
          )}

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
            {filters.areas.length > 0 && <Chip label={`Areas: ${filters.areas.join(', ')}`} />}
            {filters.years.length > 0 && <Chip label={`Years: ${filters.years.join(', ')}`} />}
            {filters.venues.length > 0 && <Chip label={`Venues: ${filters.venues.join(', ')}`} />}
            {filters.userId && (
              <Chip
                label={`User: ${(() => {
                  const u = (users || []).find(x => String(x.id) === String(filters.userId));
                  return u?.name || u?.email || `User ${filters.userId}`;
                })()}`}
                color="primary"
              />
            )}
            {!filters.userId && filters.areas.length === 0 && filters.years.length === 0 && filters.venues.length === 0 &&
              <Typography variant="body2" color="text.secondary">No filters applied.</Typography>}
          </Stack>

          <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
            {/* User Selection */}
            {!isResearcher && (
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={(users || []).map(u => ({
                    id: String(u.id),
                    label: u.name || u.email || `User ${u.id}`,
                  }))}
                  value={selectedUserObject}
                  onChange={(_, val) => {
                    setFilters(f => ({ ...f, userId: val?.id || null }));
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select User"
                      size="small"
                      required
                      helperText="Select a user to generate report for"
                    />
                  )}
                  fullWidth
                />
              </Grid>
            )}

            {/* Researcher Info */}
            {isResearcher && (
              <Grid item xs={12} md={4}>
                <Alert severity="info">
                  Report will be generated for your account:{' '}
                  <strong>{user?.name || user?.email}</strong>
                </Alert>
              </Grid>
            )}

            {/* Areas */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Areas (CSV)"
                placeholder="QEM, VQE"
                size="small"
                fullWidth
                helperText={EMPTY_HELPER}
                value={filters.areas.join(', ')}
                onChange={e =>
                  setFilters(f => ({ ...f, areas: parseCsv(e.target.value) }))
                }
              />

            </Grid>

            {/* Years */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Years (CSV)"
                placeholder="2024, 2025"
                size="small"
                fullWidth
                helperText={EMPTY_HELPER}
                value={filters.years.join(', ')}
                onChange={e =>
                  setFilters(f => ({ ...f, years: parseCsv(e.target.value) }))
                }
              />

            </Grid>

            {/* Venues */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Venues (CSV)"
                placeholder="Nature, PRX"
                size="small"
                fullWidth
                helperText={EMPTY_HELPER}
                value={filters.venues.join(', ')}
                onChange={e =>
                  setFilters(f => ({ ...f, venues: parseCsv(e.target.value) }))
                }
              />

            </Grid>

            {/* Clear Filters */}
            <Grid item xs={12} sm={6} md={1} textAlign="center">
              <Tooltip title="Clear all filters">
                <span>
                  <IconButton size="small" onClick={clearFilters}>
                    <ClearAllIcon fontSize="inherit" />
                  </IconButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>

        </Paper>

      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        {caps.showSections && (

          <Box sx={{ mt: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1">
                Include Sections ({Object.values(include).filter(Boolean).length}/{EDITOR_ORDER.length})
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" startIcon={<SelectAllIcon />} onClick={selectAllSections}>Select all</Button>
                <Button size="small" startIcon={<CloseIcon />} onClick={clearAllSections}>None</Button>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              {EDITOR_ORDER.map(k => (
                <FormControlLabel
                  key={k}
                  control={
                    <Checkbox
                      checked={!!include[k]}
                      onChange={(_, v) => setInclude(s => ({ ...s, [k]: v }))}
                      size="small"
                    />
                  }
                  label={k}
                />
              ))}
            </Stack>
          </Box>
        )}

        {caps.showChapters && (

          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 0.5 }}>
              <Button
                size="small"
                onClick={() => setChapterIds((chapters || []).map(c => String(c.id)))}
              >
                Select All
              </Button>
              <Button
                size="small"
                onClick={() => setChapterIds([])}
              >
                Clear
              </Button>
            </Stack>

            <Autocomplete
              multiple
              disableCloseOnSelect
              options={chapterOptions}
              value={selectedChapterObjects}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              getOptionLabel={(o) => o.label}
              onChange={(_, values) => {
                const hasAll = values.some(v => v.id === ALL_OPTION.id);

                if (hasAll) {
                  if (chapterIds.length === (chapters || []).length) {
                    setChapterIds([]);
                  } else {
                    setChapterIds((chapters || []).map(c => String(c.id)));
                  }
                  return;
                }

                setChapterIds(values.map(v => v.id));
              }}
              renderOption={(props, option, { selected }) => (
                <li {...props} key={option.id}>
                  <Checkbox
                    checked={
                      option.id === ALL_OPTION.id
                        ? chapterIds.length === (chapters || []).length && chapterIds.length > 0
                        : selected
                    }
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {option.label}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Chapters (${chapterIds.length}/${chapters?.length || 0})`}
                  size="small"
                  placeholder="Select chapters"
                />
              )}
              sx={{ minWidth: 400 }}
            />
          </Box>
        )}
      </Paper>


      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          onClick={onSave}
          disabled={saving || !name || (!isResearcher && !filters.userId)}
        >
          Save
        </Button>
        <Button
          variant="contained"
          onClick={onSaveAndGenerate}
          disabled={saving || generating || !name || (!isResearcher && !filters.userId)}
        >
          Save & Generate
        </Button>
        <Button onClick={() => navigate('/reports')}>Back to Saved</Button>
      </Stack>

      {loadingPreview && <LinearProgress />}

      {lastDownloadUrl && (
        <Alert severity="success" action={<Button size="small" href={lastDownloadUrl}>Download</Button>}>
          Report ready.
        </Alert>
      )}
      {error && <Alert severity="error">{String(error)}</Alert>}

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 6 }}
      >
        {snack && <Alert severity={snack.severity}>{snack.msg}</Alert>}
      </Snackbar>
    </Stack>
  );
}
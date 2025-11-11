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
  Snackbar, Alert, IconButton, Tooltip
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import CloseIcon from '@mui/icons-material/Close';

const REPORT_TEMPLATES = [
  { value: 'synopsis', label: 'Synopsis Report' },
  { value: 'rol', label: 'Review of Literature (ROL)' },
  { value: 'final_thesis', label: 'Final Thesis' },
  { value: 'presentation', label: 'Presentation' }
];
const FORMATS = [
  { value: 'pdf',  label: 'PDF' },
  { value: 'docx', label: 'Word (.docx)' },
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'pptx', label: 'PowerPoint (.pptx)' }
];
const EDITOR_ORDER = [
  'Litracture Review', 'Key Issue', 'Solution Approach / Methodology used', 'Related Work',
  'Input Parameters used', 'Hardware / Software / Technology Used', 'Results',
  'Key advantages', 'Limitations', 'Citations', 'Remarks'
];

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
    areas:   Array.isArray(r?.filters?.areas)   ? r.filters.areas   : [],
    years:   Array.isArray(r?.filters?.years)   ? r.filters.years   : [],
    venues:  Array.isArray(r?.filters?.venues)  ? r.filters.venues  : [],
    userIds: Array.isArray(r?.filters?.userIds) ? r.filters.userIds : [],
  };
  const selections = {
    include:      normalizeInclude(r?.selections?.include),
    includeOrder: Array.isArray(r?.selections?.includeOrder) ? r.selections.includeOrder : [...EDITOR_ORDER],
    chapters:     Array.isArray(r?.selections?.chapters) ? r.selections.chapters : [],
  };
  return {
    name:      r?.name ?? '',
    template:  r?.template ?? 'rol',
    format:    r?.format ?? 'pdf',
    filename:  r?.filename ?? 'report',
    filters,
    selections,
  };
};

export default function ReportBuilder() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: pathId } = useParams();               // <-- read :id from path
  const editingId = pathId ? String(pathId) : null;  // string id or null

  const {
    preview, loadingPreview, generating, lastDownloadUrl, error,
    chapters, users, currentSaved, saving
  } = useSelector(s => s.reports);

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
  const [filters, setFilters] = React.useState({ areas: [], years: [], venues: [], userIds: [] });
  const [include, setInclude] = React.useState(normalizeInclude());
  const [chapterIds, setChapterIds] = React.useState([]);
  const [snack, setSnack] = React.useState(null);

  // Hydrate form when currentSaved arrives/changes
  React.useEffect(() => {
    if (!editingId || !currentSaved) return;
    const s = coerceSaved(currentSaved);
    setName(s.name);
    setTemplate(s.template);
    setFormat(s.format);
    setFilename(s.filename);
    setFilters(s.filters);
    setInclude(s.selections.include);
    setChapterIds(s.selections.chapters);
  }, [currentSaved, editingId]);

  const payloadBase = {
    name, template, format, filename,
    filters,
    selections: { include, includeOrder: EDITOR_ORDER, chapters: chapterIds }
  };

  const onSave = async () => {
    const action = editingId
      ? await dispatch(updateSavedReport({ id: editingId, ...payloadBase }))
      : await dispatch(createSavedReport(payloadBase));

    if (action.type.endsWith('/fulfilled')) {
      setSnack({ severity: 'success', msg: 'Saved' });
      // If newly created, navigate to edit route (path param)
      if (!editingId) {
        const newId = action.payload?.data?.id ?? action.payload?.id;
        if (newId) navigate(`/reports/builder/${newId}`);
      }
    } else {
      setSnack({ severity: 'error', msg: 'Failed to save' });
    }
  };

  const onSaveAndGenerate = async () => {
    const saved = editingId
      ? await dispatch(updateSavedReport({ id: editingId, ...payloadBase }))
      : await dispatch(createSavedReport(payloadBase));

    if (saved.type.endsWith('/fulfilled')) {
      const g = await dispatch(generateReport(payloadBase));
      if (g.type.endsWith('/fulfilled')) setSnack({ severity: 'success', msg: 'Report ready.' });
      else setSnack({ severity: 'error', msg: 'Generate failed' });
      if (!editingId) {
        const newId = saved.payload?.data?.id ?? saved.payload?.id;
        if (newId) navigate(`/reports/builder/${newId}`);
      }
    } else {
      setSnack({ severity: 'error', msg: 'Save failed' });
    }
  };

  const onPreview = () => dispatch(fetchReportPreview(payloadBase));

  // helpers
  const parseCsv = (val) => val.split(',').map(s => s.trim()).filter(Boolean);
  const selectAllSections = () => setInclude(Object.fromEntries(EDITOR_ORDER.map(k => [k, true])));
  const clearAllSections  = () => setInclude(Object.fromEntries(EDITOR_ORDER.map(k => [k, false])));
  const clearFilters = () => setFilters({ areas: [], years: [], venues: [], userIds: [] });

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1">
          {editingId ? `Edit Report #${editingId}` : 'Build Report'}
        </Typography>

        {/* Toolbar */}
        <Box
          sx={{
            mt: 1, display: 'flex', gap: 1.5, alignItems: 'center',
            overflowX: 'auto', whiteSpace: 'nowrap', pb: 1,
            '& > *': { flex: '0 0 auto' }
          }}
        >
          <TextField label="Report Name" value={name} onChange={e => setName(e.target.value)} size="small" sx={{ minWidth: 300 }} />

          <TextField
            select label="Template" value={template}
            onChange={e => setTemplate(e.target.value)} size="small" sx={{ minWidth: 220 }}
          >
            {REPORT_TEMPLATES.map(o => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
          </TextField>

          <TextField
            select label="Format" value={format}
            onChange={e => setFormat(e.target.value)} size="small" sx={{ minWidth: 220 }}
          >
            {FORMATS.map(o => (<MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>))}
          </TextField>

          {/* <TextField label="File name" value={filename} onChange={e=>setFilename(e.target.value)} size="small" sx={{ minWidth: 180 }} /> */}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1">Filters Applied</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
          {filters.areas.length  > 0 && <Chip label={`Areas: ${filters.areas.join(', ')}`} />}
          {filters.years.length  > 0 && <Chip label={`Years: ${filters.years.join(', ')}`} />}
          {filters.venues.length > 0 && <Chip label={`Venues: ${filters.venues.join(', ')}`} />}
          {filters.userIds.length > 0 && (
            <Chip
              label={`Users: ${filters.userIds.map(id => {
                const u = (users || []).find(x => String(x.id) === String(id));
                return u?.name || u?.email || `User ${id}`;
              }).join(', ')}`}
            />
          )}
          {Object.values(filters).every(arr => arr.length === 0) &&
            <Typography variant="body2" color="text.secondary">No filters applied.</Typography>}
        </Stack>

        <Box sx={{ mt: 2, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Autocomplete
            multiple
            options={(users || []).map(u => ({ id: String(u.id), label: u.name || u.email || `User ${u.id}` }))}
            value={(filters.userIds || []).map(id => {
              const u = (users || []).find(x => String(x.id) === String(id));
              return { id: String(id), label: u?.name || u?.email || `User ${id}` };
            })}
            onChange={(_, vals) => setFilters(f => ({ ...f, userIds: vals.map(v => v.id) }))}
            renderInput={(params) => <TextField {...params} label={`Users (${filters.userIds.length})`} size="small" sx={{ minWidth: 400 }} />}
            sx={{ minWidth: 260 }}
          />

          <TextField
            label="Areas (CSV)" placeholder="QEM, VQE"
            size="small" sx={{ minWidth: 220 }}
            value={filters.areas.join(', ')}
            onChange={e => setFilters(f => ({ ...f, areas: parseCsv(e.target.value) }))}
          />
          <TextField
            label="Years (CSV)" placeholder="2024, 2025"
            size="small" sx={{ minWidth: 220 }}
            value={filters.years.join(', ')}
            onChange={e => setFilters(f => ({ ...f, years: parseCsv(e.target.value) }))}
          />
          <TextField
            label="Venues (CSV)" placeholder="Nature, PRX"
            size="small" sx={{ minWidth: 220 }}
            value={filters.venues.join(', ')}
            onChange={e => setFilters(f => ({ ...f, venues: parseCsv(e.target.value) }))}
          />

          <Tooltip title="Clear all filters">
            <span>
              <IconButton size="small" onClick={clearFilters}><ClearAllIcon fontSize="inherit" /></IconButton>
            </span>
          </Tooltip>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
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

        <Box sx={{ mt: 2 }}>
          <Autocomplete
            multiple
            options={(chapters || []).map(ch => ({ id: String(ch.id), label: ch.title }))}
            value={(chapterIds || []).map(id => {
              const ch = (chapters || []).find(x => String(x.id) === String(id));
              return { id: String(id), label: ch?.title || `Chapter ${id}` };
            })}
            onChange={(_, vals) => setChapterIds(vals.map(v => v.id))}
            renderInput={(params) => <TextField {...params} label={`Chapters (${chapterIds.length})`} size="small" />}
          />
        </Box>
      </Paper>

      <Stack direction="row" spacing={2}>
        {/* <Button variant="outlined" onClick={onPreview}>Preview</Button> */}
        <Button variant="outlined" onClick={onSave} disabled={saving || !name}>Save</Button>
        <Button variant="contained" onClick={onSaveAndGenerate} disabled={saving || generating || !name}>
          Save & Generate
        </Button>
        <Button onClick={() => navigate('/reports')}>Back to Saved</Button>
      </Stack>

      {loadingPreview && <LinearProgress />}

      {/* {preview && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6">Preview</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>Outline</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
            {(preview.outline || []).map((s, i) => (<Chip key={i} label={s} />))}
          </Stack>
          {!!(preview.kpis || []).length && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">KPIs</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 1 }}>
                {preview.kpis.map((k, i) => (<Chip key={i} label={`${k.label}: ${k.value}`} />))}
              </Stack>
            </>
          )}
        </Paper>
      )} */}

      {lastDownloadUrl && (
        <Alert severity="success" action={<Button size="small" href={lastDownloadUrl}>Download</Button>}>
          Report ready.
        </Alert>
      )}
      {error && <Alert severity="error">{String(error)}</Alert>}
      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack(null)}>
        {snack && <Alert severity={snack.severity}>{snack.msg}</Alert>}
      </Snackbar>
    </Stack>
  );
}

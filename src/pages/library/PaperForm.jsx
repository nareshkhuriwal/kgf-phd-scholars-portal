// src/pages/PaperForm.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';

import { useNavigate, useParams } from 'react-router-dom';
import {
  AppBar, Toolbar, Paper as MUIPaper, Box, Typography, Grid,
  TextField, Button, CircularProgress, Divider, Stack, Chip, FormControl, InputLabel, Select, MenuItem, FormHelperText
} from '@mui/material';
import AttachmentIcon from '@mui/icons-material/Attachment';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { attachPaperFile } from '../../store/papersSlice';
import { useLocation } from 'react-router-dom';
import { 
  addPaper, 
  editPaper, 
  loadPaper, 
  clearCurrent,
  loadCitationTypes // ✅ Add this import
} from '../../store/papersSlice';




const SINGLE_LINE_FIELDS = [
  { key: 'paper_code', label: 'Paper ID' },
  { key: 'doi', label: 'DOI' },
  { key: 'authors', label: 'Author(s)' },
  { key: 'year', label: 'Year' },
  { key: 'title', label: 'Title' },
  { key: 'journal', label: 'Name of Journal/Conference' },
  { key: 'issn_isbn', label: 'ISSN / ISBN' },
  { key: 'publisher', label: 'Name of Publisher / Organization' },

  // ✅ FIXED MAPPINGS
  { key: 'place', label: 'Place of Conference' },
  { key: 'area', label: 'Area / Sub Area' },

  { key: 'volume', label: 'Volume' },
  { key: 'issue', label: 'Issue' },
  { key: 'page_no', label: 'Page No' },
  { key: 'category', label: 'Category of Paper' },
];



const pick = (obj, cands) => { for (const k of cands) if (obj?.[k] != null) return obj[k]; return ''; };

const prettyBytes = (b = 0) => { const u = ['B', 'KB', 'MB', 'GB']; let i = 0, n = +b; while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; } return `${n.toFixed(1)} ${u[i]}`; };

export default function PaperForm({ mode = 'create' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { paperId } = useParams();

  // ✅ Load citation types
  const [loadingTypes, setLoadingTypes] = React.useState(false);

  // ✅ Get citation types from Redux
  const { 
    current, 
    loading, 
    uploading, 
    progress,
    citationTypes = [], // ✅ Default to empty array
    citationTypesLoading = false,
    citationTypesError = null
  } = useSelector((s) => s.papers || {});

  const { register, handleSubmit, reset, setError, control, formState: { errors, isSubmitting } } =
    useForm({
      defaultValues: {
        place: 'N/A',
        citation_type_code: '',
      },
    });


  const location = useLocation();
  const navState = location.state;

  // New file to upload (optional)
  const [file, setFile] = React.useState(null);

  // Existing file from server (edit mode)
  const existingFile = React.useMemo(() => {
    // prefer first item in files[], else fallback to pdf_url
    const f = Array.isArray(current?.files) && current.files.length ? current.files[0] : null;
    if (f) return { url: f.url, name: f.original_name, size: f.size_bytes };
    if (current?.pdf_url) return { url: current.pdf_url, name: 'Attached PDF', size: null };
    return null;
  }, [current]);

  // ✅ Load citation types on mount with debug logging
  React.useEffect(() => {
    console.log('Dispatching loadCitationTypes...');
    dispatch(loadCitationTypes())
      .then((result) => {
        console.log('loadCitationTypes result:', result);
      })
      .catch((error) => {
        console.error('loadCitationTypes error:', error);
      });
  }, [dispatch]);

  // ✅ Debug log when citation types change
  React.useEffect(() => {
    console.log('Citation types updated:', {
      citationTypes,
      length: citationTypes?.length,
      loading: citationTypesLoading,
      error: citationTypesError
    });
  }, [citationTypes, citationTypesLoading, citationTypesError]);


  React.useEffect(() => {
    if (mode === 'edit' && paperId) dispatch(loadPaper(paperId));
    // return () => dispatch(clearCurrent());
  }, [dispatch, mode, paperId]);

  // 🔹 THIS WAS MISSING — populate form
  React.useEffect(() => {
    if (mode === 'edit' && current) {
      reset({
        paper_code: current.paper_code ?? '',
        doi: current.doi ?? '',
        authors: current.authors ?? '',
        year: current.year ?? '',
        title: current.title ?? '',
        journal: current.journal ?? '',
        issn_isbn: current.issn_isbn ?? '',
        publisher: current.publisher ?? '',
        place: current.place ?? 'N/A',   
        area: current.area ?? '',
        volume: current.volume ?? '',
        issue: current.issue ?? '',
        page_no: current.page_no ?? '',
        category: current.category ?? '',
        citation_type_code: current.citation_type_code ?? '',

      });
    }
  }, [current, mode, reset]);


  const onSubmit = async (values) => {
    try {
      // 1️⃣ Update paper metadata (JSON only)
      let saved;

      if (mode === 'create') {
        // If a PDF is selected, include it so service builds FormData // 
        const payload = file ? { ...values, file } : values; // If a PDF is selected if (file) { payload.file = file; }
        saved = await dispatch(addPaper(payload)).unwrap();
      } else {
        saved = await dispatch(
          editPaper({
            id: Number(paperId),
            data: values
          })
        ).unwrap();
      }

      const paperIdToUse = saved?.id || Number(paperId);

      // 2️⃣ Upload / replace file separately (FormData)
      if (file && paperIdToUse) {
        await dispatch(
          attachPaperFile({
            id: paperIdToUse,
            file,
          })
        ).unwrap();
      }

      if (
        navState?.from === 'papers-list' &&
        Array.isArray(navState.orderedIds)
      ) {
        const nextIndex = navState.index + 1;
        const nextPaperId = navState.orderedIds[nextIndex];

        if (nextPaperId) {
          navigate(`/library/papers/${nextPaperId}`, {
            state: {
              ...navState,
              index: nextIndex,
            },
            replace: true,
          });
        } else {
          navigate('/papers');
        }
      } else {
        navigate('/papers');
      }

    } catch (err) {
      setError('root', {
        type: 'server',
        message: err?.message || 'Save failed',
      });
    }
  };

  const onCancel = () => navigate('/papers');

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="static" color="inherit" elevation={0}
        sx={{ borderBottom: '1px solid #eee', bgcolor: 'background.paper' }}>
        <Toolbar sx={{ gap: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {mode === 'create' ? 'Add Paper' : 'Edit Paper'}
          </Typography>
          {mode === 'edit' && existingFile && (
            <Chip size="small" color="primary" variant="outlined" label="PDF attached" />
          )}
          <Button variant="outlined" onClick={onCancel} disabled={isSubmitting || loading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || loading || uploading}
          >
            {(isSubmitting || uploading) ? 'Saving…' : 'Submit'}
          </Button>

        </Toolbar>
      </AppBar>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate
        sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
        <MUIPaper variant="outlined" sx={{ p: 2, mb: 2 }}>
          {(loading && mode === 'edit') ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Grid container spacing={2}>

              {SINGLE_LINE_FIELDS.map(({ key, label }) => {
                const rules = key === 'title' ? { required: 'Title is required' } : {};

                return (
                  <Grid item xs={12} md={6} key={key}>
                    <TextField
                      label={label}
                      fullWidth
                      error={!!errors[key]}
                      helperText={errors[key]?.message || ''}
                      {...register(key, rules)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                );
              })}


                            {/* ✅ Citation Type Dropdown */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="citation_type_code"
                  control={control}
                  rules={{ required: 'Citation type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.citation_type_code}>
                      <InputLabel shrink>Citation Type *</InputLabel>
                      <Select
                        {...field}
                        label="Citation Type"
                        displayEmpty
                        disabled={citationTypesLoading}
                      >
                        <MenuItem value="">
                          <em>{citationTypesLoading ? 'Loading...' : 'Select Citation Type'}</em>
                        </MenuItem>
                        {citationTypes.map((type) => (
                          <MenuItem key={type.code} value={type.code}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.citation_type_code && (
                        <FormHelperText>{errors.citation_type_code.message}</FormHelperText>
                      )}
                      {citationTypesError && (
                        <FormHelperText>Failed to load citation types</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>


            </Grid>
          )}
        </MUIPaper>

        {/* Attach / Replace PDF */}
        <MUIPaper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>PDF Attachment</Typography>

          {/* Existing file (edit mode) */}
          {mode === 'edit' && existingFile && !file && (
            <Box sx={{ mb: 1.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                <Typography variant="body2">
                  <strong>{existingFile.name}</strong>
                  {existingFile.size ? ` • ${prettyBytes(existingFile.size)}` : ''}
                </Typography>
                <Button
                  size="small"
                  endIcon={<OpenInNewIcon />}
                  onClick={() => window.open(existingFile.url, '_blank', 'noopener')}
                >
                  Open PDF
                </Button>
              </Stack>

              {/* Inline preview (optional; keeps things tidy) */}
              <Box sx={{ mt: 1, border: '1px solid #eee', borderRadius: 1, overflow: 'hidden', height: 360 }}>
                <embed
                  title="pdf"
                  src={`${existingFile.url}#toolbar=1&navpanes=0&scrollbar=1`}
                  type="application/pdf"
                  style={{ width: '100%', height: '100%', border: 0 }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />
            </Box>
          )}

          {/* Replace / Choose new file */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<AttachmentIcon />}
              disabled={uploading}
            >
              {file ? 'Change File' : (mode === 'edit' && existingFile ? 'Replace File' : 'Choose File')}
              <input
                hidden
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </Button>

            {file && (
              <Typography variant="body2">
                {file.name} • {prettyBytes(file.size)}
              </Typography>
            )}
          </Stack>

          {errors.root?.message && (
            <Typography color="error" sx={{ mt: 2 }}>
              {errors.root.message}
            </Typography>
          )}
        </MUIPaper>

        {/* Bottom bar */}
        <Box sx={{ position: 'sticky', bottom: 0, mt: 2, borderTop: '1px solid #eee', bgcolor: 'background.paper' }}>
          <Toolbar sx={{ justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="outlined" onClick={onCancel} disabled={isSubmitting || loading}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={isSubmitting || loading || uploading}>
              {(isSubmitting || uploading) ? `Saving${typeof progress === 'number' ? ` ${progress}%` : '…'}` : 'Submit'}
            </Button>
          </Toolbar>
        </Box>
      </Box>
    </Box>
  );
}

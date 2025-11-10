// src/pages/PaperForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { addPaper, editPaper, loadPaper, clearCurrent } from '../../store/papersSlice';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AppBar, Toolbar, Paper as MUIPaper, Box, Typography, Grid,
  TextField, Button, CircularProgress, Divider, Stack, Chip
} from '@mui/material';
import AttachmentIcon from '@mui/icons-material/Attachment';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const SINGLE_LINE_ORDER = [
  'Paper ID','DOI','Author(s)','Year','Title','Name of Journal/Conference',
  'ISSN / ISBN','Name of Publisher / Organization','Place of Conference','Area / Sub Area',
  'Volume','Issue','Page No','Category of Paper'
];

const KEY_MAP = {
  'Paper ID': ['Paper ID','paper_id','paperId','id'],
  DOI: ['DOI','doi'],
  'Author(s)': ['Author(s)','authors','author'],
  Year: ['Year','year'],
  Title: ['Title','title'],
  'Name of Journal/Conference': ['Name of Journal/Conference','journal','journal_name','conference','journal_or_conference'],
  'ISSN / ISBN': ['ISSN / ISBN','issn_isbn','issn','isbn'],
  'Name of Publisher / Organization': ['Name of Publisher / Organization','publisher','organization','organization_name'],
  'Place of Conference': ['Place of Conference','place_of_conference','conference_place','location'],
  'Area / Sub Area': ['Area / Sub Area','area','sub_area','area_subarea'],
  Volume: ['Volume','volume'],
  Issue: ['Issue','issue'],
  'Page No': ['Page No','pages','page','page_no'],
  'Category of Paper': ['Category of Paper','category','paper_category']
};

const pick = (obj, cands) => { for (const k of cands) if (obj?.[k] != null) return obj[k]; return ''; };
const mapToDefaults = (entity) => {
  const out = {}; SINGLE_LINE_ORDER.forEach(lbl => { out[lbl] = pick(entity, KEY_MAP[lbl] || [lbl]); }); return out;
};
const prettyBytes = (b=0)=>{const u=['B','KB','MB','GB'];let i=0,n=+b;while(n>=1024&&i<u.length-1){n/=1024;i++;}return `${n.toFixed(1)} ${u[i]}`;};

export default function PaperForm({ mode = 'create' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { paperId } = useParams();
  const { current, loading, uploading, progress } = useSelector((s) => s.papers || {});
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({ defaultValues: {} });

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

  React.useEffect(() => {
    if (mode === 'edit' && paperId) dispatch(loadPaper(paperId));
    return () => dispatch(clearCurrent());
  }, [dispatch, mode, paperId]);

  React.useEffect(() => {
    if (mode === 'edit' && current) {
      reset(mapToDefaults(current)); // ← prefill all fields from API response
    }
  }, [current, mode, reset]);

  const onSubmit = async (values) => {
    if (values.Year) values.Year = String(values.Year).trim();

    // If a PDF is selected, include it so service builds FormData
    const payload = file ? { ...values, file } : values;

    try {
      if (mode === 'create') {
        await dispatch(addPaper(payload)).unwrap();
      } else {
        await dispatch(editPaper({ id: Number(paperId), data: payload })).unwrap();
      }
      navigate('/papers');
    } catch (err) {
      setError('root', { type: 'server', message: err?.message || 'Save failed' });
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
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || loading || uploading}>
            {(isSubmitting || uploading) ? `Saving${typeof progress==='number' ? ` ${progress}%` : '…'}` : 'Submit'}
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
              {SINGLE_LINE_ORDER.map((f) => {
                const rules = f === 'Title' ? { required: 'Title is required' } : {};
                return (
                  <Grid item xs={12} md={6} key={f}>
                    <TextField
                      label={f}
                      fullWidth
                      error={!!errors[f]}
                      helperText={errors[f]?.message || ''}
                      {...register(f, rules)}
                    />
                  </Grid>
                );
              })}
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
              {(isSubmitting || uploading) ? `Saving${typeof progress==='number' ? ` ${progress}%` : '…'}` : 'Submit'}
            </Button>
          </Toolbar>
        </Box>
      </Box>
    </Box>
  );
}

// src/components/settings/SettingsDialog.jsx
import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Checkbox,
  FormControlLabel, Stack, Button, Alert, Typography, CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchSettings, 
  saveSettings, 
  resetSettings,
  fetchCitationStyles 
} from '../../store/settingsSlice';

const FALLBACK = {
  citationStyle: 'ieee',
  noteFormat: 'markdown+richtext',
  language: 'en-US',
  quickCopyAsHtml: false,
  includeUrls: false,
};

export default function SettingsDialog({ open, onClose }) {
  const dispatch = useDispatch();
  const { 
    data, 
    loading, 
    error,
    citationStyles,
    citationStylesLoading,
    citationStylesError
  } = useSelector((s) => s.settings);

  const [local, setLocal] = React.useState(FALLBACK);

  // Fetch settings and citation styles when opened
  React.useEffect(() => {
    if (open) {
      dispatch(fetchSettings());
      dispatch(fetchCitationStyles());
    }
  }, [open, dispatch]);

  // Sync form when store data changes
  React.useEffect(() => {
    if (open) setLocal({ ...FALLBACK, ...data });
  }, [data, open]);

  const setField = (k) => (e) =>
    setLocal((prev) => ({
      ...prev,
      [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const handleSave = async () => {
    const res = await dispatch(saveSettings(local));
    if (saveSettings.fulfilled.match(res)) onClose?.();
  };

  const handleReset = () => {
    dispatch(resetSettings());
    setLocal(FALLBACK);
  };

  // Convert citation styles object to array for rendering
  const citationStyleOptions = React.useMemo(() => {
    return Object.entries(citationStyles).map(([id, label]) => ({
      id,
      label
    }));
  }, [citationStyles]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Settings
        {(loading || citationStylesLoading) && <CircularProgress size={18} sx={{ ml: 1 }} />}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {error && <Alert severity="error">{String(error)}</Alert>}
          {citationStylesError && <Alert severity="warning">Failed to load citation styles</Alert>}

          <Typography variant="overline">Export / Cite</Typography>

          <FormControl fullWidth disabled={loading || citationStylesLoading}>
            <InputLabel>Citation Style</InputLabel>
            <Select
              label="Citation Style"
              value={local.citationStyle}
              onChange={setField('citationStyle')}
            >
              {citationStyleOptions.length > 0 ? (
                citationStyleOptions.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.label}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="ieee">IEEE (Loading...)</MenuItem>
              )}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={loading}>
            <InputLabel>Note Format</InputLabel>
            <Select
              label="Note Format"
              value={local.noteFormat}
              onChange={setField('noteFormat')}
            >
              <MenuItem value="markdown+richtext">Markdown + Rich Text</MenuItem>
              <MenuItem value="markdown">Markdown</MenuItem>
              <MenuItem value="html">Rich Text / HTML</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={loading}>
            <InputLabel>Language</InputLabel>
            <Select
              label="Language"
              value={local.language}
              onChange={setField('language')}
            >
              <MenuItem value="en-US">English (US)</MenuItem>
              <MenuItem value="en-GB">English (UK)</MenuItem>
              <MenuItem value="hi-IN">Hindi (IN)</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={!!local.quickCopyAsHtml}
                onChange={setField('quickCopyAsHtml')}
                disabled={loading}
              />
            }
            label="Quick copy as HTML"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={!!local.includeUrls}
                onChange={setField('includeUrls')}
                disabled={loading}
              />
            }
            label="Include URLs of paper articles in references"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset} disabled={loading}>Reset</Button>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
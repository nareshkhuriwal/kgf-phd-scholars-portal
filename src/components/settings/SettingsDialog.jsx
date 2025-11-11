// src/components/settings/SettingsDialog.jsx
import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Checkbox,
  FormControlLabel, Stack, Button, Alert, Typography, CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, saveSettings, resetSettings } from '../../store/settingsSlice';

const CITATION_STYLES = [
  { id: 'chicago-note-bibliography-short', label: 'Chicago (shortened notes & bibliography)' },
  { id: 'ieee', label: 'IEEE' },
  { id: 'apa-7', label: 'APA 7' },
  { id: 'mla-9', label: 'MLA 9 (in-text)' },
  { id: 'harvard-with-titles', label: 'Elsevier – Harvard (with titles)' },
];

const FALLBACK = {
  citationStyle: 'chicago-note-bibliography-short',
  noteFormat: 'markdown+richtext',
  language: 'en-US',
  quickCopyAsHtml: false,
  includeUrls: false,
};

export default function SettingsDialog({ open, onClose }) {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector((s) => s.settings);

  const [local, setLocal] = React.useState(FALLBACK);

  // Fetch fresh when opened
  React.useEffect(() => { if (open) dispatch(fetchSettings()); }, [open, dispatch]);

  // Sync form when store data changes while open
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Settings
        {loading && <CircularProgress size={18} sx={{ ml: 1 }} />}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          {error && <Alert severity="error">{String(error)}</Alert>}

          <Typography variant="overline">Export / Cite</Typography>

          <FormControl fullWidth disabled={loading}>
            <InputLabel>Citation Style</InputLabel>
            <Select
              label="Citation Style"
              value={local.citationStyle}
              onChange={setField('citationStyle')}
            >
              {CITATION_STYLES.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>
              ))}
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

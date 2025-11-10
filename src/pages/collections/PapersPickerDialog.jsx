// src/components/collections/PapersPickerDialog.jsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack,
  TextField, List, ListItemButton, ListItemText, Checkbox, CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { loadPapers } from '../../store/papersSlice';

// helpers: normalize IDs and values across API shapes
const idOf = (r) => r?.id ?? r?.['Paper ID'] ?? r?.paper_id;
const val = (row, keys) => {
  for (const k of keys) if (row && row[k] != null && row[k] !== '') return row[k];
  return '';
};

export default function PapersPickerDialog({ open, onClose, onConfirm, title }) {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.papers || { list: [], loading: false });

  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState([]);

  React.useEffect(() => {
    if (open) dispatch(loadPapers());
  }, [open, dispatch]);

  React.useEffect(() => { if (!open) { setQ(''); setSel([]); } }, [open]);

  // flatten list regardless of shape
  const items = Array.isArray(list) ? list : (list?.data || []);

  // normalized view model
  const rows = React.useMemo(() => (
    items.map(p => ({
      _raw: p,
      id: idOf(p),
      title: val(p, ['title','Title']),
      authors: val(p, ['authors','Author(s)']),
      year: val(p, ['year','Year']),
      doi: val(p, ['doi','DOI']),
    })).filter(r => r.id != null)
  ), [items]);

  // search over normalized fields
  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(r =>
      `${r.title} ${r.authors} ${r.year} ${r.doi}`.toLowerCase().includes(t)
    );
  }, [rows, q]);

  const toggle = (id) =>
    setSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title || 'Add papers to collection'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <TextField
            placeholder="Search library…"
            value={q}
            onChange={e => setQ(e.target.value)}
            size="small"
          />
          {loading ? (
            <CircularProgress size={24} sx={{ mx: 'auto', my: 2 }} />
          ) : (
            <List dense sx={{ maxHeight: 360, overflow: 'auto' }}>
              {filtered.map(r => (
                <ListItemButton key={r.id} onClick={() => toggle(r.id)}>
                  <Checkbox edge="start" checked={sel.includes(r.id)} tabIndex={-1} disableRipple />
                  <ListItemText
                    primary={r.title || '(Untitled)'}
                    secondary={[r.authors, r.year, r.doi].filter(Boolean).join(' • ')}
                    primaryTypographyProps={{ noWrap: true }}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
              ))}
              {!filtered.length && (
                <ListItemButton disabled>
                  <ListItemText primary="No papers found." />
                </ListItemButton>
              )}
            </List>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!sel.length}
          onClick={() => onConfirm(sel)}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

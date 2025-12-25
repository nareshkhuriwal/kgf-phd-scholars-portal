import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemText
} from '@mui/material';

import { apiFetch } from '../../services/api';

export default function CitationPickerDialog({ open, onClose, onSelect }) {
  const [q, setQ] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    apiFetch('/citations', {
      method: 'GET',
      params: { q }
    })
      .then(resp => {
        if (cancelled) return;
        setRows(resp?.data ?? resp ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Select Citation</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          label="Search by title / author / DOI"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ mb: 2 }}
        />

        <List dense>
          {rows.map((c) => (
            <ListItemButton
              key={c.id}
              onClick={() => {
                onSelect(c);
                onClose();
              }}
            >
              <ListItemText
                primary={c.title}
                secondary={`${c.authors ?? 'Unknown'} (${c.year ?? 'N/A'})`}
              />
            </ListItemButton>
          ))}

          {!loading && rows.length === 0 && (
            <ListItemText
              primary="No citations found"
              sx={{ px: 2, py: 1, color: 'text.secondary' }}
            />
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
}

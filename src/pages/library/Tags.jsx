import React, { useEffect, useState } from 'react';
import {
  Paper, Box, TextField, Button, Chip, Stack,
  Snackbar, Alert, CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import PageHeader from '../../components/PageHeader';
import {
  loadTags,
  addTag,
  deleteTag,
  clearTagStatus
} from '../../store/tagsSlice';

export default function Tags() {
  const dispatch = useDispatch();
  const { items, loading, success, error } = useSelector(s => s.tags);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(loadTags());
  }, [dispatch]);

  useEffect(() => {
    if (success || error) {
      setOpen(true);
    }
  }, [success, error]);

  const handleAdd = () => {
    const name = input.trim();
    if (!name) return;
    dispatch(addTag(name));
    setInput('');
  };

  const handleClose = () => {
    setOpen(false);
    dispatch(clearTagStatus());
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Library — Tags"
        subtitle="Organize your papers with custom tags"
      />

      <Paper sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <TextField
            size="small"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add a tag…"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Button variant="contained" onClick={handleAdd}>
            Add
          </Button>
        </Stack>

        {loading ? (
          <CircularProgress size={20} />
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {items.map(t => (
              <Chip
                key={t.id}
                label={t.name}
                onDelete={() => dispatch(deleteTag(t.id))}
              />

            ))}
          </Stack>
        )}
      </Paper>

      {/* Toast */}
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={error ? 'error' : 'success'}
          variant="filled"
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
}

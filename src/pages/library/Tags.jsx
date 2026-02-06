import React, { useEffect, useState } from 'react';
import {
  Paper, Box, TextField, Button, Chip, Stack,
  Snackbar, Alert, CircularProgress, Typography, Divider
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import PageHeader from '../../components/PageHeader';
import {
  loadTags,
  addTag,
  deleteTag,
  clearTagStatus
} from '../../store/tagsSlice';

function TagSection({ title, type, tags, onAdd, onDelete, loading }) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const name = input.trim();
    if (!name) return;
    onAdd(name, type);
    setInput('');
  };

  return (
    <Paper sx={{ p: 2, mb: 3, border: '1px solid #eee', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Add ${title.toLowerCase()}…`}
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
          {tags.map(t => (
            <Chip
              key={t.id}
              label={t.name}
              onDelete={() => onDelete(t.id)}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function Tags() {
  const dispatch = useDispatch();
  const { items, loading, success, error } = useSelector(s => s.tags);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(loadTags());
  }, [dispatch]);

  useEffect(() => {
    if (success || error) setOpen(true);
  }, [success, error]);

  const handleAdd = (name, type) => {
    dispatch(addTag({ name, type }));
  };

  const handleClose = () => {
    setOpen(false);
    dispatch(clearTagStatus());
  };

  const problemTags = items.filter(t => t.type === 'problem');
  const solutionTags = items.filter(t => t.type === 'solution');

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Library — Tags"
        subtitle="Manage problem and solution tags for research analysis"
      />

      <TagSection
        title="Problem Tags"
        type="problem"
        tags={problemTags}
        loading={loading}
        onAdd={handleAdd}
        onDelete={id => dispatch(deleteTag(id))}
      />

      <TagSection
        title="Solution Tags"
        type="solution"
        tags={solutionTags}
        loading={loading}
        onAdd={handleAdd}
        onDelete={id => dispatch(deleteTag(id))}
      />

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

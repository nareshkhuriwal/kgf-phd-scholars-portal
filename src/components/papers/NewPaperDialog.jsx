import React from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Button
} from '@mui/material';

export default function NewPaperDialog({ open, onClose, onCreate }) {
  const [title, setTitle] = React.useState('');

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate(title.trim());
    setTitle('');
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Research Paper</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Paper Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter paper title"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

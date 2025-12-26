import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadCollections, deleteCollection, createCollection } from '../../store/collectionsSlice';
import {
  Paper, Box, Grid, Button, Typography, Stack, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, CircularProgress
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';

import Tooltip from '@mui/material/Tooltip';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TuneIcon from '@mui/icons-material/Tune';          // for Manage



export default function CollectionsList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.collections);

  // modal state
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const [confirmDelete, setConfirmDelete] = React.useState({
    open: false,
    id: null,
    name: '',
  });


  React.useEffect(() => { dispatch(loadCollections()); }, [dispatch]);

  const resetForm = () => { setName(''); setDesc(''); };
  const onClose = () => { if (!saving) { setOpen(false); resetForm(); } };

  const onCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await dispatch(createCollection({ name: name.trim(), description: desc.trim() || null })).unwrap();
      resetForm();
      setOpen(false);
      // reload/refresh list
      dispatch(loadCollections());
    } finally { setSaving(false); }
  };

  const handleDeleteClick = (id, name) => {
    setConfirmDelete({ open: true, id, name });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.id) return;

    try {
      await dispatch(deleteCollection(confirmDelete.id)).unwrap();
      dispatch(loadCollections()); // refresh list
    } finally {
      setConfirmDelete({ open: false, id: null, name: '' });
    }
  };


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Collections"
        subtitle="Curate focused sets of papers to review and report"
        actions={<Button variant="contained" onClick={() => setOpen(true)}>New Collection</Button>}
      />

      <Grid container spacing={1.5}>
        {(list || []).map(c => (
          <Grid key={c.id} item xs={12} md={6} lg={4}>
            <Paper sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: .5, fontWeight: 600 }}>{c.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {(c.paper_count ?? c.count ?? 0)} papers • Updated {c.updated_at_readable ?? c.updated_at}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Open collection">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/collections/${c.id}`)}
                    >
                      <FolderOpenIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Manage collection">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/collections/${c.id}/manage`)}
                    >
                      <TuneIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Delete collection">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(c.id, c.name)}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>

                  </span>
                </Tooltip>
              </Stack>

            </Paper>
          </Grid>
        ))}
        {!loading && (!list || list.length === 0) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>No collections yet.</Paper>
          </Grid>
        )}
      </Grid>

      {/* Create Collection Modal */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>New Collection</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Collection name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              inputProps={{ maxLength: 120 }}
              helperText={`${name.length}/120`}
              fullWidth
            />
            <TextField
              label="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={onCreate} disabled={saving || !name.trim()}>
            {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            Create
          </Button>
        </DialogActions>
      </Dialog>


      <Dialog
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null, name: '' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Collection</DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Are you sure you want to delete the collection
            <strong> “{confirmDelete.name || 'this collection'}”</strong>?
            <br />
            This action will permanently remove the collection.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDelete({ open: false, id: null, name: '' })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>



    </Box>
  );
}

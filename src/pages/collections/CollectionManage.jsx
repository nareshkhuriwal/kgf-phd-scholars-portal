import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, TextField, Stack, Button, Typography, IconButton, Divider, Chip
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PageHeader from '../../components/PageHeader';
import PapersPickerDialog from './PapersPickerDialog';
import {
  loadCollection, updateCollection, addPapersToCollection, removePapersFromCollection, deleteCollection
} from '../../store/collectionsSlice';

export default function CollectionManage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, loading } = useSelector(s => s.collections || {});

  React.useEffect(()=>{ dispatch(loadCollection(id)); },[dispatch, id]);

  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [pickerOpen, setPickerOpen] = React.useState(false);

  React.useEffect(()=>{
    if (!current) return;
    setName(current.name || '');
    setDesc(current.description || '');
  }, [current]);

  const onSaveMeta = async () => {
    await dispatch(updateCollection({ id, data: { name: name.trim(), description: desc.trim() }})).unwrap();
    dispatch(loadCollection(id));
  };
  const onAdd = async (paper_ids) => {
    if (!paper_ids?.length) return;
    await dispatch(addPapersToCollection({ id, paper_ids })).unwrap();
    setPickerOpen(false);
    dispatch(loadCollection(id));
  };
  const onRemoveOne = async (pid) => {
    await dispatch(removePapersFromCollection({ id, paper_ids: [pid] })).unwrap();
    dispatch(loadCollection(id));
  };
  const onDeleteCollection = async () => {
    await dispatch(deleteCollection(id)).unwrap();
    navigate('/collections');
  };

  const papers = current?.papers || [];

  return (
    <Box sx={{ display:'flex', flexDirection:'column' }}>
      <PageHeader
        title={`Manage: ${current?.name || 'Collection'}`}
        subtitle="Rename, describe, and control membership"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={()=>setPickerOpen(true)}>Add Papers</Button>
            <Button color="error" variant="outlined" onClick={onDeleteCollection}>Delete Collection</Button>
            <Button variant="contained" onClick={onSaveMeta} disabled={!name.trim()}>Save</Button>
          </Stack>
        }
      />

      <Paper sx={{ p:2, border:'1px solid #eee', borderRadius:2, mb:2 }}>
        <Stack spacing={2} maxWidth={720}>
          <TextField label="Name" value={name} onChange={e=>setName(e.target.value)} required />
          <TextField label="Description" value={desc} onChange={e=>setDesc(e.target.value)} multiline minRows={3} />
        </Stack>
      </Paper>

      <Paper sx={{ p:2, border:'1px solid #eee', borderRadius:2 }}>
        <Typography variant="subtitle1" sx={{ mb:1 }}>Papers in this collection</Typography>
        <Divider sx={{ mb:1 }} />
        <Stack spacing={1.25}>
          {loading ? <Typography variant="body2">Loading…</Typography> :
            (!papers.length ? <Typography variant="body2" color="text.secondary">No papers yet.</Typography> :
              papers.map(p => (
                <Stack key={p.id} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Stack spacing={0.25}>
                    <Typography variant="body2" sx={{ fontWeight:600 }}>{p.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.authors || '—'} {p.year ? `• ${p.year}` : ''} {p.doi ? <>• <Chip label={p.doi} size="small" /></> : null}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={()=>window.open(`/library/papers/${p.id}/view`,'_self')}>Open</Button>
                    <IconButton size="small" color="error" onClick={()=>onRemoveOne(p.id)}>
                      <DeleteOutlineIcon fontSize="small"/>
                    </IconButton>
                  </Stack>
                </Stack>
              ))
            )
          }
        </Stack>
      </Paper>

      <PapersPickerDialog
        open={pickerOpen}
        onClose={()=>setPickerOpen(false)}
        onConfirm={onAdd}
        title="Add papers to this collection"
      />
    </Box>
  );
}

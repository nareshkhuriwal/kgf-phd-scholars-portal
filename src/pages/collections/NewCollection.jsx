// src/pages/collections/NewCollection.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { createCollection } from '../../store/collectionsSlice';
import { Paper, Box, TextField, Button, Stack } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import { useNavigate } from 'react-router-dom';

export default function NewCollection() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');

  const save = async () => {
    await dispatch(createCollection({ name, description: desc })).unwrap();
    navigate('/collections');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="New Collection" subtitle="Group papers for a particular thesis objective"
        actions={<Button variant="contained" disabled={!name.trim()} onClick={save}>Create</Button>}
      />
      <Paper sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
        <Stack spacing={2}>
          <TextField label="Collection name" value={name} onChange={e=>setName(e.target.value)} fullWidth />
          <TextField label="Description" value={desc} onChange={e=>setDesc(e.target.value)} fullWidth multiline minRows={3} />
        </Stack>
      </Paper>
    </Box>
  );
}

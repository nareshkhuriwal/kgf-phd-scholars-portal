import React from 'react';
import { Paper, Box, TextField, Button, Chip, Stack } from '@mui/material';
import PageHeader from '../../components/PageHeader';

export default function Tags() {
  const [tags, setTags] = React.useState(['QEC','VQE','NISQ']);
  const [input, setInput] = React.useState('');

  const add = () => {
    if (!input.trim()) return;
    if (!tags.includes(input.trim())) setTags([...tags, input.trim()]);
    setInput('');
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader title="Library — Tags" subtitle="Organize your papers with custom tags" />
      <Paper sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <TextField size="small" value={input} onChange={e=>setInput(e.target.value)} placeholder="Add a tag…" />
          <Button variant="contained" onClick={add}>Add</Button>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {tags.map(t => (
            <Chip key={t} label={t} onDelete={()=>setTags(tags.filter(x=>x!==t))} />
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

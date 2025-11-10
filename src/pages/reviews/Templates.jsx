import React from 'react';
import { Paper, Box, Button, TextField, Stack, Typography } from '@mui/material';
import PageHeader from '../../components/PageHeader';

export default function Templates() {
  const [title, setTitle] = React.useState('Default Literature Review Template');
  const [body, setBody] = React.useState(
`[Authors, Year] … summary
Strengths:
Weaknesses:
Gaps:
Methodology:
Results:
Limitations:`
  );
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Review Templates"
        subtitle="Create and reuse structured prompts for consistent reviews"
        actions={<Button variant="contained">Save Template</Button>}
      />
      <Paper sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
        <Stack spacing={2}>
          <TextField label="Template name" value={title} onChange={e=>setTitle(e.target.value)} fullWidth />
          <TextField label="Template body" value={body} onChange={e=>setBody(e.target.value)} multiline minRows={10} fullWidth />
          <Typography variant="body2" color="text.secondary">Use placeholders like [Authors], [Year], [DOI], etc.</Typography>
        </Stack>
      </Paper>
    </Box>
  );
}

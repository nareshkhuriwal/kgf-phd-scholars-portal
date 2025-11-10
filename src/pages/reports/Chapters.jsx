import React from 'react';
import { Paper, Box, Grid, TextField, Button, Stack } from '@mui/material';
import PageHeader from '../../components/PageHeader';

export default function Chapters() {
  const [intro, setIntro] = React.useState('');
  const [related, setRelated] = React.useState('');
  const [method, setMethod] = React.useState('');
  const [results, setResults] = React.useState('');
  const [conclusion, setConclusion] = React.useState('');

  const save = () => {};
  const exportDoc = () => {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Chapter Builder"
        subtitle="Compose thesis chapters using reviewed content"
        actions={<Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={save}>Save Draft</Button>
          <Button variant="contained" onClick={exportDoc}>Export .docx</Button>
        </Stack>}
      />
      <Paper sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12}><TextField label="Introduction" value={intro} onChange={e=>setIntro(e.target.value)} multiline minRows={4} fullWidth /></Grid>
          <Grid item xs={12}><TextField label="Related Work" value={related} onChange={e=>setRelated(e.target.value)} multiline minRows={6} fullWidth /></Grid>
          <Grid item xs={12}><TextField label="Methodology" value={method} onChange={e=>setMethod(e.target.value)} multiline minRows={6} fullWidth /></Grid>
          <Grid item xs={12}><TextField label="Results & Discussion" value={results} onChange={e=>setResults(e.target.value)} multiline minRows={6} fullWidth /></Grid>
          <Grid item xs={12}><TextField label="Conclusion & Future Work" value={conclusion} onChange={e=>setConclusion(e.target.value)} multiline minRows={4} fullWidth /></Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

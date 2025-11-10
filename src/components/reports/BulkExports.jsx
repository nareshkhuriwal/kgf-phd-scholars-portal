// ─────────────────────────────────────────────────────────────────────────────
// src/pages/reports/components/BulkExports.jsx
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bulkExport } from './../../store/reportsSlice';
import { Paper, Stack, Typography, TextField, MenuItem, Button, Alert } from '@mui/material';

const TYPES = [
  { value: 'all-users', label: 'Export All Users (metrics)' },
  { value: 'all-papers', label: 'Export All Papers (structured summaries)' },
  { value: 'by-collection', label: 'Export by Collection' }
];

const FORMATS = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV' },
  { value: 'pdf', label: 'PDF (tabular pack)' }
];

export default function BulkExports(){
  const dispatch = useDispatch();
  const { bulkLoading, lastDownloadUrl, error } = useSelector(s=>s.reports);

  const [type, setType] = React.useState('all-papers');
  const [format, setFormat] = React.useState('xlsx');
  const [filters, setFilters] = React.useState({ collectionId: '', areas: [], years: [] });

  const onRun = () => {
    dispatch(bulkExport({ type, format, filters }));
  };

  return (
    <Paper variant="outlined" sx={{ p:2 }}>
      <Typography variant="h6">Bulk Exports (Admin/Supervisor)</Typography>
      <Stack direction={{ xs:'column', md:'row' }} spacing={2} sx={{ mt:1 }}>
        <TextField select label="Export Type" value={type} onChange={e=>setType(e.target.value)} sx={{ minWidth: 260 }}>
          {TYPES.map(t=> <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
        </TextField>
        <TextField select label="Format" value={format} onChange={e=>setFormat(e.target.value)} sx={{ minWidth: 200 }}>
          {FORMATS.map(f=> <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
        </TextField>
        {type==='by-collection' && (
          <TextField label="Collection ID" value={filters.collectionId} onChange={e=>setFilters(f=>({...f, collectionId:e.target.value}))} />
        )}
        <TextField label="Areas" placeholder="QEM, VQE" onChange={e=>setFilters(f=>({...f, areas:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} />
        <TextField label="Years" placeholder="2023, 2024" onChange={e=>setFilters(f=>({...f, years:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}))} />
      </Stack>
      <Button sx={{ mt:2 }} variant="contained" onClick={onRun} disabled={bulkLoading}>Run Export</Button>
      {lastDownloadUrl && (
        <Alert sx={{ mt:2 }} severity="success" action={<Button size="small" href={lastDownloadUrl}>Download</Button>}>
          Export is ready.
        </Alert>
      )}
      {error && <Alert sx={{ mt:2 }} severity="error">{String(error)}</Alert>}
    </Paper>
  );
}
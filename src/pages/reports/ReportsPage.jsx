// src/pages/reports/SavedReports.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadSavedReports, deleteSavedReport, previewSavedReport, generateSavedReport
} from '../../store/reportsSlice';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, Stack, IconButton, Tooltip, Typography, Chip, Snackbar, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import PreviewIcon from '@mui/icons-material/Preview';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import ReportPreviewDialog from '../../components/reports/ReportPreviewDialog';

export default function SavedReports(){
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    saved, savedLoading, lastDownloadUrl, generating,
    savedPreview, previewLoading
  } = useSelector(s=>s.reports);


  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rpp, setRpp] = React.useState(10);
  const [snack, setSnack] = React.useState(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewData, setPreviewData] = React.useState(null);
  const [selectedReport, setSelectedReport] = React.useState(null);

  // NEW: delete confirm state
  const [confirm, setConfirm] = React.useState(null); // { id, name } | null

  React.useEffect(()=>{ dispatch(loadSavedReports()); },[dispatch]);

  const filtered = (saved||[]).filter(r =>
    [r.name, r.template, r.format, r.filename].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase())
  );
  const start = page*rpp;
  const rows = filtered.slice(start, start+rpp);

  const onDuplicate = (row) => {
    const payload = { ...row, id: undefined, name: `${row.name} (copy)` };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(()=>{});
    setSnack({severity:'info', msg:'Config copied to clipboard. Paste into builder to reuse.'});
  };

  // OPEN confirm dialog
  const askDelete = (row) => setConfirm({ id: row.id, name: row.name });

  // CONFIRM delete
  const confirmDelete = async () => {
    if (!confirm?.id) return;
    await dispatch(deleteSavedReport(confirm.id));
    setSnack({severity:'success', msg:`Deleted "${confirm.name}".`});
    setConfirm(null);
  };

  const onPreview = async (row) => {
    console.log('Previewing', row);
    try {
      const res = await dispatch(previewSavedReport({ id: row.id , payload: { ...row } })).unwrap();
      // if your API wraps data, normalize it here:
      setPreviewData(res?.data ?? res ?? null);
      setPreviewOpen(true);
      setSelectedReport(row);
    } catch (err) {
      // optional: toast/log
      console.error('Preview failed', err);
    }
  };



  return (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <PageHeader
        title="Reports"
        subtitle="Save report configs and reuse anytime."
        actions={<Button variant="contained" onClick={()=>navigate('/reports/builder')}>Build Report</Button>}
      />
      <Paper sx={{ p:1.5, border:'1px solid #eee', borderRadius:2, display:'flex', flexDirection:'column', minHeight:0 }}>
        <Box sx={{ mb:1.5 }}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search saved reports…" />
        </Box>
        <TableContainer sx={{ flex:1, maxHeight:'calc(100vh - 230px)', overflow:'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9' }}>Name</TableCell>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9' }}>Template</TableCell>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9' }}>Format</TableCell>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9' }}>Updated</TableCell>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9', width:220 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length===0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py:3 }}>
                    <Typography variant="body2" color="text.secondary">{savedLoading ? 'Loading…' : 'No saved reports yet.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : rows.map((r)=>(
                <TableRow hover key={r.id}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight:600 }}>{r.name}</Typography>
                      {!!r.tags?.length && r.tags.slice(0,3).map(t=>(<Chip key={t} size="small" label={t} />))}
                    </Stack>
                  </TableCell>
                  <TableCell>{r.template}</TableCell>
                  <TableCell>{r.format || '—'}</TableCell>
                  <TableCell>{r.updated_at ? new Date(r.updated_at).toLocaleString() : '—'}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Preview"><span>
                        <IconButton size="small" onClick={()=>onPreview(r)}><PreviewIcon fontSize="inherit" /></IconButton>
                      </span></Tooltip>
                      <Tooltip title="Download"><span>
                        <IconButton size="small" disabled={generating} onClick={()=>dispatch(generateSavedReport({ id:r.id }))}>
                          <DownloadIcon fontSize="inherit" />
                        </IconButton>
                      </span></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" onClick={()=>navigate(`/reports/builder/${r.id}`)}><EditIcon fontSize="inherit" /></IconButton></Tooltip>
                      <Tooltip title="Duplicate"><IconButton size="small" onClick={()=>onDuplicate(r)}><ContentCopyIcon fontSize="inherit" /></IconButton></Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={()=>askDelete(r)}>
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display:'flex', justifyContent:'flex-end' }}>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_e,p)=>setPage(p)}
            rowsPerPage={rpp}
            onRowsPerPageChange={(e)=>{ setRpp(parseInt(e.target.value,10)); setPage(0); }}
            rowsPerPageOptions={[10,25,50,100]}
            showFirstButton showLastButton
          />
        </Box>
      </Paper>

      {lastDownloadUrl && (
        <Alert sx={{ mt:2 }} severity="success" action={<Button size="small" href={lastDownloadUrl}>Download</Button>}>
          File ready.
        </Alert>
      )}
      <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack(null)}>
        {snack && <Alert severity="success">{snack.msg}</Alert>}
      </Snackbar>

      {/* Preview modal */}
      <ReportPreviewDialog
        open={previewOpen}
        loading={previewLoading}
        onClose={()=>setPreviewOpen(false)}
        data={{ ...previewData, selectedReport }}
      />

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!confirm} onClose={()=>setConfirm(null)}>
        <DialogTitle>Delete report?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete <strong>{confirm?.name ?? 'this report'}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setConfirm(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

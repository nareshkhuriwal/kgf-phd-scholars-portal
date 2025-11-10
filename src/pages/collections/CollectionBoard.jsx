import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Button, Stack, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, Checkbox, TableContainer, Chip, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { loadCollection, removePapersFromCollection } from '../../store/collectionsSlice';
import PapersPickerDialog from './PapersPickerDialog';
import { addPapersToCollection } from '../../store/collectionsSlice';

const getId = (p) => p?.id ?? p?.paper_id;

export default function CollectionOpen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current, loading } = useSelector(s => s.collections || {});
  const papers = current?.papers || [];

  React.useEffect(()=>{ dispatch(loadCollection(id)); },[dispatch, id]);

  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState([]);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const filtered = React.useMemo(()=>{
    const t = q.trim().toLowerCase();
    if (!t) return papers;
    return papers.filter(p => {
      const s = [p.title, p.authors, p.year, p.doi].filter(Boolean).join(' ').toLowerCase();
      return s.includes(t);
    });
  }, [papers, q]);

  const allChecked = sel.length>0 && sel.length===filtered.length;
  const onToggleAll = (e) => setSel(e.target.checked ? filtered.map(getId) : []);
  const onToggle = (pid) => setSel(prev => prev.includes(pid) ? prev.filter(x=>x!==pid) : [...prev, pid]);

  const bulkRemove = async () => {
    if (!sel.length) return;
    await dispatch(removePapersFromCollection({ id, paper_ids: sel })).unwrap();
    setSel([]);
  };

  const addPapers = async (paperIds) => {
    if (!paperIds?.length) return;
    await dispatch(addPapersToCollection({ id, paper_ids: paperIds })).unwrap();
    setPickerOpen(false);
  };

  return (
    <Box sx={{ display:'flex', flexDirection:'column' }}>
      <PageHeader
        title={current?.name || 'Collection'}
        subtitle={`${papers.length} papers • ${current?.description || ''}`}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={()=>setPickerOpen(true)}>Add Papers</Button>
            <Button variant="outlined" disabled={!sel.length} onClick={bulkRemove}>Remove Selected</Button>
            <Button variant="contained" onClick={()=>window.open(`/api/collections/${id}/export?format=csv`,'_blank')}>Export CSV</Button>
          </Stack>
        }
      />

      <Paper sx={{ p:1.5, border:'1px solid #eee', borderRadius:2, display:'flex', flexDirection:'column' }}>
        <Box sx={{ mb:1 }}>
          <SearchBar value={q} onChange={setQ} placeholder="Search in this collection…" />
        </Box>

        {loading ? (
          <Box sx={{ py:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <CircularProgress size={28}/>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight:'calc(100vh - 260px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox checked={allChecked} indeterminate={sel.length>0 && !allChecked} onChange={onToggleAll}/>
                  </TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Authors</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>DOI</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(p => {
                  const pid = getId(p);
                  return (
                    <TableRow hover key={pid}>
                      <TableCell padding="checkbox">
                        <Checkbox checked={sel.includes(pid)} onChange={()=>onToggle(pid)} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.title}</Typography>
                        {p.tags?.length ? <Stack direction="row" spacing={0.5} sx={{ mt: .25, flexWrap:'wrap' }}>
                          {p.tags.map(t => <Chip key={t} label={t} size="small" />)}
                        </Stack> : null}
                      </TableCell>
                      <TableCell>{p.authors || '—'}</TableCell>
                      <TableCell>{p.year || '—'}</TableCell>
                      <TableCell>{p.doi || '—'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Open paper"><IconButton size="small" onClick={()=>navigate(`/library/papers/${pid}/view`)}><OpenInNewIcon fontSize="small"/></IconButton></Tooltip>
                          <Tooltip title="Review"><IconButton size="small" onClick={()=>navigate(`/reviews/${pid}`)}><RateReviewIcon fontSize="small"/></IconButton></Tooltip>
                          <Tooltip title="Remove from collection"><IconButton size="small" color="error" onClick={()=>bulkRemove([pid])}><DeleteOutlineIcon fontSize="small"/></IconButton></Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filtered.length && (
                  <TableRow><TableCell colSpan={6}><Typography variant="body2" color="text.secondary">No papers match.</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <PapersPickerDialog
        open={pickerOpen}
        onClose={()=>setPickerOpen(false)}
        onConfirm={addPapers}
        title="Add papers to collection"
      />
    </Box>
  );
}

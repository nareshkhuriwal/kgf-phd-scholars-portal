// src/pages/reports/Literature.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadLiteratureReviews } from '../../store/reportsSlice';
import { Paper, Box, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Tooltip, IconButton, Typography } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const copyText = async (t) => { try { await navigator.clipboard.writeText(t || ''); } catch {} };

export default function Literature() {
  const dispatch = useDispatch();
  const { literature, loading } = useSelector(s => s.reports);
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRpp] = React.useState(10);

  React.useEffect(()=>{ dispatch(loadLiteratureReviews()); }, [dispatch]);

  const filtered = (literature||[]).filter(r =>
    [r.review, r.title, r.authors, r.year].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase())
  );
  const start = page * rowsPerPage;
  const rows = filtered.slice(start, start + rowsPerPage);

  const downloadDocx = async () => {
    const sections = [
      new Paragraph({ children: [new TextRun({ text: 'Review of Literature', bold: true, size: 28 })], spacing: { after: 300 } }),
      ...filtered.flatMap((r, i) => ([
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: r.review ?? '', size: 22 })] }),
        ...(i < filtered.length - 1 ? [new Paragraph({})] : [])
      ]))
    ];
    const doc = new Document({ sections: [{ children: sections }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'Review_of_Literature.docx'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <PageHeader title="Reports — Literature Reviews" subtitle="Pulls text from the 'Literature Review' field of each reviewed paper"
        actions={<Button variant="contained" onClick={downloadDocx} disabled={!filtered.length}>Download .docx</Button>}
      />
      <Paper sx={{ p:1.5, border:'1px solid #eee', borderRadius:2, display:'flex', flexDirection:'column', minHeight:0 }}>
        <Box sx={{ mb:1.5 }}><SearchBar value={query} onChange={setQuery} placeholder="Search within reviews…" /></Box>

        <TableContainer sx={{ flex:1, maxHeight:'calc(100vh - 230px)', overflow:'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9', width:80 }}>#</TableCell>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9' }}>Literature Review</TableCell>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9', width:100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py:3 }}>
                    <Typography variant="body2" color="text.secondary">{loading ? 'Loading…' : 'No reviews found.'}</Typography>
                  </TableCell>
                </TableRow>
              ) : rows.map((r, i) => (
                <TableRow hover key={String(r.id ?? i)}>
                  <TableCell>{start + i + 1}</TableCell>
                  <TableCell sx={{ display:'-webkit-box', WebkitBoxOrient:'vertical', WebkitLineClamp:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'pre-wrap' }}>
                    {r.review || '—'}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Copy"><IconButton size="small" onClick={()=>copyText(r.review)}><ContentCopyIcon fontSize="inherit" /></IconButton></Tooltip>
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
            onPageChange={(_e, p)=>setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e)=>{ setRpp(parseInt(e.target.value,10)); setPage(0); }}
            rowsPerPageOptions={[10,25,50,100]}
            showFirstButton showLastButton
          />
        </Box>
      </Paper>
    </Box>
  );
}

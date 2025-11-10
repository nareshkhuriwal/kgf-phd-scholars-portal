// src/pages/reports/ROL.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadROL } from '../../store/reportsSlice';
import { Paper, Box, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import PageHeader from '../../components/PageHeader';
import * as XLSX from 'xlsx';

export default function ROL() {
  const dispatch = useDispatch();
  const { rol, loading } = useSelector(s => s.reports);

  React.useEffect(()=>{ dispatch(loadROL()); }, [dispatch]);

  const download = () => {
    const ws = XLSX.utils.json_to_sheet(rol || []);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ROL');
    XLSX.writeFile(wb, 'ROL.xlsx');
  };

  return (
    <Box sx={{ display:'flex', flexDirection:'column' }}>
      <PageHeader title="ROL (Review of Literature)" subtitle="Export an Excel sheet of your reviewed papers"
        actions={<Button variant="contained" onClick={download} disabled={!rol?.length}>Download Excel</Button>}
      />
      <Paper sx={{ p:1.5, border:'1px solid #eee', borderRadius:2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9' }}>ID</TableCell>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9' }}>Title</TableCell>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9' }}>Authors</TableCell>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9' }}>Year</TableCell>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9' }}>DOI</TableCell>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9' }}>Category</TableCell>
                <TableCell sx={{ fontWeight:600, bgcolor:'#f7f7f9' }}>Key Issue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rol||[]).map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{r.title}</TableCell>
                  <TableCell>{r.authors}</TableCell>
                  <TableCell>{r.year}</TableCell>
                  <TableCell>{r.doi}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell>{r.keyIssue}</TableCell>
                </TableRow>
              ))}
              {!loading && (!rol || rol.length===0) && (
                <TableRow><TableCell colSpan={7}>No ROL rows.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadMyPapers, createPaper } from '../../store/authoredPapersSlice';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Button, Stack, Typography, CircularProgress
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import NewPaperDialog from '../../components/papers/NewPaperDialog';

import SearchBar from '../../components/SearchBar';


export default function MyPapers() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector(s => s.authoredPapers);
  const [openNew, setOpenNew] = React.useState(false);

  const [query, setQuery] = React.useState('');

  useEffect(() => {
    dispatch(loadMyPapers());
  }, [dispatch]);

  const filtered = React.useMemo(() => {
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.status || '').toLowerCase().includes(q)
    );
  }, [list, query]);

  const handleCreatePaper = async (title) => {
    const res = await dispatch(createPaper({ title })).unwrap();
    setOpenNew(false);
    dispatch(loadMyPapers());
    navigate(`/library/my-papers/${res.id}/edit`);
  };



  const handleNew = async () => {
    const res = await dispatch(createPaper()).unwrap();
    navigate(`/library/my-papers/${res.id}/edit`);
  };

  return (
    <Box>
      <PageHeader
        title="My Research Papers"
        subtitle="Write and manage your original research papers"
        actions={
          <Button variant="contained" onClick={() => setOpenNew(true)}>
            New Paper
          </Button>

        }
      />
      <Box sx={{ mb: 2 }}>
        <SearchBar
          value={query}
          onChange={(v) => setQuery(v)}
          placeholder="Search by title or status…"
        />
      </Box>


      <Paper sx={{ p: 2 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(p => (

                <TableRow key={p.id} hover>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>
                    <Link to={`/library/my-papers/${p.id}/edit`}>
                      {p.title || '(Untitled)'}
                    </Link>
                  </TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>{p.updated_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <NewPaperDialog
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreate={handleCreatePaper}
      />


    </Box>
  );
}

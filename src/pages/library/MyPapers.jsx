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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { deletePaper } from '../../store/authoredPapersSlice';

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

  const [confirm, setConfirm] = React.useState({ open: false, paper: null });

  const openDelete = (paper) => {
    setConfirm({ open: true, paper });
  };

  const closeDelete = () => {
    setConfirm({ open: false, paper: null });
  };

  const handleDelete = async () => {
    if (!confirm.paper) return;
    await dispatch(deletePaper(confirm.paper.id)).unwrap();
    closeDelete();
    dispatch(loadMyPapers());
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
                <TableCell align="right">Actions</TableCell>
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

                  <TableCell align="right">
                    <Tooltip title="Delete paper">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => openDelete(p)}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
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

      <Dialog open={confirm.open} onClose={closeDelete}>
        <DialogTitle>Delete Paper?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete{" "}
            <strong>{confirm.paper?.title || 'this paper'}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelete}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>


    </Box>
  );
}

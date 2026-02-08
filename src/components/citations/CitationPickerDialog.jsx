import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Chip,
  Divider,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ArticleIcon from '@mui/icons-material/Article';

import { loadCitations, clearCitations } from '../../store/papersSlice';

export default function CitationPickerDialog({ open, onClose, onSelect }) {
  const dispatch = useDispatch();
  const [q, setQ] = React.useState('');
  
  const { citations, citationsLoading, citationsError } = useSelector((state) => state.papers);

  // Load citations when dialog opens or search query changes
  useEffect(() => {
    if (!open) return;

    const timeoutId = setTimeout(() => {
      dispatch(loadCitations({ q }));
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [q, open, dispatch]);

  // Clear citations when dialog closes
  useEffect(() => {
    if (!open) {
      dispatch(clearCitations());
      setQ('');
    }
  }, [open, dispatch]);

  const handleSelect = (citation) => {
    onSelect(citation);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArticleIcon color="primary" />
          <Typography variant="h6" component="span">
            Select Citation
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by title, author, or DOI..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          autoFocus
        />

        {citationsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : citationsError ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" variant="body2">
              {citationsError}
            </Typography>
          </Box>
        ) : citations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" variant="body2">
              {q ? 'No citations found matching your search' : 'Start typing to search citations'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ 
            maxHeight: '400px', 
            overflow: 'auto',
            '& .MuiListItemButton-root': {
              borderRadius: 1,
              mb: 1,
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              }
            }
          }}>
            {citations.map((citation) => (
              <ListItemButton
                key={citation.id}
                onClick={() => handleSelect(citation)}
                sx={{ py: 1.5 }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip 
                        // label={`#${citation.id}`} 
                        label={`ID ${citation.id}`}
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ fontWeight: 600, minWidth: 50 }}
                      />
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          flex: 1
                        }}
                      >
                        {citation.title || 'Untitled'}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {citation.authors || 'Unknown author'}
                        {citation.year && ` • ${citation.year}`}
                      </Typography>
                      {citation.doi && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                          DOI: {citation.doi}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
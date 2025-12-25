// src/components/reviews/ReviewToolbar.jsx
import React from 'react';
import { Box, IconButton, Tooltip, Divider } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';

export default function ReviewToolbar({
  onSave,
  saving,
  sidebarOpen,
  onToggleSidebar,
  onInsertCitation
}) {
  // example keyboard shortcut: ⌘/Ctrl + S
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
        onSave?.();

      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSave]);

  return (
    <Box sx={{ px: 1, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, borderBottom: '1px solid #eee' }}>
      <Tooltip title="Save (⌘/Ctrl+S)">
        <span>
          {/* <IconButton size="small" onClick={onSave} disabled={saving}><SaveIcon fontSize="small" /></IconButton> */}
          <IconButton
            type="button"
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave();
            }}
            disabled={saving}
          >
            <SaveIcon fontSize="small" />
          </IconButton>

        </span>
      </Tooltip>
      <Divider orientation="vertical" flexItem />
      <Tooltip title="Undo (Editor)">
        <span><IconButton size="small" onClick={() => document.execCommand('undo')}><UndoIcon fontSize="small" /></IconButton></span>
      </Tooltip>
      <Tooltip title="Redo (Editor)">
        <span><IconButton size="small" onClick={() => document.execCommand('redo')}><RedoIcon fontSize="small" /></IconButton></span>
      </Tooltip>
      <Tooltip title="Copy selection (Editor)">
        <span><IconButton size="small" onClick={() => document.execCommand('copy')}><ContentCopyIcon fontSize="small" /></IconButton></span>
      </Tooltip>

      <Tooltip title="Insert Citation">
        <IconButton onClick={onInsertCitation}>
          <FormatQuoteIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
        <IconButton
          size="small"
          onClick={onToggleSidebar}
          aria-label="toggle sidebar"
        >
          {sidebarOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Tooltip>

    </Box>
  );
}

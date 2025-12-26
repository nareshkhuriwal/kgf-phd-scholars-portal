import React from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';

import { exportPaperDocx } from '../../utils/docx/authoredPaperDocx';

export default function PaperPreviewDialog({ open, onClose, paper }) {
  if (!paper) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      keepMounted
      PaperProps={{
        sx: {
          width: '100vw',
          height: '90vh',
          maxWidth: '1400px',
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ───────── Header Toolbar ───────── */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'background.paper',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={paper.title}
        >
          {paper.title || 'Preview'}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => exportPaperDocx(paper)}
          >
            Download DOCX
          </Button>
        </Stack>

        <IconButton onClick={onClose} title="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* ───────── Document Viewer ───────── */}
      <Box
        sx={{
          flex: 1,
          bgcolor: '#525659',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'auto',
          p: 3,
        }}
      >
        <Box
          sx={{
            width: '210mm',
            minHeight: '297mm',
            bgcolor: '#fff',
            mx: 'auto',
            mt: 1, // 🔥 spacing like ReportPreviewDialog
            mb: 6,
            p: '30mm',
            boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
            borderRadius: '2px',
          }}
          className="ck-content"
        >
          {/* Sections */}
          {paper.sections?.map((s) => (
            <Box key={s.id} sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 1.5 }}
              >
                {s.section_title}
              </Typography>

              <Box
                sx={{
                  '& p': { mb: 1.5 },
                  '& ul, & ol': { pl: 3, mb: 1.5 },
                  '& h1, & h2, & h3': { mt: 3, mb: 1 },
                }}
                dangerouslySetInnerHTML={{ __html: s.body_html }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Dialog>
  );
}

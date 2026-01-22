import React, { useState } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';

import { exportPaperDocx } from '../../utils/docx/authoredPaperDocx';

export default function PaperPreviewDialog({ open, onClose, paper }) {
  const [layout, setLayout] = useState('single');

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

        {/* Layout Toggle */}
        <ToggleButtonGroup
          size="small"
          exclusive
          value={layout}
          onChange={(_, v) => v && setLayout(v)}
        >
          <ToggleButton value="single" title="Single column">
            <ViewAgendaIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="double" title="Two columns">
            <ViewColumnIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>

        <Button
          size="small"
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => exportPaperDocx(paper, layout)}
        >
          Download DOCX
        </Button>


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
          overflow: 'auto',
          p: 3,
        }}
      >
        <Box
          sx={{
            width: '210mm',
            bgcolor: '#fff',
            mx: 'auto',
            mt: 1,
            mb: 6,
            p: '30mm',
            boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
            borderRadius: '2px',
          }}
          className="ck-content"
        >
          {/* Paper Title */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: 4,
              lineHeight: 1.3,
            }}
          >
            {paper.title}
          </Typography>

          {/* Content */}
          <Box
            sx={{
              columnCount: layout === 'double' ? 2 : 1,
              columnGap: layout === 'double' ? '20mm' : '0',
            }}
          >
            {paper.sections?.map((s) => (
              <Box
                key={s.id}
                sx={{
                  breakInside: 'avoid',
                  mb: 4,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 1.5,
                    textAlign: 'center',
                  }}
                >
                  {s.section_title}
                </Typography>

                <Box
                  sx={{
                    textAlign: 'justify',
                    textJustify: 'inter-word',

                    '& p': {
                      mb: 1.5,
                      textAlign: 'justify',
                    },

                    '& ul, & ol': {
                      pl: 3,
                      mb: 1.5,
                      textAlign: 'justify',
                    },

                    '& li': {
                      textAlign: 'justify',
                    },

                    '& h1, & h2, & h3': {
                      mt: 3,
                      mb: 1,
                      textAlign: 'center',
                    },
                  }}
                  dangerouslySetInnerHTML={{ __html: s.body_html }}
                />

              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

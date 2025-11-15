// src/components/reviews/ReviewSidebar.jsx
import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Divider,
  Stack,
  Link,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function fmtBytes(b) {
  if (b == null) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0, n = Number(b);
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
}

export default function ReviewSidebar({ paper, open = true, onToggle }) {
  const meta = paper?.paper || paper || {};
  // prefer nested (from ReviewResource->paper), fallback to top-level
  const title    = meta.title     ?? paper?.title     ?? '—';
  const authors  = meta.authors   ?? paper?.authors   ?? '—';
  const year     = meta.year      ?? paper?.year      ?? '—';
  const pdfUrl   = meta.pdf_url   ?? paper?.pdf_url   ?? null;
  const fileName = meta.file_name ?? paper?.file_name ?? (pdfUrl ? pdfUrl.split('/').pop() : '—');
  const fileSize = meta.file_size ?? paper?.file_size ?? null;
  const filePath = meta.file_path ?? paper?.file_path ?? pdfUrl ?? '—';

  return (
    <Paper
      sx={{
        height: '100%',
        p: 1.5,
        border: '1px solid #eee',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.5 }}
      >
        <Typography
          variant="subtitle2"
          sx={{ color: 'text.secondary' }}
        >
          Details
        </Typography>

        <Tooltip title={open ? 'Hide details' : 'Show details'}>
          <IconButton
            size="small"
            onClick={onToggle}
            sx={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Divider sx={{ mb: 1.25 }} />

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Stack spacing={1.25}>
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.25 }}
            >
              Title
            </Typography>
            <Typography
              variant="body2"
              sx={{ wordBreak: 'break-word' }}
            >
              {title}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.25 }}
            >
              Authors
            </Typography>
            <Typography
              variant="body2"
              sx={{ wordBreak: 'break-word' }}
            >
              {authors || '—'}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.25 }}
            >
              Year
            </Typography>
            <Typography variant="body2">
              {year || '—'}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.25 }}
            >
              File name
            </Typography>
            <Typography
              variant="body2"
              sx={{ wordBreak: 'break-all' }}
            >
              {fileName || '—'}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.25 }}
            >
              Size
            </Typography>
            <Typography variant="body2">
              {fmtBytes(fileSize)}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 0.25 }}
            >
              Path / URL
            </Typography>
            {pdfUrl ? (
              <Typography
                variant="caption"
                sx={{ wordBreak: 'break-all', lineHeight: 1.4 }}
              >
                <Link
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ wordBreak: 'break-all' }}
                >
                  {filePath}
                </Link>
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                {filePath}
              </Typography>
            )}
          </Box>
        </Stack>
      </Collapse>
    </Paper>
  );
}

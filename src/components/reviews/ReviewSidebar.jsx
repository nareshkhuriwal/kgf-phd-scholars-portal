// src/components/reviews/ReviewSidebar.jsx
import React from 'react';
import { Paper, Box, Typography, Divider, Stack, Link } from '@mui/material';

function fmtBytes(b) {
  if (b == null) return '—';
  const u = ['B','KB','MB','GB','TB'];
  let i = 0, n = Number(b);
  while (n >= 1024 && i < u.length-1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
}

export default function ReviewSidebar({ paper }) {
  const meta = paper?.paper || paper || {};
  // prefer nested (from ReviewResource->paper), fallback to top-level
  const title = meta.title ?? paper?.title ?? '—';
  const authors = meta.authors ?? paper?.authors ?? '—';
  const year = meta.year ?? paper?.year ?? '—';
  const pdfUrl = meta.pdf_url ?? paper?.pdf_url ?? null;
  const fileName = meta.file_name ?? paper?.file_name ?? (pdfUrl ? pdfUrl.split('/').pop() : '—');
  const fileSize = meta.file_size ?? paper?.file_size ?? null;
  const filePath = meta.file_path ?? paper?.file_path ?? pdfUrl ?? '—';

  return (
    <Paper sx={{ height: '100%', p: 1.25, border: '1px solid #eee', borderRadius: 2 }}>
      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: .75 }}>Details</Typography>
      <Divider sx={{ mb: 1 }} />

      <Stack spacing={1}>
        <Box>
          <Typography variant="caption" color="text.secondary">Title</Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{title}</Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">Authors</Typography>
          <Typography variant="body2">{authors}</Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">Year</Typography>
          <Typography variant="body2">{year}</Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="caption" color="text.secondary">File name</Typography>
          <Typography variant="body2">{fileName || '—'}</Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">Size</Typography>
          <Typography variant="body2">{fmtBytes(fileSize)}</Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">Path / URL</Typography>
          {pdfUrl ? (
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              <Link href={pdfUrl} target="_blank" rel="noopener noreferrer">{filePath}</Link>
            </Typography>
          ) : (
            <Typography variant="body2">{filePath}</Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

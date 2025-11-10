// src/pages/papers/PaperView.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Grid, Paper, Stack, Typography, Button, Divider, Chip, Link, Skeleton
} from '@mui/material';
import PageHeader from '../../components/PageHeader';
import { loadPaper, clearCurrent } from '../../store/papersSlice';

const prettyBytes = (b) => {
  if (b == null) return '—';
  const u = ['B','KB','MB','GB','TB']; let i=0; let n=Number(b);
  while (n>=1024 && i<u.length-1){n/=1024;i++;}
  return `${n.toFixed(1)} ${u[i]}`;
};

// Map multiple possible keys -> canonical fields
const READ_KEY_MAP = {
  id: ['id', 'Paper ID', 'paper_id', 'paperId'],
  title: ['title', 'Title'],
  authors: ['authors', 'Author(s)', 'author'],
  year: ['year', 'Year'],
  doi: ['doi', 'DOI'],
  journal: ['journal', 'Name of Journal/Conference'],
  file_name: ['file_name', 'original_name'],
  file_size: ['file_size', 'size_bytes'],
  file_path: ['file_path', 'path'],
  pdf_url: ['pdf_url'],
  tags: ['tags'],
  files: ['files'],
};

const pick = (obj, keys) => {
  for (const k of keys) if (obj && obj[k] != null) return obj[k];
  return undefined;
};
const normalize = (raw = {}) => {
  const out = {};
  Object.entries(READ_KEY_MAP).forEach(([canon, keys]) => (out[canon] = pick(raw, keys)));
  out._raw = raw;
  return out;
};

function Field({ label, value, link, wrap }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      {link ? (
        <Typography variant="body2" sx={{ wordBreak: wrap ? 'break-all' : 'normal' }}>
          <Link href={link} target="_blank" rel="noopener noreferrer">{value ?? '—'}</Link>
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ wordBreak: wrap ? 'break-all' : 'normal' }}>
          {value ?? '—'}
        </Typography>
      )}
    </Box>
  );
}

export default function PaperView() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { current, loading } = useSelector((s) => s.papers || {});
  const paper = normalize(current || {});
  const pdfUrl = paper.pdf_url || null;
  const files  = Array.isArray(paper.files) ? paper.files : [];

  React.useEffect(() => {
    // Only (re)load if not already this paper
    if (!current || String(current.id || current['Paper ID']) !== String(paperId)) {
      dispatch(loadPaper(paperId));
    }
    return () => { dispatch(clearCurrent()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, paperId]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title={paper.title || 'Paper'}
        subtitle={(paper.authors || paper.year)
          ? `${paper.authors || ''}${paper.authors && paper.year ? ' • ' : ''}${paper.year || ''}`
          : 'Details & files'}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/library/papers')}>Back</Button>
            <Button variant="contained" onClick={() => navigate(`/reviews/${paperId}`)}>Review</Button>
            <Button variant="outlined" onClick={() => navigate(`/library/papers/${paperId}`)}>Edit</Button>
          </Stack>
        }
      />

      <Grid container spacing={1.5} sx={{ p: 1.5, height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
        {/* Left: PDF viewer */}
        <Grid item xs={12} lg={7} sx={{ height: '100%' }}>
          <Paper sx={{ height: '100%', border: '1px solid #eee', borderRadius: 2, p: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>PDF Viewer</Typography>
            {!pdfUrl ? (
              <Typography variant="body2" color="text.secondary">
                No PDF attached.
              </Typography>
            ) : loading ? (
              <Skeleton variant="rounded" height="100%" />
            ) : (
              <embed
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                type="application/pdf"
                style={{ width: '100%', height: '100%', border: 0, borderRadius: 8 }}
              />
            )}
          </Paper>
        </Grid>

        {/* Right: metadata & attachments */}
        <Grid item xs={12} lg={5} sx={{ height: '100%' }}>
          <Paper sx={{ height: '100%', border: '1px solid #eee', borderRadius: 2, p: 1.25 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>Details</Typography>
            <Divider sx={{ mb: 1 }} />
            {loading ? (
              <Stack spacing={1}><Skeleton /><Skeleton /><Skeleton /></Stack>
            ) : (
              <Stack spacing={1.25}>
                <Field label="Title" value={paper.title} />
                <Field label="Authors" value={paper.authors} />
                <Field label="Year" value={paper.year} />
                <Field label="DOI" value={paper.doi} link={paper.doi ? `https://doi.org/${paper.doi}` : null} />
                <Field label="Journal/Conference" value={paper.journal} />
                <Divider />
                <Field label="File name" value={paper.file_name} />
                <Field label="Size" value={prettyBytes(paper.file_size)} />
                <Field label="Path / URL" value={paper.file_path || paper.pdf_url} link={paper.pdf_url || null} wrap />
                {!!paper.tags?.length && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Tags</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mt: .25, flexWrap: 'wrap' }}>
                      {paper.tags.map((t) => <Chip key={t} size="small" label={t} />)}
                    </Stack>
                  </Box>
                )}
                {!!files.length && (
                  <>
                    <Divider />
                    <Typography variant="subtitle2">Resources</Typography>
                    <Stack spacing={0.5}>
                      {files.map((f) => (
                        <Link key={f.id || f.url} href={f.url} target="_blank" rel="noopener noreferrer">
                          {f.name || f.original_name || 'Attachment'} {f.size ? `(${prettyBytes(f.size)})` : ''}
                        </Link>
                      ))}
                    </Stack>
                  </>
                )}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

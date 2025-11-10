import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper, Box, Button, Stack, Typography, Alert, Divider, Tabs, Tab,
  TextField, IconButton, Chip, LinearProgress, Tooltip
} from '@mui/material';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LinkIcon from '@mui/icons-material/Link';
import DescriptionIcon from '@mui/icons-material/Description';
import TableViewIcon from '@mui/icons-material/TableView';

import PageHeader from '../../components/PageHeader';
import FileDropzone from '../../components/FileDropzone';
import { importFiles, clearImportState } from '../../store/importSlice';
import { loadPapers } from '../../store/papersSlice';

const prettyBytes = (b=0) => {
  if (typeof b !== 'number') return '—';
  const u = ['B','KB','MB','GB','TB']; let i=0; while (b>=1024 && i<u.length-1){b/=1024;i++;}
  return `${b.toFixed(1)} ${u[i]}`;
};
const ext = (name='') => name.split('.').pop()?.toLowerCase() || '';

export default function Upload() {
  const dispatch = useDispatch();
  const [tab, setTab] = React.useState(0);

  // buckets
  const [files, setFiles] = React.useState([]);           // PDFs, RIS, BibTeX, CSV, ZIP…
  const [urls, setUrls] = React.useState('');             // newline-separated
  const [bibtex, setBibtex] = React.useState('');         // pasted .bib or RIS
  const [csvFile, setCsvFile] = React.useState(null);     // single CSV mapping file

  const { uploading, result, error, progress } = useSelector(s => s.importer || {});

  const hasAny =
    files.length > 0 ||
    urls.trim().length > 0 ||
    bibtex.trim().length > 0 ||
    !!csvFile;

  const onDrop = (newFiles) => {
    // de-dupe by name + size
    const key = f => `${f.name}::${f.size}`;
    const merged = [...files, ...newFiles].reduce((m, f) => {
      m.set(key(f), f); return m;
    }, new Map());
    setFiles([...merged.values()]);
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_,i)=>i!==idx));
  const clearAll = () => { setFiles([]); setUrls(''); setBibtex(''); setCsvFile(null); };

  const buildPayload = () => {
    // Keep backward compatibility with your thunk: if only files, send array.
    if (files.length && !urls.trim() && !bibtex.trim() && !csvFile) return files;

    // Otherwise send a structured payload (update backend as needed).
    return {
      files,                               // File[]
      sources: {
        urls: urls.split('\n').map(s => s.trim()).filter(Boolean), // string[]
        bibtex,                            // string (can also accept RIS)
        csv: csvFile || null               // File (schema mapping)
      },
      options: {
        // future toggles:
        // dedupeBy: 'doi|title|hash',
        // createPlaceholdersForMissingPDF: true,
      }
    };
  };

  const onProcess = async () => {
    if (!hasAny || uploading) return;
    try {
      await dispatch(importFiles(buildPayload())).unwrap();
      // refresh the library list
      dispatch(loadPapers());
      clearAll();
    } catch (_) {}
  };

  React.useEffect(() => () => dispatch(clearImportState()), [dispatch]);

  // simple type tag
  const tagFor = (name='') => {
    const e = ext(name);
    if (['pdf'].includes(e)) return <Chip size="small" label="PDF" />;
    if (['ris'].includes(e)) return <Chip size="small" label="RIS" />;
    if (['bib','bibtex'].includes(e)) return <Chip size="small" label="BibTeX" />;
    if (['csv'].includes(e)) return <Chip size="small" label="CSV" />;
    if (['zip'].includes(e)) return <Chip size="small" label="ZIP" />;
    return <Chip size="small" label={e || 'file'} />;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Library — Upload / Import"
        subtitle="Add new papers from files, URLs, BibTeX/RIS, or CSV"
        actions={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Clear selected inputs">
              <span>
                <Button startIcon={<ClearAllIcon />} onClick={clearAll} disabled={!hasAny || uploading}>
                  Clear
                </Button>
              </span>
            </Tooltip>
            <Button variant="contained" disabled={!hasAny || uploading} onClick={onProcess}>
              {uploading ? 'Processing…' : 'Process'}
            </Button>
          </Stack>
        }
      />

      <Paper sx={{ p: 2, border: '1px solid #eee', borderRadius: 2 }}>
        <Stack spacing={2}>
          {/* Tabs for multiple intake methods */}
          <Tabs
            value={tab}
            onChange={(_,v)=>setTab(v)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ borderBottom: '1px solid #eee' }}
          >
            <Tab label="Files / Folders" icon={<UploadFileIcon />} iconPosition="start" />
            <Tab label="URLs" icon={<LinkIcon />} iconPosition="start" />
            <Tab label="BibTeX / RIS" icon={<DescriptionIcon />} iconPosition="start" />
            <Tab label="CSV" icon={<TableViewIcon />} iconPosition="start" />
          </Tabs>

          {/* Files / Folders */}
          {tab === 0 && (
            <Stack spacing={1.25}>
              <FileDropzone onFiles={onDrop} multiple directory /> {/* supports multi & folder */}
              {files.length > 0 && (
                <Box sx={{ mt: .5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: .5 }}>
                    Selected: {files.length} file(s)
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 220, overflow: 'auto',
                      border: '1px dashed #e0e0e0', borderRadius: 1, p: 1
                    }}
                  >
                    {files.map((f, i) => (
                      <Stack key={`${f.name}-${f.size}-${i}`} direction="row" alignItems="center"
                             spacing={1} sx={{ py: 0.5 }}>
                        {tagFor(f.name)}
                        <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all' }}>
                          {f.webkitRelativePath || f.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {prettyBytes(f.size)}
                        </Typography>
                        <IconButton size="small" onClick={() => removeFile(i)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          )}

          {/* URLs */}
          {tab === 1 && (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Paste one URL per line (PDFs, arXiv, DOI resolver links, etc.).
              </Typography>
              <TextField
                value={urls}
                onChange={e=>setUrls(e.target.value)}
                placeholder={'https://arxiv.org/abs/xxxx.xxxxx\nhttps://doi.org/10.xxxx/yyy\nhttps://.../paper.pdf'}
                fullWidth multiline minRows={6}
              />
            </Stack>
          )}

          {/* BibTeX / RIS */}
          {tab === 2 && (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Paste BibTeX entries or RIS content. We’ll try to fetch PDFs when possible.
              </Typography>
              <TextField
                value={bibtex}
                onChange={e=>setBibtex(e.target.value)}
                placeholder={'@article{key,\n  title={...},\n  author={...},\n  year={...},\n}\n\nTY  - JOUR\nTI  - ...\nAU  - ...\nER  - '}
                fullWidth multiline minRows={8}
              />
            </Stack>
          )}

          {/* CSV */}
          {tab === 3 && (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Upload a CSV with columns like: <code>title, authors, year, doi, url</code>. (Optional: <code>pdf_url</code>)
              </Typography>
              <Button component="label" variant="outlined">
                Select CSV
                <input hidden type="file" accept=".csv,text/csv" onChange={(e)=>setCsvFile(e.target.files?.[0] || null)} />
              </Button>
              {csvFile && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label="CSV" />
                  <Typography variant="body2">{csvFile.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{prettyBytes(csvFile.size)}</Typography>
                  <IconButton size="small" onClick={()=>setCsvFile(null)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                </Stack>
              )}
            </Stack>
          )}

          {!!uploading && typeof progress === 'number' && (
            <Box sx={{ mt: .5 }}>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}

          {error && <Alert severity="error">{String(error)}</Alert>}

          {result && (
            <Box sx={{ mt: 1 }}>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Import Summary</Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2"><strong>Created:</strong> {result.created?.length ?? 0}</Typography>
                {!!(result.skipped?.length) && (
                  <Typography variant="body2"><strong>Skipped:</strong> {result.skipped.length}</Typography>
                )}
                {!!(result.errors?.length) && (
                  <Typography variant="body2"><strong>Errors:</strong> {result.errors.length}</Typography>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

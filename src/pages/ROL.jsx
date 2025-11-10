// src/components/reports/ReportPreviewDialog.jsx
import React from 'react';
import {
  Dialog, Box, Typography, IconButton, Button, Chip,
  LinearProgress, Alert, Divider, TextField, InputAdornment,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import * as XLSX from 'xlsx';

/**
 * The dialog supports two preview modes:
 *  1) File mode: { format, url, html, mime }  -> embeds PDF/Office/Image/HTML
 *  2) Dataset mode: { name, columns:[{key,label}], rows:[{...}] } -> renders table + Excel export
 */
export default function ReportPreviewDialog({ open, loading, onClose, data }) {

  console.log("ReportPreviewDialog data:", data);
  
  const {
    name = 'Preview',
    format,
    url,
    downloadUrl,
    mime,
    html,
    columns,
    rows,
    template,
  } = data?.data || {};

  const fmt = String(format || '').toLowerCase();
  const hasDataset = Array.isArray(columns) && Array.isArray(rows) && columns.length > 0;

  console.log("Dataset", { data, hasDataset });

  // File-mode helpers
  const officeViewer = (fileUrl) =>
    `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

  const canOfficeEmbed = ['docx', 'pptx', 'xlsx'].includes(fmt);
  const isPdf = fmt === 'pdf';
  const isHtml = fmt === 'html';
  const isText = ['txt', 'md'].includes(fmt);
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fmt);
  const effectiveDownload = downloadUrl || url || null;

  // Dataset-mode: search + pagination
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rpp, setRpp] = React.useState(10);

  React.useEffect(() => {
    if (open) {
      setQ('');
      setPage(0);
    }
  }, [open]);

  const filteredRows = React.useMemo(() => {
    if (!hasDataset || !q.trim()) return rows || [];
    const query = q.toLowerCase();
    return (rows || []).filter((r) =>
      columns.some((c) => String(r?.[c.key] ?? '').toLowerCase().includes(query))
    );
  }, [rows, columns, q, hasDataset]);

  const start = page * rpp;
  const pageRows = hasDataset ? filteredRows.slice(start, start + rpp) : [];

  // Dataset-mode: Excel export (columns order respected)
  const handleDownloadExcel = () => {
    if (!hasDataset) return;
    const headerLabels = columns.map((c) => c.label || c.key);
    const aoa = [headerLabels];
    for (const r of filteredRows) {
      aoa.push(columns.map((c) => r?.[c.key] ?? ''));
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (template || 'Report').toUpperCase());
    XLSX.writeFile(wb, `${name || 'report'}.xlsx`);
  };

  // Small cell with ellipsis
  const Cell = ({ value, clamp = 1 }) => (
    <Tooltip title={value && String(value).length > 120 ? String(value) : ''} arrow>
      <Box sx={{
        display: '-webkit-box',
        WebkitLineClamp: clamp,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: clamp === 1 ? 'nowrap' : 'normal',
      }}>
        {value ?? '—'}
      </Box>
    </Tooltip>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      keepMounted
      PaperProps={{
        sx: {
          width: '80vw',
          height: '80vh',
          maxWidth: '1200px',
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2, py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={name}
        >
          {name}
          {template && (
            <Typography component="span" sx={{ ml: 1, color: 'text.secondary', fontSize: 14 }}>
              • {String(template).toUpperCase()}
            </Typography>
          )}
        </Typography>

        {!!format && !hasDataset && <Chip size="small" label={format.toUpperCase()} sx={{ fontWeight: 600 }} />}

        {/* Dataset mode: Excel download */}
        {hasDataset && (
          <Button
            size="small"
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadExcel}
            disabled={loading || (filteredRows?.length ?? 0) === 0}
          >
            Download Excel
          </Button>
        )}

        {/* File mode actions */}
        {!hasDataset && url && (
          <IconButton title="Open in new tab" onClick={() => window.open(url, '_blank')}>
            <OpenInNewIcon />
          </IconButton>
        )}
        {!hasDataset && effectiveDownload && (
          <Button
            size="small"
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => window.open(effectiveDownload, '_blank')}
          >
            Download
          </Button>
        )}

        <IconButton onClick={onClose} title="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      {loading && <LinearProgress />}

      {/* BODY */}
      <Box sx={{ flex: 1, minHeight: 0, bgcolor: '#f7f7f9', display: 'flex', flexDirection: 'column' }}>
        {/* DATASET MODE */}
        {(!loading && hasDataset) && (
          <>
            {/* Toolbar */}
            <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', flex: 1 }}>
                {filteredRows.length.toLocaleString()} row(s)
              </Typography>
              <TextField
                size="small"
                placeholder="Search…"
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0); }}
                sx={{ width: 360, maxWidth: '45%' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ px: 1.5, pb: 1.5, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <TableContainer
                sx={{
                  flex: 1,
                  minHeight: 200,
                  maxHeight: 'calc(80vh - 150px)',
                  overflow: 'auto',
                  border: '1px solid #eee',
                  borderRadius: 1.5,
                  backgroundColor: 'background.paper',
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {columns.map((c) => (
                        <TableCell key={c.key} sx={{ fontWeight: 600, bgcolor: '#f7f7f9' }}>
                          {c.label || c.key}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pageRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                          No data
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageRows.map((r, idx) => (
                        <TableRow hover key={idx}>
                          {columns.map((c) => (
                            <TableCell key={c.key}>
                              <Cell value={r?.[c.key]} clamp={2} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <TablePagination
                  component="div"
                  count={filteredRows.length}
                  page={page}
                  onPageChange={(_e, p) => setPage(p)}
                  rowsPerPage={rpp}
                  onRowsPerPageChange={(e) => { setRpp(parseInt(e.target.value, 10)); setPage(0); }}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  showFirstButton
                  showLastButton
                />
              </Box>
            </Box>
          </>
        )}

        {/* FILE MODE */}
        {(!loading && !hasDataset) && (
          <>
            {isHtml && html && (
              <Box
                sx={{
                  p: 2,
                  height: '100%',
                  overflow: 'auto',
                  bgcolor: '#fff',
                  '& img': { maxWidth: '100%' },
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}

            {isPdf && url && (
              <Box sx={{ height: '100%' }}>
                <embed
                  src={`${url}#toolbar=1&navpanes=0`}
                  type={mime || 'application/pdf'}
                  style={{ width: '100%', height: '100%', border: 0 }}
                />
              </Box>
            )}

            {canOfficeEmbed && url && (
              <iframe
                title="office-preview"
                src={officeViewer(url)}
                style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
              />
            )}

            {isImage && url && (
              <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 2 }}>
                <img src={url} alt={name} style={{ maxWidth: '100%', maxHeight: '100%' }} />
              </Box>
            )}

            {isText && url && (
              <iframe
                title="text-preview"
                src={url}
                style={{ width: '100%', height: '100%', border: 0, background: '#fff' }}
              />
            )}

            {!loading && !url && !html && (
              <Box sx={{ p: 3 }}>
                <Alert severity="info">No previewable content returned. Try downloading the file.</Alert>
              </Box>
            )}
          </>
        )}
      </Box>
    </Dialog>
  );
}

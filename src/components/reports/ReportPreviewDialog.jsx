// src/components/reports/ReportPreviewDialog.jsx
import React from 'react';
import {
  Dialog, Box, Typography, IconButton, Button, Chip,
  LinearProgress, Alert, Divider,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Stack, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import * as XLSX from 'xlsx';
import { downloadSynopsisDocx } from '../../utils/docx/synopsisDocx';
import { cleanRich } from '../../utils/text/cleanRich';
import { exportSynopsisDocx } from '../../utils/docx/exportSynopsisDocx';
import { exportReportPptx } from '../../utils/pptx/exportReportPptx';


export default function ReportPreviewDialog({ open, loading, onClose, data }) {
  // Merge nested selectedReport if present
  const merged = React.useMemo(() => ({ ...(data || {}), ...(data?.selectedReport || {}) }), [data]);

  const {
    name = 'Preview',
    format,
    url,
    downloadUrl,
    mime,
    html,
    columns = [],
    rows = [],
    meta,
    template,
    // SYNOPSIS fields (from API)
    kpis = [],
    chapters = [],
    literature = [],
  } = merged;

  const fmt = String(format || '').toLowerCase();
  const tpl = String(template || '').toLowerCase();

  const officeViewer = (fileUrl) =>
    `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

  const canOfficeEmbed = ['docx', 'pptx', 'xlsx'].includes(fmt);
  const isPdf = fmt === 'pdf';
  const isHtml = fmt === 'html';
  const isText = ['txt', 'md'].includes(fmt);
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fmt);
  const isSynopsis = tpl === 'synopsis';
  const hasSynopsisContent = (chapters?.length || 0) > 0 || (literature?.length || 0) > 0;

  const effectiveDownload = downloadUrl || url || null;

  // Dataset pagination
  const hasDataset = Array.isArray(columns) && columns.length > 0 && Array.isArray(rows);
  const [page, setPage] = React.useState(0);
  const [rpp, setRpp] = React.useState(10);
  const paged = React.useMemo(
    () => (hasDataset ? rows.slice(page * rpp, page * rpp + rpp) : []),
    [rows, page, rpp, hasDataset]
  );

  // Printable area ref (for Save as PDF)
  const printRef = React.useRef(null);
  const onPrintPdf = () => {
    // Simple print of the visible preview; users can select "Save as PDF"
    // (No external libs to keep it lean.)
    const w = window.open('', '_blank');
    if (!w) return;
    const title = (name || 'Report') + ' — Preview';
    const html = printRef.current ? printRef.current.innerHTML : '<p>No content</p>';
    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8"/>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 24px; }
            h1,h2,h3 { margin: 0 0 8px; }
            .kpi { display:inline-block; margin:4px 8px 4px 0; padding:4px 8px; border:1px solid #ddd; border-radius:8px; }
            .card { border:1px solid #eee; border-radius:8px; padding:12px; margin:8px 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; }
            th { background: #f7f7f9; }
            pre { white-space: pre-wrap; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  // Client-side Excel download (for dataset)
  const onDownloadExcel = () => {
    const ordered = rows.map(r => {
      const obj = {};
      columns.forEach(c => { obj[c.label || c.key] = r[c.key]; });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(ordered);
    const wb = XLSX.utils.book_new();
    const sheetName = (template || 'Report').toUpperCase().slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const safeName = String(name || 'Report').replace(/[^A-Za-z0-9._-]+/g, '_');
    XLSX.writeFile(wb, `${safeName || 'Report'}.xlsx`);
  };

  // Client-side DOCX download (for Synopsis)
  const onDownloadSynopsis = () => {
    const safe = String(name || 'Synopsis').replace(/[^A-Za-z0-9._-]+/g, '_') || 'Synopsis';
    // Either of your exporters is fine; keeping the explicit one you added:
    exportSynopsisDocx(merged, `${safe}.docx`);
    // or: downloadSynopsisDocx({ name, kpis, chapters, literature }, `${safe}.docx`);
  };

  // ---- Decide which download buttons to show based on format ----
  const renderDownloadButtons = () => {
    const btns = [];

    // If the API already returned a file link, always show direct Download.
    if (effectiveDownload) {
      btns.push(
        <Button key="dl-file" size="small" variant="contained" startIcon={<DownloadIcon />}
          onClick={() => window.open(effectiveDownload, '_blank')}>
          Download
        </Button>
      );
    }

    // Format-specific fallbacks when no server file is given:
    if (fmt === 'xlsx') {
      if (!effectiveDownload && hasDataset && rows.length > 0) {
        btns.push(
          <Button key="dl-xlsx" size="small" variant="contained" startIcon={<DownloadIcon />} onClick={onDownloadExcel}>
            Download Excel
          </Button>
        );
      }
    } else if (fmt === 'docx') {
      if (!effectiveDownload && isSynopsis && hasSynopsisContent) {
        btns.push(
          <Button key="dl-docx" size="small" variant="contained" startIcon={<DownloadIcon />} onClick={onDownloadSynopsis}>
            Download DOCX
          </Button>
        );
      }
    } else if (fmt === 'pdf') {
      if (!effectiveDownload) {
        btns.push(
          <Button key="dl-pdf" size="small" variant="contained" startIcon={<PictureAsPdfIcon />} onClick={onPrintPdf}>
            Save as PDF
          </Button>
        );
      }
    } else if (fmt === 'pptx') {
      if (!effectiveDownload) {
        btns.push(
          <Tooltip key="dl-pptx" title="PPTX export will be added soon">
            <span>
              <Button
                size="small"
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => exportReportPptx({
                  name, meta, columns, rows,
                  synopsis: { kpis, chapters, literature }
                })}
              >
                Download PPTX
              </Button>

            </span>
          </Tooltip>
        );
      }
    }

    return btns;
  };

  const validChapters = Array.isArray(chapters)
    ? chapters.filter(ch => ch.body_html && ch.body_html.trim() !== '')
    : [];


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
          maxWidth: '1200px',
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper' }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={name}
        >
          {name}
          {template && (
            <Typography component="span" sx={{ ml: 1, color: 'text.secondary', fontWeight: 400 }}>
              · {String(template).toUpperCase()}
            </Typography>
          )}
          {meta?.totalPapers != null && (
            <Typography component="span" sx={{ ml: 1, color: 'text.secondary', fontWeight: 400 }}>
              · {meta.totalPapers} rows
            </Typography>
          )}
        </Typography>

        {!!format && <Chip size="small" label={format.toUpperCase()} sx={{ fontWeight: 600 }} />}

        {url && (
          <IconButton title="Open in new tab" onClick={() => window.open(url, '_blank')}>
            <OpenInNewIcon />
          </IconButton>
        )}

        {/* Dynamically chosen buttons */}
        <Stack direction="row" spacing={1}>
          {renderDownloadButtons()}
        </Stack>

        <IconButton onClick={onClose} title="Close"><CloseIcon /></IconButton>
      </Box>

      {loading && <LinearProgress />}
      <Divider />

      {/* Viewer Area */}
      <Box ref={printRef} sx={{ flex: 1, bgcolor: '#f7f7f9', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {loading ? null : (
          <>
            {/* SYNOPSIS PREVIEW */}
            {isSynopsis && (
              <Box sx={{ p: 2, overflow: 'auto' }}>
                {/* KPIs */}
                {Array.isArray(kpis) && kpis.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
                    {kpis.map((k, i) => (<Chip key={i} label={`${k.label}: ${k.value}`} className="kpi" />))}
                  </Stack>
                )}

                {/* Chapters */}
                {validChapters.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    {validChapters.map((ch) => (
                      <Box
                        key={ch.id}
                        className="card"
                        sx={{
                          mb: 1.5,
                          p: 1.5,
                          bgcolor: '#fff',
                          borderRadius: 1,
                          border: '1px solid #eee',
                        }}
                      >
                        <Box
                          className="ck-content"
                          sx={{
                            backgroundColor: '#fff',
                            padding: 2,
                          }}
                          dangerouslySetInnerHTML={{ __html: ch.body_html }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}


                {/* Literature Review */}
                {Array.isArray(literature) && literature.length > 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>Literature Review</Typography>
                    {literature.map((item) => (
                      <Box key={item.paper_id} className="card" sx={{ mb: 2, p: 1.5, bgcolor: '#fff', borderRadius: 1, border: '1px solid #eee' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: .5 }}>
                          {[item.title, item.authors, item.year].filter(Boolean).join(' • ')}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {item.text || '—'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {(!chapters?.length && !literature?.length) && (
                  <Alert severity="info">No content found for Synopsis. Adjust filters/chapters and try again.</Alert>
                )}
              </Box>
            )}

            {/* DATASET (e.g., ROL JSON) */}
            {!isSynopsis && !url && !html && hasDataset && (
              <>
                <TableContainer sx={{ flex: 1, overflow: 'auto', bgcolor: '#fff' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {columns.map(col => (
                          <TableCell key={col.key} sx={{ fontWeight: 600, backgroundColor: '#f7f7f9' }}>
                            {col.label || col.key}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paged.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={columns.length} align="center" sx={{ py: 3 }}>
                            No data
                          </TableCell>
                        </TableRow>
                      ) : paged.map((row, idx) => (
                        <TableRow hover key={String((page * rpp) + idx)}>
                          {columns.map(col => (
                            <TableCell key={col.key}>
                              {row[col.key] == null || row[col.key] === '' ? '—' : String(row[col.key])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <TablePagination
                    component="div"
                    count={rows.length}
                    page={page}
                    onPageChange={(_e, p) => setPage(p)}
                    rowsPerPage={rpp}
                    onRowsPerPageChange={(e) => { setRpp(parseInt(e.target.value, 10)); setPage(0); }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    showFirstButton showLastButton
                  />
                </Box>
              </>
            )}

            {/* FILE / HTML PREVIEW */}
            {!isSynopsis && !hasDataset && (
              <>
                {isHtml && html && (
                  <Box
                    sx={{ p: 2, height: '100%', overflow: 'auto', bgcolor: '#fff', '& img': { maxWidth: '100%' } }}
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
                    <Alert severity="info">No previewable content returned.</Alert>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </Box>
    </Dialog>
  );
}

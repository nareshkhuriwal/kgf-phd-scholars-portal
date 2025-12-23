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
import { cleanRich } from '../../utils/text/cleanRich';
import { exportSynopsisDocx } from '../../utils/docx/exportSynopsisDocx';
import { exportReportPptx } from '../../utils/pptx/exportReportPptx';
import { htmlToExcelText } from '../../utils/exporters/htmlToExcelText';
import { DOCUMENT_TYPOGRAPHY } from '../../config/reportFormatting.config';

export default function ReportPreviewDialog({ open, loading, onClose, data, error }) {
  // If there's an error, show it
  if (error && open) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
            Preview Error
          </Typography>
          <IconButton onClick={onClose} title="Close"><CloseIcon /></IconButton>
        </Box>
        <Divider />
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Failed to load preview
            </Typography>
            <Typography variant="body2">
              {typeof error === 'string' ? error : error?.message || 'An unknown error occurred'}
            </Typography>
            {error?.response?.data?.message && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                Server message: {error.response.data.message}
              </Typography>
            )}
          </Alert>
        </Box>
      </Dialog>
    );
  }

  // Merge nested selectedReport if present
  const merged = React.useMemo(() => ({ ...(data || {}), ...(data?.selectedReport || {}) }), [data]);
  
  if (!merged || typeof merged !== 'object') {
    return null;
  }

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
    // Header/Footer settings
    headerFooter = {},
  } = merged;

  const fmt = String(format || '').toLowerCase();
  const tpl = String(template || '').toLowerCase();

  // Extract header/footer with defaults
  const safeHeaderFooter = headerFooter || {};

  const {
    headerTitle = name || 'Report',
    headerRight = 'SET',
    footerLeft = 'Poornima University, Jaipur',
    footerCenter = new Date().toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
  } = safeHeaderFooter;



  const officeViewer = (fileUrl) =>
    `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

  const canOfficeEmbed = ['docx', 'pptx', 'xlsx'].includes(fmt);
  const isPdf = fmt === 'pdf';
  const isHtml = fmt === 'html';
  const isText = ['txt', 'md'].includes(fmt);
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fmt);
  const isSynopsis = tpl === 'synopsis' || tpl === 'presentation';
  const hasSynopsisContent = (chapters?.length || 0) > 0 || (literature?.length || 0) > 0;
  const showDocumentLayout = isSynopsis || fmt === 'docx' || fmt === 'pdf';

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
            @page {
              size: A4;
              margin: 1in;
            }
            body { 
              font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; 
              margin: 0; 
              padding: 0; 
            }
            .page { 
              width: 210mm;
              min-height: 297mm;
              display: flex; 
              flex-direction: column; 
              page-break-after: always; 
              background: white;
            }
            .page-header { 
              border-bottom: 3px solid #999; 
              padding: 16px 24px; 
              display: flex; 
              align-items: center; 
              justify-content: space-between; 
            }
            .page-footer { 
              border-top: 3px solid #D6B27C; 
              padding: 12px 24px; 
              margin-top: auto; 
            }
            .page-content { flex: 1; padding: 24px; }
            h1,h2,h3 { margin: 0 0 8px; }
            .kpi { display:inline-block; margin:4px 8px 4px 0; padding:4px 8px; border:1px solid #ddd; border-radius:8px; }
            .card { border:1px solid #eee; border-radius:8px; padding:12px; margin:8px 0; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; }
            th { background: #f7f7f9; }
            pre { white-space: pre-wrap; }
            @media print {
              .page { page-break-after: always; margin: 0; }
              body { margin: 0; }
            }
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
    const metaKeys = new Set([
      'paper_id',
      'doi',
      'authors',
      'title',
      'year',
      'category',
    ]);

    const ordered = rows.map(r => {
      const obj = {};

      columns.forEach(c => {
        let val = r[c.key];

        if (val == null || val === '') {
          obj[c.label || c.key] = '';
          return;
        }

        if (!metaKeys.has(c.key)) {
          val = htmlToExcelText(val);
        }

        obj[c.label || c.key] = val;
      });

      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(ordered);
    const wb = XLSX.utils.book_new();
    const sheetName = (template || 'Report').toUpperCase().slice(0, 31);

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const safeName = String(name || 'Report')
      .replace(/[^A-Za-z0-9._-]+/g, '_');

    XLSX.writeFile(wb, `${safeName}.xlsx`);
  };

  // Client-side DOCX download (for Synopsis)
  const onDownloadSynopsis = () => {
    const safe = String(name || 'Synopsis').replace(/[^A-Za-z0-9._-]+/g, '_') || 'Synopsis';
    exportSynopsisDocx({ ...merged, headerFooter }, `${safe}.docx`);  // Pass headerFooter
  };


  // ---- Decide which download buttons to show based on format ----
  const renderDownloadButtons = () => {
    const btns = [];

    if (effectiveDownload) {
      btns.push(
        <Button key="dl-file" size="small" variant="contained" startIcon={<DownloadIcon />}
          onClick={() => window.open(effectiveDownload, '_blank')}>
          Download
        </Button>
      );
    }

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

  // Document-style header component
  // 2. Update DocumentHeader component to use headerTitle (around line 270):
  const DocumentHeader = ({ pageNum }) => (
    <Box
      className="page-header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 2,
        px: 3,
        borderBottom: '3px solid #999',
        bgcolor: '#fff',
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          color: '#808080',
          flex: 1,
          textAlign: 'center',
        }}
      >
        {headerTitle}  {/* Changed from: {name || 'Report'} */}
      </Typography>
      <Box
        sx={{
          ml: 2,
          px: 2,
          py: 1,
          borderLeft: '3px solid #999',
          minWidth: '80px',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: '#808080',
          }}
        >
          {headerRight}
        </Typography>
      </Box>
    </Box>
  );


  // 3. Update DocumentFooter component to use footerLeft and footerCenter (around line 305):
  const DocumentFooter = ({ pageNum }) => {
    return (
      <Box
        className="page-footer"
        sx={{
          borderTop: '3px solid #D6B27C',
          py: 1.5,
          px: 3,
          bgcolor: '#fff',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: '#999', fontSize: '11px' }}>
            {footerLeft}  {/* Changed from: Poornima University, Jaipur */}
          </Typography>
          <Typography variant="body2" sx={{ color: '#999', fontSize: '11px' }}>
            {footerCenter}  {/* Changed from: {currentDate} */}
          </Typography>
          <Typography variant="body2" sx={{ color: '#999', fontSize: '11px' }}>
            Page {pageNum}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Page wrapper component with A4 dimensions
  const DocumentPage = ({ children, pageNum }) => (
    <Box
      className="page"
      sx={{
        // A4 dimensions: 210mm x 297mm
        width: '210mm',
        minHeight: '297mm',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        mb: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        mx: 'auto', // Center the page
      }}
    >
      {isSynopsis && <DocumentHeader pageNum={pageNum} />}
      <Box
        className="page-content"
        sx={{
          flex: 1,
          p: 3,
          overflow: 'hidden',
          ...DOCUMENT_TYPOGRAPHY,
        }}
      >

        {children}
      </Box>
      {isSynopsis && <DocumentFooter pageNum={pageNum} />}

    </Box>
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
          width: '100vw',
          height: '90vh',
          maxWidth: '1400px', // Increased to accommodate A4 width
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      {/* Dialog Header (toolbar) */}
      <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'background.paper' }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          title={name}
        >
          {name}
          {template && (
            <Typography component="span" sx={{ ml: 1, color: 'text.secondary', fontWeight: 400 }}>
              · {tpl === 'presentation' ? 'PPT PREVIEW' : String(template).toUpperCase()}
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

        <Stack direction="row" spacing={1}>
          {renderDownloadButtons()}
        </Stack>

        <IconButton onClick={onClose} title="Close"><CloseIcon /></IconButton>
      </Box>

      {loading && <LinearProgress />}
      <Divider />

      {/* Document Preview with A4 Pages */}
      <Box
        sx={{
          flex: 1,
          bgcolor: '#525659', // Darker gray like PDF viewers
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'auto',
          p: 3,
        }}
      >
        {loading ? null : (
          <Box ref={printRef}>
            {/* SYNOPSIS PREVIEW */}
            {isSynopsis && (
              <>
                {/* First Page - KPIs and first chapter or declaration */}
                <DocumentPage pageNum="i">
                  {/* KPIs */}
                  {Array.isArray(kpis) && kpis.length > 0 && (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 3 }}>
                      {kpis.map((k, i) => (
                        <Chip
                          key={i}
                          label={`${k.label}: ${k.value}`}
                          className="kpi"
                          sx={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                          }}
                        />
                      ))}
                    </Stack>
                  )}

                  {/* First chapter if exists */}
                  {validChapters.length > 0 && (
                    <Box
                      className="card"
                      sx={{
                        p: 2,
                        bgcolor: '#fff',
                        borderRadius: 1,
                        border: '1px solid #eee',
                      }}
                    >
                      <Box
                        className="ck-content"
                        sx={DOCUMENT_TYPOGRAPHY}
                        dangerouslySetInnerHTML={{ __html: validChapters[0].body_html }}
                      />
                    </Box>
                  )}
                </DocumentPage>

                {/* Subsequent chapters - each on its own page */}
                {validChapters.slice(1).map((ch, idx) => (
                  <DocumentPage key={ch.id} pageNum={idx + 2}>
                    <Box
                      className="card"
                      sx={{
                        p: 2,
                        bgcolor: '#fff',
                        borderRadius: 1,
                        border: '1px solid #eee',
                      }}
                    >
                      <Box
                        className="ck-content"
                        sx={DOCUMENT_TYPOGRAPHY}
                        dangerouslySetInnerHTML={{ __html: ch.body_html }}
                      />
                    </Box>
                  </DocumentPage>
                ))}

                {/* Literature Review - each item on separate page */}
                {/* Literature Review - continuous section (single page flow) */}
                {Array.isArray(literature) && literature.length > 0 && (
                  <DocumentPage pageNum={validChapters.length + 1}>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ mb: 2, fontWeight: 600 }}
                      >
                        Literature Review
                      </Typography>

                      <Stack spacing={2}>
                        {literature.map((item, idx) => (
                          <Box
                            key={item.paper_id || idx}
                            className="card"
                            sx={{
                              p: 2,
                              bgcolor: '#fff',
                              borderRadius: 1,
                              border: '1px solid #eee',
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600, mb: 1 }}
                            >
                              {[item.title, item.authors, item.year]
                                .filter(Boolean)
                                .join(' • ')}
                            </Typography>

                            <Box
                              className="ck-content"
                              sx={DOCUMENT_TYPOGRAPHY}
                              dangerouslySetInnerHTML={{ __html: item.text || '<p>—</p>' }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </DocumentPage>
                )}


                {(!chapters?.length && !literature?.length) && (
                  <DocumentPage pageNum="i">
                    <Alert severity="info">No content found for Synopsis. Adjust filters/chapters and try again.</Alert>
                  </DocumentPage>
                )}
              </>
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
                              {row[col.key] == null || row[col.key] === '' ? (
                                '—'
                              ) : (
                                <Box
                                  className="ck-content"
                                  sx={DOCUMENT_TYPOGRAPHY}
                                  dangerouslySetInnerHTML={{ __html: row[col.key] }}
                                />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', bgcolor: '#fff', p: 1 }}>
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
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
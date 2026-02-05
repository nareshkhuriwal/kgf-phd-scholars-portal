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
import { normalizeHtmlWhitespace } from '../../utils/text/cleanRich';
import { exportSynopsisDocx } from '../../utils/docx/exportSynopsisDocx';
import { exportReportPptx } from '../../utils/pptx/exportReportPptx';
import { htmlToExcelText } from '../../utils/exporters/htmlToExcelText';
import { DOCUMENT_TYPOGRAPHY } from '../../config/reportFormatting.config';
import { exportDatasetToExcel } from '../../utils/excel/exportDatasetToExcel';
import {
  DEFAULT_PPT_THEME,
  THESIS_TITLE
} from "../../config/pptThemes.config";



function extractTitlePage(html) {
  const container = document.createElement('div');
  container.innerHTML = html;

  const getText = (selector) =>
    container.querySelector(selector)?.innerText?.trim() || '';

  const strongs = Array.from(container.querySelectorAll('strong'))
    .map(el => el.innerText.trim())
    .filter(Boolean);

  const img = container.querySelector('img')?.getAttribute('src') || '';

  return {
    title: getText('h2'),
    scholar: container.innerText.match(/by\s+(.*)\s+\(/)?.[1] || '',
    regNo: container.innerText.match(/\(([^)]+)\)/)?.[1] || '',
    supervisorBlock: {
      name: strongs.find(t => t.startsWith('Dr.')) || '',
      department: strongs.find(t => t.includes('Department of Engineering')) || '',
      school: strongs.find(t => t.includes('School of')) || '',
      university: strongs.find(t => t.includes('University')) || '',
    },
    date: strongs.find(t => /\d{4}$/.test(t)) || '',
    logo: img,
  };
}



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
  const isPresentation = data.template === 'presentation';

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
    presentation_theme,
    // SYNOPSIS fields (from API)
    kpis = [],
    chapters = [],
    literature = [],
    citations = [],
    sections = {},
    // Header/Footer settings
    headerFooter = {},
  } = merged;

  const fmt = String(format || '').toLowerCase();
  const tpl = String(template || '').toLowerCase();
  const include = merged?.selections?.include || {};
  const PPT_SLIDE = {
    width: '960px',     // 16:9 slide
    height: '540px',
  };

  // Extract header/footer with defaults - FIXED: Ensure proper fallbacks
  const safeHeaderFooter = headerFooter && typeof headerFooter === 'object' ? headerFooter : {};

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
  // const showDocumentLayout = isSynopsis || fmt === 'docx' || fmt === 'pdf';
  const showDocumentLayout =
    (isSynopsis && template !== 'presentation') ||
    fmt === 'docx' ||
    fmt === 'pdf';

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

    // FIXED: Proper escaping of header/footer values in print template
    const escapeHtml = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    w.document.write(`
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
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
            .page-header-title {
              flex: 1;
              text-align: center;
              font-weight: 700;
              color: #808080;
              font-size: 14px;
            }
            .page-header-right {
              margin-left: 16px;
              padding-left: 16px;
              border-left: 3px solid #999;
              min-width: 80px;
              text-align: center;
              font-weight: 700;
              color: #808080;
              font-size: 14px;
            }
            .page-footer { 
              border-top: 3px solid #D6B27C; 
              padding: 12px 24px; 
              margin-top: auto; 
            }
            .page-footer-content {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .page-footer-content > * {
              color: #999;
              font-size: 11px;
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
    exportDatasetToExcel({
      name,
      template,
      columns,
      rows,
    });
  };

  // const onDownloadExcel = () => {
  //   const metaKeys = new Set([
  //     'paper_id',
  //     'doi',
  //     'authors',
  //     'title',
  //     'year',
  //     'category',
  //   ]);

  //   const ordered = rows.map(r => {
  //     const obj = {};

  //     columns.forEach(c => {
  //       let val = r[c.key];

  //       if (val == null || val === '') {
  //         obj[c.label || c.key] = '';
  //         return;
  //       }

  //       if (!metaKeys.has(c.key)) {
  //         val = htmlToExcelText(val);
  //       }

  //       obj[c.label || c.key] = val;
  //     });

  //     return obj;
  //   });

  //   const ws = XLSX.utils.json_to_sheet(ordered);

  //   /* ============================================================
  //      FIX 1: COLUMN WIDTH AUTO-FIT
  //      ============================================================ */
  //   const colWidths = columns.map(col => {
  //     const header = col.label || col.key;
  //     let maxLen = header.length;

  //     rows.forEach(r => {
  //       const val = r[col.key];
  //       if (typeof val === 'string') {
  //         val.split('\n').forEach(line => {
  //           maxLen = Math.max(maxLen, line.length);
  //         });
  //       }
  //     });

  //     return { wch: Math.min(Math.max(maxLen + 2, 15), 60) };
  //   });

  //   ws['!cols'] = colWidths;

  //   /* ============================================================
  //      FIX 2: ROW HEIGHT – EXPLICIT + IMPLICIT BULLETS (CRITICAL)
  //      ============================================================ */
  //   const range = XLSX.utils.decode_range(ws['!ref']);
  //   ws['!rows'] = [];

  //   for (let R = range.s.r; R <= range.e.r; ++R) {
  //     let maxLines = 1;

  //     for (let C = range.s.c; C <= range.e.c; ++C) {
  //       const addr = XLSX.utils.encode_cell({ r: R, c: C });
  //       const cell = ws[addr];

  //       if (!cell || typeof cell.v !== 'string') continue;

  //       // Explicit line breaks
  //       const explicitLines = cell.v.split('\n').length;

  //       // Implicit numbered bullets (1. 2. 3.)
  //       const bulletMatches = cell.v.match(/\b\d+\.\s+/g);
  //       const bulletLines = bulletMatches ? bulletMatches.length : 1;

  //       maxLines = Math.max(maxLines, explicitLines, bulletLines);
  //     }

  //     // 18pt per line guarantees visibility
  //     ws['!rows'][R] = { hpt: Math.max(24, maxLines * 18) };
  //   }


  //   /* ============================================================
  //      FIX 3: FONT + ALIGNMENT (FINAL)
  //      ============================================================ */
  //   for (let R = range.s.r; R <= range.e.r; ++R) {
  //     for (let C = range.s.c; C <= range.e.c; ++C) {
  //       const addr = XLSX.utils.encode_cell({ r: R, c: C });
  //       const cell = ws[addr];
  //       if (!cell) continue;

  //       const isHeader = R === range.s.r;

  //       cell.s = {
  //         font: {
  //           name: 'Calibri',
  //           sz: 11,
  //           bold: isHeader,
  //         },
  //         alignment: {
  //           horizontal: 'center',
  //           vertical: isHeader ? 'center' : 'top', // 🔑 CRITICAL FIX
  //           wrapText: true,
  //         },
  //       };
  //     }
  //   }


  //   const wb = XLSX.utils.book_new();
  //   const sheetName = (template || 'Report').toUpperCase().slice(0, 31);

  //   XLSX.utils.book_append_sheet(wb, ws, sheetName);

  //   const safeName = String(name || 'Report')
  //     .replace(/[^A-Za-z0-9._-]+/g, '_');

  //   XLSX.writeFile(wb, `${safeName}.xlsx`);
  // };


  // Client-side DOCX download (for Synopsis)
  const onDownloadSynopsis = () => {
    const safe = String(name || 'Synopsis').replace(/[^A-Za-z0-9._-]+/g, '_') || 'Synopsis';
    exportSynopsisDocx({ ...merged, headerFooter: safeHeaderFooter }, `${safe}.docx`);
  };

  const resolvedPptTheme =
    presentation_theme ||
    (tpl === 'presentation' ? DEFAULT_PPT_THEME : DEFAULT_PPT_THEME);

  console.log('Resolved PPT theme:', resolvedPptTheme);

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
                  name: THESIS_TITLE,
                  fileName: name,
                  synopsis: { chapters },
                  themeKey: resolvedPptTheme,
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


  function sanitizeTitlePageHtml(html) {
    if (!html) return '';

    return html
      // Remove margin-left, margin-right, margin
      .replace(/margin-left\s*:\s*[^;"]+;?/gi, '')
      .replace(/margin-right\s*:\s*[^;"]+;?/gi, '')
      .replace(/margin\s*:\s*[^;"]+;?/gi, '')
      // Normalize empty paragraphs
      .replace(/<p[^>]*>(&nbsp;|\s)*<\/p>/gi, '<p class="spacer"></p>');
  }


  const validChapters = Array.isArray(chapters)
    ? chapters.filter(ch => ch.body_html && ch.body_html.trim() !== '')
    : [];

  // FIXED: Document-style header component with proper text handling
  const DocumentHeader = ({ pageNum }) => (
    <Box
      className="page-header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 1.5,
        px: 3,
        borderBottom: '3px solid #999',
        bgcolor: '#fff',
      }}
    >
      <Typography
        className="page-header-title"
        variant="subtitle1"
        component="div"
        sx={{
          fontWeight: 700,
          color: '#808080',
          flex: 1,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {String(headerTitle || name || 'Report')}
      </Typography>
      <Box
        className="page-header-right"
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
          component="div"
          sx={{
            fontWeight: 700,
            color: '#808080',
            whiteSpace: 'nowrap',
          }}
        >
          {String(headerRight || 'SET')}
        </Typography>
      </Box>
    </Box>
  );

  // FIXED: Document-style footer component with proper text handling
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
          className="page-footer-content"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            component="div"
            sx={{
              color: '#999',
              fontSize: '11px',
              flex: '1 1 0',
              minWidth: 0,
            }}
          >
            {String(footerLeft || 'Poornima University, Jaipur')}
          </Typography>
          <Typography
            variant="body2"
            component="div"
            sx={{
              color: '#999',
              fontSize: '11px',
              flex: '1 1 0',
              textAlign: 'center',
              minWidth: 0,
            }}
          >
            {String(footerCenter || new Date().toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            }))}
          </Typography>
          <Typography
            variant="body2"
            component="div"
            sx={{
              color: '#999',
              fontSize: '11px',
              flex: '1 1 0',
              textAlign: 'right',
              minWidth: 0,
            }}
          >
            Page {pageNum}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Page wrapper component with A4 dimensions
  const DocumentPage = ({ children, pageNum, hideHeader = false, hideFooter = false }) => {
    const isPpt = template === 'presentation';

    return (
      <Box
        className="page"
        sx={{
          width: isPpt ? PPT_SLIDE.width : '210mm',
          minHeight: isPpt ? PPT_SLIDE.height : '297mm',

          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#fff',
          mb: 3,
          mx: 'auto',

          // PPT should look like slide, not paper
          boxShadow: isPpt ? '0 6px 24px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: isPpt ? 2 : 0,
        }}
      >
        {!isPpt && isSynopsis && !hideHeader && <DocumentHeader pageNum={pageNum} />}

        <Box
          className="page-content"
          sx={{
            flex: 1,
            p: isPpt ? 3 : 3,
            overflow: 'hidden',
            ...DOCUMENT_TYPOGRAPHY,
          }}
        >
          {children}
        </Box>

        {!isPpt && isSynopsis && !hideFooter && <DocumentFooter pageNum={pageNum} />}
      </Box>
    );
  };


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
          bgcolor: '#525659',
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
                <DocumentPage pageNum="i" hideHeader hideFooter>
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
                  {validChapters.length > 0 && (() => {
                    const ch = validChapters[0];
                    const isTitlePage = ch.title?.toUpperCase() === 'TITLE PAGE';

                    if (!isTitlePage) {
                      return (
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
                            dangerouslySetInnerHTML={{ __html: normalizeHtmlWhitespace(ch.body_html) }}
                          />
                        </Box>
                      );
                    }

                    const tp = extractTitlePage(ch.body_html);

                    return (
                      <Box
                        sx={{
                          minHeight: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          fontFamily: 'Times New Roman, serif',

                          // Real thesis margins
                          pt: 10,   // more top space
                          pb: 10,   // more bottom space
                          gap: 4,   // more spacing between sections
                          px: 6,

                        }}
                      >

                        {/* Title */}
                        <Typography sx={{ fontSize: 16, fontWeight: 700, mt: 6 }}>
                          {tp.title}
                        </Typography>

                        {/* Degree Block */}
                        <Box>

                          <Typography sx={{ fontSize: 16, fontWeight: 700, mt: 1 }}>
                            Doctor of Philosophy
                          </Typography>

                          <Typography sx={{ fontSize: 14, mt: 1 }}>
                            in
                          </Typography>

                          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                            Department of Engineering & Technology
                          </Typography>

                          <Typography sx={{ fontSize: 14, mt: 1 }}>
                            by {tp.scholar}
                          </Typography>

                          <Typography sx={{ fontSize: 14 }}>
                            ({tp.regNo})
                          </Typography>
                        </Box>

                        {/* Logo */}
                        {tp.logo && (
                          <img src={tp.logo} alt="University Logo" style={{ width: 140 }} />
                        )}

                        {/* Supervisor */}


                        <Box sx={{ mb: 6 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                            Under the supervision of
                          </Typography>

                          {tp.supervisorBlock.name && (
                            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                              {tp.supervisorBlock.name}
                            </Typography>
                          )}

                          {tp.supervisorBlock.department && (
                            <Typography sx={{ fontSize: 14 }}>
                              {tp.supervisorBlock.department}
                            </Typography>
                          )}

                          {tp.supervisorBlock.school && (
                            <Typography sx={{ fontSize: 14 }}>
                              {tp.supervisorBlock.school}
                            </Typography>
                          )}

                          {tp.supervisorBlock.university && (
                            <Typography sx={{ fontSize: 14, mt: 1 }}>
                              {tp.supervisorBlock.university}
                            </Typography>
                          )}

                          {tp.date && (
                            <Typography sx={{ fontSize: 14, mt: 1 }}>
                              {tp.date}
                            </Typography>
                          )}



                        </Box>
                      </Box>
                    );
                  })()}


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
                        dangerouslySetInnerHTML={{ __html: normalizeHtmlWhitespace(ch.body_html) }}
                      />
                    </Box>
                  </DocumentPage>
                ))}

                {/* Literature Review - continuous section */}
                {!isPresentation && Array.isArray(literature) && literature.length > 0 && (
                  <DocumentPage pageNum={validChapters.length + 1}>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 2, fontWeight: 600,
                          textAlign: 'center'
                        }}
                      >
                        REVIEW OF LITERATURE
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
                            {/* <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600, mb: 1 }}
                            >
                              {[item.title, item.authors, item.year]
                                .filter(Boolean)
                                .join(' • ')}
                            </Typography> */}

                            <Box
                              className="ck-content"
                              sx={DOCUMENT_TYPOGRAPHY}
                              dangerouslySetInnerHTML={{ __html: normalizeHtmlWhitespace(item.text) || '<p>—</p>' }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </DocumentPage>
                )}

                {/* REVIEW ANALYSIS – NUMBERED POINTS */}
                {!isPresentation && sections && Object.keys(sections).length > 0 && (
                  <DocumentPage pageNum={validChapters.length + 1}>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ mb: 3, fontWeight: 700, textAlign: 'center' }}
                      >
                        REVIEW ANALYSIS
                      </Typography>

                      <Stack spacing={4}>
                        {Object.entries(sections).map(([sectionName, htmlList]) => (
                          <Box key={sectionName}>
                            {/* Section heading */}
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                mb: 1.5,
                                textTransform: 'uppercase',
                              }}
                            >
                              {sectionName}
                            </Typography>

                            {/* Numbered list */}
                            <Box
                              component="ol"
                              sx={{
                                pl: 3,
                                m: 0,
                                '& li': {
                                  mb: 1.5,
                                },
                              }}
                            >
                              {htmlList.map((html, idx) => (
                                <li key={`${sectionName}-${idx}`}>
                                  <Box
                                    className="ck-content"
                                    sx={DOCUMENT_TYPOGRAPHY}
                                    dangerouslySetInnerHTML={{
                                      __html: normalizeHtmlWhitespace(html),
                                    }}
                                  />
                                </li>
                              ))}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </DocumentPage>
                )}



                {/* REFERENCES */}
                {!isPresentation && Array.isArray(citations) && citations.length > 0 && (
                  <DocumentPage pageNum={validChapters.length + 2}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, fontWeight: 600 }}
                    >
                      REFERENCES
                    </Typography>

                    {citations.map((ref, idx) => (
                      <Box
                        key={ref.order ?? idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          fontSize: 13,
                          lineHeight: 1.6,
                          textAlign: 'justify',
                        }}
                      >
                        {/* Sequence number */}
                        <Box
                          sx={{
                            minWidth: 24,
                            fontWeight: 600,
                          }}
                        >
                          {ref.order ?? idx + 1}.
                        </Box>

                        {/* Citation text */}
                        <Box sx={{ flex: 1 }}>
                          {ref.text}
                        </Box>
                      </Box>
                    ))}

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
                                  dangerouslySetInnerHTML={{
                                    __html: typeof row[col.key] === 'string'
                                      ? normalizeHtmlWhitespace(row[col.key])
                                      : ''
                                  }}

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
                    dangerouslySetInnerHTML={{ __html: normalizeHtmlWhitespace(html) }}
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
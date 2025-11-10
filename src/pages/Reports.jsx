// src/pages/Reports.jsx
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loadPapers } from '../store/papersSlice'
import {
  Paper as MUIPaper, Box, Typography, Button, TextField, InputAdornment,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, Tooltip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import VisibilityIcon from '@mui/icons-material/Visibility'
import CloseIcon from '@mui/icons-material/Close'
import { Document, Packer, Paragraph, TextRun } from 'docx'

const copyText = async (txt) => {
  try { await navigator.clipboard.writeText(txt || '') } catch {}
}

const ReviewCell = ({ text }) => {
  const t = text ?? ''
  const long = t.length > 120
  return (
    <Tooltip title={long ? t : ''} arrow>
      <Box sx={{
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: 3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'pre-wrap',
      }}>
        {t || '—'}
      </Box>
    </Tooltip>
  )
}

export default function Reports() {
  const dispatch = useDispatch()
  const { list, loading } = useSelector((s) => s.papers || { list: [], loading: false })

  React.useEffect(() => { dispatch(loadPapers()) }, [dispatch])

  // Normalize list → pick Literature Review text and a small header (authors, year)
  const allReviews = React.useMemo(() => {
    const arr = Array.isArray(list) ? list : (list?.data ?? [])
    return arr
      .map(p => {
        const txt = typeof p?.['Litracture Review'] === 'string' ? p['Litracture Review'].trim() : ''
        if (!txt) return null
        return {
          id: p?.id ?? p?.['Paper ID'],
          review: txt,
          title: p?.Title ?? '',
          authors: p?.['Author(s)'] ?? '',
          year: p?.Year ?? ''
        }
      })
      .filter(Boolean)
  }, [list])

  // Search + pagination
  const [query, setQuery] = React.useState('')
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allReviews
    return allReviews.filter(r =>
      [r.review, r.title, r.authors, r.year].filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [allReviews, query])

  const start = page * rowsPerPage
  const rows = filtered.slice(start, start + rowsPerPage)

  // ---------- DOCX helpers ----------
  const buildDocFromItems = (items) => {
    const paras = []
    paras.push(new Paragraph({
      spacing: { after: 300 },
      children: [new TextRun({ text: 'Review of Literature', bold: true, size: 28 })],
    }))
    items.forEach((item, idx) => {
      const head = [
        item.authors ? `[${item.authors}` : '',
        item.year ? `, ${item.year}]` : item.authors ? ']' : ''
      ].join('')
      if (head) {
        paras.push(new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: head, bold: true, size: 24 })]
        }))
      }
      item.review.split(/\n\s*\n/).forEach(chunk => {
        paras.push(new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: chunk, font: 'Calibri', size: 22 })]
        }))
      })
      if (idx < items.length - 1) paras.push(new Paragraph({}))
    })
    return new Document({ sections: [{ properties: {}, children: paras }] })
  }

  const downloadAllDocx = async () => {
    const doc = buildDocFromItems(filtered)
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Review_of_Literature.docx'
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadOneDocx = async (item) => {
    const doc = buildDocFromItems([item])
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Review_${item.id || 'item'}.docx`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  // ---------- Preview modal ----------
  const [preview, setPreview] = React.useState(null) // {review, authors, year, title}
  const closePreview = () => setPreview(null)

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <MUIPaper
        sx={{
          mb: 1,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          border: '1px solid #eee',
          borderRadius: 2,
          bgcolor: 'background.paper',
          flexShrink: 0
        }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1, lineHeight: 1 }}>
          Reports — Literature Reviews
          <Typography component="span" sx={{ color: 'text.secondary', ml: 1 }}>
            ( {filtered.length} items )
          </Typography>
        </Typography>

        <TextField
          size="small"
          placeholder="Search review, title, authors, year…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0) }}
          sx={{ width: 420, maxWidth: '45%' }}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
        />

        <Button variant="contained" onClick={downloadAllDocx} disabled={filtered.length === 0}>
          Download .docx
        </Button>
      </MUIPaper>

      {/* Table */}
      <MUIPaper sx={{ border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {loading ? (
          <Typography sx={{ p: 2 }}>Loading…</Typography>
        ) : (
          <>
            <TableContainer
              sx={{
                flex: 1,
                minHeight: 200,
                maxHeight: 'calc(100vh - 210px)',
                overflow: 'auto'
              }}
            >
              <Table stickyHeader size="small" aria-label="literature reviews">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f7f7f9', width: 80 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f7f7f9' }}>Literature Review</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f7f7f9', width: 140 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                        No literature reviews found. {query ? 'Try clearing your search.' : ''}
                      </TableCell>
                    </TableRow>
                  ) : rows.map((r, i) => (
                    <TableRow hover key={String(r.id ?? i)}>
                      <TableCell>{start + i + 1}</TableCell>
                      <TableCell><ReviewCell text={r.review} /></TableCell>
                      <TableCell>
                        <Tooltip title="Preview">
                          <span>
                            <IconButton size="small" onClick={() => setPreview(r)} aria-label="preview">
                              <VisibilityIcon fontSize="inherit" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Copy to clipboard">
                          <span>
                            <IconButton size="small" onClick={() => copyText(r.review)} aria-label="copy">
                              <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Download this as .docx">
                          <span>
                            <Button size="small" onClick={() => downloadOneDocx(r)}>Download</Button>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
                showFirstButton
                showLastButton
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </Box>
          </>
        )}
      </MUIPaper>

      {/* Preview Modal – doc-like page */}
      <Dialog open={!!preview} onClose={closePreview} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
          Preview (Doc format)
          <IconButton onClick={closePreview} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#f5f6f8' }}>
          {preview && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: 'min(794px, 90vw)',              // ≈ A4 at 96dpi
                  bgcolor: 'white',
                  boxShadow: 1,
                  border: '1px solid #e5e7eb',
                  p: '2.54cm',                             // doc-like margins
                  lineHeight: 1.6,
                  fontSize: 16,
                  fontFamily: `'Calibri','Segoe UI',system-ui,Arial,sans-serif`
                }}
              >
                {/* Optional header line */}
                {(preview.authors || preview.year) && (
                  <Typography sx={{ fontWeight: 700, mb: 2 }}>
                    [{preview.authors}{preview.year ? `, ${preview.year}` : ''}]
                  </Typography>
                )}
                {/* Body with paragraph breaks */}
                {preview.review.split(/\n\s*\n/).map((para, idx) => (
                  <Typography key={idx} sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                    {para}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {preview && (
            <Button onClick={() => downloadOneDocx(preview)} variant="contained">
              Download this .docx
            </Button>
          )}
          <Button onClick={closePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// src/pages/ROL.jsx
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loadROL } from '../store/papersSlice'
import {
  Paper as MUIPaper, Box, Typography, Button, TextField, InputAdornment,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, Tooltip
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import * as XLSX from 'xlsx'

const Ellipsed = ({ value, clamp = 1 }) => (
  <Tooltip title={value && String(value).length > 80 ? String(value) : ''} arrow>
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
)

export default function ROL() {
  const dispatch = useDispatch()
  const { rol, loading } = useSelector(s => s.papers || { rol: [], loading: false })

  React.useEffect(() => { dispatch(loadROL()) }, [dispatch])

  // Normalize array
  const data = Array.isArray(rol) ? rol : []

  // Search + pagination
  const [query, setQuery] = React.useState('')
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter(r =>
      [
        r?.id, r?.title, r?.authors, r?.year, r?.doi, r?.category, r?.keyIssue
      ].filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [data, query])

  const start = page * rowsPerPage
  const rows = filtered.slice(start, start + rowsPerPage)

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ROL')
    XLSX.writeFile(wb, 'ROL.xlsx')
  }

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
          ROL (Review of Literature)
          <Typography component="span" sx={{ color: 'text.secondary', ml: 1 }}>
            ( {filtered.length} items )
          </Typography>
        </Typography>

        <TextField
          size="small"
          placeholder="Search title, authors, year, DOI, key issue…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0) }}
          sx={{ width: 420, maxWidth: '45%' }}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
        />

        <Button variant="contained" onClick={downloadExcel} disabled={filtered.length === 0}>
          Download ROL Excel
        </Button>
      </MUIPaper>

      {/* Table area – only this scrolls */}
      <MUIPaper sx={{ border: '1px solid #eee', borderRadius: 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {loading ? (
          <Typography sx={{ p: 2 }}>Loading…</Typography>
        ) : (
          <>
            <TableContainer
              sx={{
                flex: 1,
                minHeight: 200,
                maxHeight: 'calc(100vh - 210px)', // same as other pages
                overflow: 'auto'
              }}
            >
              <Table stickyHeader size="small" aria-label="ROL table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f7f7f9', width: 80 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f7f7f9', minWidth: 260 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f7f7f9', minWidth: 180 }}>Authors</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f7f7f9', width: 90 }}>Year</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f7f7f9', minWidth: 160 }}>DOI</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f7f7f9', minWidth: 140 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f7f7f9', minWidth: 240 }}>Key Issue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        No data
                      </TableCell>
                    </TableRow>
                  ) : rows.map((r, i) => (
                    <TableRow hover key={String(r.id ?? start + i + 1)}>
                      <TableCell>{start + i + 1}</TableCell>
                      <TableCell><Ellipsed value={r.title} clamp={2} /></TableCell>
                      <TableCell><Ellipsed value={r.authors} /></TableCell>
                      <TableCell>{r.year ?? '—'}</TableCell>
                      <TableCell><Ellipsed value={r.doi} /></TableCell>
                      <TableCell><Ellipsed value={r.category} /></TableCell>
                      <TableCell><Ellipsed value={r.keyIssue} clamp={2} /></TableCell>
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
    </Box>
  )
}

import * as XLSX from 'xlsx'

export function exportToExcel(filename, rows) {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  XLSX.writeFile(wb, filename)
}

export function selectROLColumns(items) {
  return items.map(p => ({
    'Paper ID': p['Paper ID'] || p.id,
    'DOI': p['DOI'],
    'Author(s)': p['Author(s)'],
    'Year': p['Year'],
    'Title': p['Title'],
    'Category of Paper': p['Category of Paper'],
    'Key Issue': p['Key Issue']
  }))
}

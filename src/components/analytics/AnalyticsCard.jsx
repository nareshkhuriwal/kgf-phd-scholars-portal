import React from 'react';
import {
  Paper, Box, Typography, Stack, IconButton, ToggleButtonGroup,
  ToggleButton, Tooltip, Divider
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import BarChartIcon from '@mui/icons-material/BarChart';

import AnalyticsTable from './AnalyticsTable';
import AnalyticsChart from './AnalyticsChart';
import { toPng } from 'html-to-image';

/* ---------- CSV helper ---------- */
function downloadCSV(filename, rows) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default function AnalyticsCard({ title, type, data }) {
  const [view, setView] = React.useState('table');
  const chartRef = React.useRef(null);

  const handleDownload = async () => {
    if (view === 'table') {
      // ---- TABLE → CSV ----
      if (Array.isArray(data)) {
        downloadCSV(`${title}.csv`, data);
      } else if (data?.matrix) {
        // matrix / aggregated matrix
        downloadCSV(`${title}.csv`, data.matrix);
      }
    } else {
      // ---- CHART → PNG ----
      if (!chartRef.current) return;
      const png = await toPng(chartRef.current, { cacheBust: true });
      const a = document.createElement('a');
      a.href = png;
      a.download = `${title}.png`;
      a.click();
    }
  };

  return (
    <Paper sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 2 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>

        <ToggleButtonGroup
          size="small"
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
        >
          <ToggleButton value="table">
            <TableChartIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="chart">
            <BarChartIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Divider sx={{ mb: 1 }} />

      {/* Body */}
      <Box
        ref={chartRef}
        sx={{ height: 260, overflow: 'auto', bgcolor: '#fff' }}
      >
        {view === 'table' ? (
          <AnalyticsTable type={type} data={data} />
        ) : (
          <AnalyticsChart type={type} data={data} />
        )}
      </Box>

      {/* Actions */}
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
        <Tooltip title="Copy JSON">
          <IconButton
            size="small"
            onClick={() =>
              navigator.clipboard.writeText(JSON.stringify(data, null, 2))
            }
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={view === 'table' ? 'Download CSV' : 'Download PNG'}>
          <IconButton size="small" onClick={handleDownload}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
}

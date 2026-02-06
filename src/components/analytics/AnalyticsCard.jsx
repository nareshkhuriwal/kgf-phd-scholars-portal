import React from 'react';
import {
  Paper, Box, Typography, Stack, IconButton,
  ToggleButtonGroup, ToggleButton, Tooltip, Divider,
  Dialog, DialogContent
} from '@mui/material';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseIcon from '@mui/icons-material/Close';

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

import AnalyticsTable from './AnalyticsTable';
import AnalyticsChart from './AnalyticsChart';
import { toPng } from 'html-to-image';

/* ---------------- CSV helper ---------------- */
function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
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

/* ---------------- Renderer ---------------- */
const RenderContent = ({ view, type, data }) =>
  view === 'table'
    ? <AnalyticsTable type={type} data={data} />
    : <AnalyticsChart type={type} data={data} />;

export default function AnalyticsCard({ title, type, data }) {
  const [view, setView] = React.useState('table');
  const [open, setOpen] = React.useState(false);
  const chartRef = React.useRef(null);

  const handleDownload = async () => {
    if (view === 'table') {
      if (Array.isArray(data)) {
        downloadCSV(`${title}.csv`, data);
      } else if (data?.matrix) {
        downloadCSV(`${title}.csv`, data.matrix);
      }
    } else {
      if (!chartRef.current) return;
      const png = await toPng(chartRef.current, { cacheBust: true });
      const a = document.createElement('a');
      a.href = png;
      a.download = `${title}.png`;
      a.click();
    }
  };

  return (
    <>
      {/* ================= CARD ================= */}
      <Paper sx={{ p: 1.5, borderRadius: 2 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={600}>{title}</Typography>

          <Stack direction="row" spacing={1}>
            <ToggleButtonGroup
              size="small"
              value={view}
              exclusive
              onChange={(_, v) => v && setView(v)}
            >
              <ToggleButton value="table"><TableChartIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="chart"><BarChartIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title="Fullscreen">
              <IconButton size="small" onClick={() => setOpen(true)}>
                <OpenInFullIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Divider sx={{ my: 1 }} />

        {/* Body */}
        <Box
          ref={chartRef}
          sx={{
            minHeight: 260,
            maxHeight: 260,
            overflow: 'hidden',
            display: 'flex'
          }}
        >
          <RenderContent view={view} type={type} data={data} />
        </Box>


        {/* Actions */}
        <Stack direction="row" justifyContent="flex-end" spacing={1} mt={1}>
          <Tooltip title="Copy JSON">
            <IconButton size="small"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
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

      {/* ================= FULLSCREEN MODAL ================= */}
      <Dialog open={open} fullScreen onClose={() => setOpen(false)}>
        <Stack direction="row" justifyContent="space-between" p={2}>
          <Typography fontWeight={600}>{title}</Typography>
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <DialogContent dividers>
  {view === 'table' ? (
    <TransformWrapper
      wheel={{ step: 0.1 }}
      doubleClick={{ disabled: true }}
      pinch={{ step: 5 }}
    >
      <TransformComponent>
        <Box sx={{ minHeight: '80vh', width: '100%' }}>
          <AnalyticsTable type={type} data={data} />
        </Box>
      </TransformComponent>
    </TransformWrapper>
  ) : (
    <Box
      sx={{
        height: '80vh',
        width: '100%',
        minHeight: 600,
        display: 'flex'
      }}
    >
      <AnalyticsChart type={type} data={data} />
    </Box>
  )}
</DialogContent>

      </Dialog>
    </>
  );
}

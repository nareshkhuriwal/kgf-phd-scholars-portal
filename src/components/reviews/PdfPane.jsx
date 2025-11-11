import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

function PdfPaneInner({ pdfUrl }) {
  return (
    <Paper
      sx={{
        height: '100%',
        border: '1px solid #eee',
        borderRadius: 2,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
        PDF Preview
      </Typography>

      {!pdfUrl ? (
        <Typography variant="body2" color="text.secondary">
          No PDF attached. Upload a PDF in Library → Paper Files and refresh.
        </Typography>
      ) : (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          {/* Stable element: won’t remount on typing */}
          <embed
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            type="application/pdf"
            style={{ width: '100%', height: '100%', border: 0, borderRadius: 8 }}
          />
        </Box>
      )}
    </Paper>
  );
}

// Only re-render if the URL actually changes
const PdfPane = React.memo(PdfPaneInner, (prev, next) => prev.pdfUrl === next.pdfUrl);
export default PdfPane;

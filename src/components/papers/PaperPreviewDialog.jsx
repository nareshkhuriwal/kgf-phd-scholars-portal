import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Box,
} from '@mui/material';
import { exportPaperDocx } from '../../utils/docx/authoredPaperDocx';

export default function PaperPreviewDialog({ open, onClose, paper }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        Preview
        <Button variant="outlined" onClick={() => exportPaperDocx(paper)}>
          Download DOCX
        </Button>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#eaeaea', p: 3 }}>
        {/* Printable Page */}
        <Box
          sx={{
            maxWidth: '210mm',
            minHeight: '297mm',
            mx: 'auto',
            bgcolor: '#fff',
            p: '30mm',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          }}
          className="ck-content"
        >
          <h1 style={{ textAlign: 'center', marginBottom: 32 }}>
            {paper.title}
          </h1>

          {paper.sections.map(s => (
            <Box key={s.id} sx={{ mb: 3 }}>
              <h2>{s.section_title}</h2>
              <div
                dangerouslySetInnerHTML={{ __html: s.body_html }}
              />
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

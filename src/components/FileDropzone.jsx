// src/components/FileDropzone.jsx
import React from 'react';
import { Box } from '@mui/material';

export default function FileDropzone({ onFiles }) {
  const ref = React.useRef();

  const handleFiles = (flist) => {
    const arr = Array.from(flist || []);
    onFiles(arr);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <Box
      onDragOver={(e)=>{ e.preventDefault(); e.dataTransfer.dropEffect='copy'; }}
      onDrop={onDrop}
      onClick={() => ref.current?.click()}
      sx={{
        border: '2px dashed #d8dbe2',
        p: 6, textAlign: 'center', borderRadius: 2, cursor: 'pointer',
        color: 'text.secondary'
      }}
    >
      Drag & drop PDFs/BIB/RIS/CSV here, or click to choose
      <input
        ref={ref}
        type="file"
        multiple
        accept=".pdf,.bib,.ris,.csv,application/pdf,text/csv,text/plain,application/octet-stream"
        style={{ display: 'none' }}
        onChange={(e)=>handleFiles(e.target.files)}
      />
    </Box>
  );
}

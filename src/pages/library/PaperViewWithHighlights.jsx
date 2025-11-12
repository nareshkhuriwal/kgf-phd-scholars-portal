// src/pages/library/PaperViewWithHighlights.jsx
import React from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import HighlightToolbar from '../../components/pdf/HighlightToolbar';
import HighlightOverlay from '../../components/pdf/HighlightOverlay';

// assume you already have a PDF.js component that renders pages
// and exposes refs to each page container
export default function PaperViewWithHighlights({ paperId, fileUrl, pages, pageRefs }) {
  const [enabled, setEnabled] = React.useState(false);
  const [hl, setHl] = React.useState({}); // { [pageNumber]: [{x,y,w,h}, ...] }
  const [toast, setToast] = React.useState(null);

  const onAddRect = (page, rect) => {
    setHl((prev) => {
      const arr = prev[page] ? [...prev[page], rect] : [rect];
      return { ...prev, [page]: arr };
    });
  };

  const onUndo = () => {
    setHl((prev) => {
      const copy = { ...prev };
      const lastPage = Object.keys(copy).map(n => +n).sort((a,b)=>b-a).find(p => copy[p]?.length);
      if (!lastPage) return prev;
      copy[lastPage] = copy[lastPage].slice(0, -1);
      if (copy[lastPage].length === 0) delete copy[lastPage];
      return copy;
    });
  };

  const onClear = () => setHl({});

  const onSave = async () => {
    try {
      const highlights = Object.entries(hl).map(([page, rects]) => ({
        page: Number(page),
        rects,
      }));
      const res = await fetch(`/api/papers/${paperId}/highlights/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ replace: false, highlights }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setToast({ severity: 'success', msg: 'Saved. Opening highlighted PDF…' });
      // open in new tab; if you want to replace current viewer, update state to data.file_url
      window.open(data.file_url, '_blank', 'noopener');
    } catch (e) {
      setToast({ severity: 'error', msg: 'Failed to save highlights' });
    }
  };

  const canClear = Object.keys(hl).length > 0;
  const canUndo  = canClear;

  return (
    <Box>
      <HighlightToolbar
        enabled={enabled}
        setEnabled={setEnabled}
        canUndo={canUndo}
        onUndo={onUndo}
        canClear={canClear}
        onClear={onClear}
        onSave={onSave}
      />

      {/* Your PDF pages */}
      <div className="pdf-document">
        {pages.map((pageNumber) => (
          <div key={pageNumber} className="pdf-page" ref={pageRefs[pageNumber]}>
            {/* your existing canvas/textLayer elements here */}
            {/* ensure this container is position:relative */}
            {enabled && (
              <HighlightOverlay
                pageNumber={pageNumber}
                pageRef={pageRefs[pageNumber]}
                highlights={hl[pageNumber] || []}
                onAddRect={onAddRect}
              />
            )}
          </div>
        ))}
      </div>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast && <Alert severity={toast.severity}>{toast.msg}</Alert>}
      </Snackbar>
    </Box>
  );
}

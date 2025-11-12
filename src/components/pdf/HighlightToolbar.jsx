import React from 'react';
import {
  Stack, IconButton, Tooltip, Divider, Menu, MenuItem,
  Button, Popover, Box, Slider
} from '@mui/material';
import HighlightIcon from '@mui/icons-material/HighlightAlt';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SaveIcon from '@mui/icons-material/Save';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import OpacityIcon from '@mui/icons-material/Opacity';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

const SWATCHES = ['#FFEB3B', '#FFF59D', '#A5D6A7', '#90CAF9', '#F48FB1', '#FFCC80'];

export default function HighlightToolbar({
  enabled, setEnabled,
  canUndo, onUndo,
  canClear, onClear,
  onSave,            // required (existing)
  onSaveReplace,     // optional: save & overwrite original
  onRedo,            // optional
  color, setColor,   // optional: current color (hex) and setter
  alpha, setAlpha,   // optional: 0..1 opacity and setter
  onZoomChange       // optional: (delta) => {}
}) {
  // Default ON once (if parent forgot to default ON)
  React.useEffect(() => {
    if (setEnabled && !enabled) setEnabled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [menuEl, setMenuEl] = React.useState(null);
  const [colorEl, setColorEl] = React.useState(null);
  const [alphaEl, setAlphaEl] = React.useState(null);

  const handleSave = () => onSave && onSave();
  const handleSaveReplace = () => (onSaveReplace ? onSaveReplace() : onSave && onSave());

  const curColor = color || '#FFEB3B';
  const curAlpha = typeof alpha === 'number' ? alpha : 0.35;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {/* Highlight ON/OFF */}
      <Tooltip title={enabled ? 'Highlight: ON' : 'Enable Highlight'}>
        <IconButton
          color={enabled ? 'primary' : 'default'}
          onClick={() => setEnabled && setEnabled(!enabled)}
          sx={{ border: '1px solid', borderColor: enabled ? 'primary.main' : 'divider' }}
        >
          <HighlightIcon />
        </IconButton>
      </Tooltip>


      <Divider flexItem orientation="vertical" />

      {/* Undo / Redo */}
      <Tooltip title="Undo">
        <span>
          <IconButton disabled={!canUndo} onClick={onUndo}><UndoIcon /></IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Redo">
        <span>
          <IconButton disabled={!onRedo} onClick={onRedo}><RedoIcon /></IconButton>
        </span>
      </Tooltip>

      {/* Clear */}
      <Tooltip title="Clear (current session)">
        <span>
          <IconButton disabled={!canClear} onClick={onClear}><DeleteSweepIcon /></IconButton>
        </span>
      </Tooltip>

      <Divider flexItem orientation="vertical" />

      {/* Color */}
      <Tooltip title="Highlight Color">
        <IconButton onClick={(e) => setColorEl(e.currentTarget)}>
          <ColorLensIcon />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!colorEl}
        anchorEl={colorEl}
        onClose={() => setColorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 1, display: 'flex', gap: 1 }}>
          {SWATCHES.map((c) => (
            <Box
              key={c}
              onClick={() => { setColor && setColor(c); setColorEl(null); }}
              sx={{
                width: 24, height: 24, borderRadius: '50%',
                bgcolor: c, border: '1px solid rgba(0,0,0,0.2)',
                cursor: setColor ? 'pointer' : 'not-allowed',
                opacity: setColor ? 1 : 0.5
              }}
              title={c}
            />
          ))}
        </Box>
      </Popover>

      {/* Opacity */}
      <Tooltip title="Opacity">
        <IconButton onClick={(e) => setAlphaEl(e.currentTarget)}>
          <OpacityIcon />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!alphaEl}
        anchorEl={alphaEl}
        onClose={() => setAlphaEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 220 }}>
          <Slider
            value={Math.round(curAlpha * 100)}
            onChange={(_, v) => setAlpha && setAlpha((Array.isArray(v) ? v[0] : v) / 100)}
            valueLabelDisplay="auto"
            disabled={!setAlpha}
          />
        </Box>
      </Popover>

      <Divider flexItem orientation="vertical" />

      {/* Zoom (optional) */}
      <Tooltip title="Zoom Out">
        <span>
          <IconButton onClick={() => onZoomChange && onZoomChange(-0.1)} disabled={!onZoomChange}>
            <ZoomOutIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Zoom In">
        <span>
          <IconButton onClick={() => onZoomChange && onZoomChange(+0.1)} disabled={!onZoomChange}>
            <ZoomInIcon />
          </IconButton>
        </span>
      </Tooltip>
      {typeof zoom === 'number' && (
        <Box sx={{ mx: 1, fontSize: 12, minWidth: 48, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </Box>
      )}


      <Stack direction="row" sx={{ ml: 'auto' }} spacing={1}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!canClear}
        >
          Save
        </Button>
        <Button
          variant="outlined"
          startIcon={<MoreVertIcon />}
          onClick={(e) => setMenuEl(e.currentTarget)}
        >
          More
        </Button>
        <Menu open={!!menuEl} anchorEl={menuEl} onClose={() => setMenuEl(null)}>
          <MenuItem onClick={() => { setMenuEl(null); handleSaveReplace(); }}>
            Save & Overwrite
          </MenuItem>
        </Menu>
      </Stack>
    </Stack>
  );
}

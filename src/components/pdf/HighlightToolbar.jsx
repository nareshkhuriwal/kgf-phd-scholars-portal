// src/components/reviews/HighlightToolbar.jsx
import React from 'react';
import {
  Stack, IconButton, Tooltip, Divider, Menu, MenuItem,
  Button, Popover, Box, Slider, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
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

const SWATCHES = ['#FFEB3B','#FFF59D','#A5D6A7','#90CAF9','#F48FB1','#FFCC80'];

export default function HighlightToolbar({
  enabled, setEnabled,
  canUndo, onUndo,
  canClear, onClear,
  onSave, onSaveReplace,
  onRedo,
  color, setColor,
  alpha, setAlpha,
  onZoomChange
}) {
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down('sm'));   // phones
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));   // tablets

  const [menuEl, setMenuEl] = React.useState(null);
  const [colorEl, setColorEl] = React.useState(null);
  const [alphaEl, setAlphaEl] = React.useState(null);

  const curColor = color || '#FFEB3B';
  const curAlpha = typeof alpha === 'number' ? alpha : 0.35;

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      useFlexGap
      sx={{
        flexWrap: 'wrap',            // <-- allows second row when tight
        rowGap: 1,
        columnGap: 1,
        minHeight: 48,
      }}
    >
      <Tooltip title={enabled ? 'Highlight: ON' : 'Enable Highlight'}>
        <IconButton
          size="small"
          color={enabled ? 'primary' : 'default'}
          onClick={() => setEnabled && setEnabled(!enabled)}
          sx={{ border: 1, borderColor: enabled ? 'primary.main' : 'divider' }}
        >
          <HighlightIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', md: 'block' } }} />

      <Tooltip title="Undo">
        <span><IconButton size="small" disabled={!canUndo} onClick={onUndo}><UndoIcon fontSize="small" /></IconButton></span>
      </Tooltip>
      <Tooltip title="Redo">
        <span><IconButton size="small" disabled={!onRedo} onClick={onRedo}><RedoIcon fontSize="small" /></IconButton></span>
      </Tooltip>

      <Tooltip title="Clear (session)">
        <span><IconButton size="small" disabled={!canClear} onClick={onClear}><DeleteSweepIcon fontSize="small" /></IconButton></span>
      </Tooltip>

      {/* Compact group: color/opacity/zoom move into More on small screens */}
      {!mdDown && (
        <>
          <Divider flexItem orientation="vertical" />
          <Tooltip title="Highlight Color">
            <IconButton size="small" onClick={(e) => setColorEl(e.currentTarget)}><ColorLensIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Opacity">
            <IconButton size="small" onClick={(e) => setAlphaEl(e.currentTarget)}><OpacityIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <span><IconButton size="small" onClick={() => onZoomChange && onZoomChange(-0.1)} disabled={!onZoomChange}><ZoomOutIcon fontSize="small" /></IconButton></span>
          </Tooltip>
          <Tooltip title="Zoom In">
            <span><IconButton size="small" onClick={() => onZoomChange && onZoomChange(+0.1)} disabled={!onZoomChange}><ZoomInIcon fontSize="small" /></IconButton></span>
          </Tooltip>
        </>
      )}

      {/* Right-aligned actions */}
      <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
        <Button
          variant={smDown ? 'outlined' : 'contained'}
          size="small"
          startIcon={!smDown && <SaveIcon />}
          onClick={onSave}
          disabled={!canClear}
        >
          {smDown ? <SaveIcon fontSize="small" /> : 'Save'}
        </Button>
        <IconButton size="small" onClick={(e) => setMenuEl(e.currentTarget)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* More menu (also shows color/opacity/zoom on small screens) */}
      <Menu open={!!menuEl} anchorEl={menuEl} onClose={() => setMenuEl(null)}>
        {mdDown && (
          <>
            <MenuItem onClick={(e) => { setColorEl(e.currentTarget); setMenuEl(null); }}>
              <ColorLensIcon fontSize="small" style={{ marginRight: 8 }} /> Color…
            </MenuItem>
            <MenuItem onClick={(e) => { setAlphaEl(e.currentTarget); setMenuEl(null); }}>
              <OpacityIcon fontSize="small" style={{ marginRight: 8 }} /> Opacity…
            </MenuItem>
            <MenuItem onClick={() => { onZoomChange && onZoomChange(+0.1); }}>
              <ZoomInIcon fontSize="small" style={{ marginRight: 8 }} /> Zoom In
            </MenuItem>
            <MenuItem onClick={() => { onZoomChange && onZoomChange(-0.1); }}>
              <ZoomOutIcon fontSize="small" style={{ marginRight: 8 }} /> Zoom Out
            </MenuItem>
            <Divider />
          </>
        )}
        <MenuItem onClick={() => { setMenuEl(null); onSaveReplace && onSaveReplace(); }}>
          Save & Overwrite
        </MenuItem>
      </Menu>

      {/* Color popover */}
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
                bgcolor: c, border: '1px solid rgba(0,0,0,0.2)', cursor: 'pointer'
              }}
              title={c}
            />
          ))}
        </Box>
      </Popover>

      {/* Opacity popover */}
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
          />
        </Box>
      </Popover>
    </Stack>
  );
}

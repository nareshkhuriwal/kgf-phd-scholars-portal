import React from 'react';
import {
  Stack, IconButton, Tooltip, Divider, Menu, MenuItem,
  Button, Popover, Box, Slider, useMediaQuery, CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import BrushIcon from '@mui/icons-material/Brush';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SaveIcon from '@mui/icons-material/Save';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import OpacityIcon from '@mui/icons-material/Opacity';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
// ⬇️ NEW icon for reset all highlights
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

const SWATCHES = ['#FFEB3B', '#FFF59D', '#A5D6A7', '#90CAF9', '#F48FB1', '#FFCC80'];

export default function HighlightToolbar({
  enabled, setEnabled,
  mode = 'rect', setMode,
  canUndo, onUndo,
  canClear, onClear,
  onSave, onSaveReplace,
  onRedo,
  color, setColor,
  alpha, setAlpha,
  brushSize = 16, setBrushSize,
  onZoomChange, zoom,
  onToggleFullscreen,
  isFullscreen,
  onFitWidth, onReset,
  saving,
  // ⬇️ NEW props for reset all highlights
  onResetHighlights,
  resetting = false,
}) {
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down('sm'));
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));

  const [menuEl, setMenuEl] = React.useState(null);
  const [colorEl, setColorEl] = React.useState(null);
  const [alphaEl, setAlphaEl] = React.useState(null);
  const [brushEl, setBrushEl] = React.useState(null);

  const curAlpha = typeof alpha === 'number' ? alpha : 0.25;

  return (
    <Stack direction="row" spacing={1} alignItems="center" useFlexGap
      sx={{
        flexWrap: 'wrap',
        rowGap: 1,
        columnGap: 1,
        minHeight: 48,
        p: 0.5,
        backgroundColor: theme.palette.background.default,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >

      {/* enable / mode */}
      <Tooltip title={enabled ? 'Highlighting: ON' : 'Enable Highlighting'}>
        <IconButton
          size="small"
          color={enabled ? 'primary' : 'default'}
          onClick={() => setEnabled?.(!enabled)}
          sx={{ border: 1, borderColor: enabled ? 'primary.main' : 'divider' }}
        >
          {mode === 'brush' ? <BrushIcon fontSize="small" /> : <HighlightAltIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Tooltip title={mode === 'brush' ? 'Switch to Rectangle mode' : 'Switch to Brush mode'}>
        <span>
          <IconButton size="small" onClick={() => setMode?.(mode === 'brush' ? 'rect' : 'brush')}>
            {mode === 'brush' ? <HighlightAltIcon fontSize="small" /> : <BrushIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>

      <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', md: 'block' } }} />

      {/* undo/redo/clear */}
      <Tooltip title="Undo">
        <span>
          <IconButton size="small" disabled={!canUndo || saving || resetting} onClick={onUndo}>
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Redo">
        <span>
          <IconButton size="small" disabled={!onRedo || saving || resetting} onClick={onRedo}>
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Clear (current session)">
        <span>
          <IconButton size="small" disabled={!canClear || saving || resetting} onClick={onClear}>
            <DeleteSweepIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {/* ⬇️ NEW: Reset All Highlights Button */}
      <Tooltip title="Reset all highlights (restore original PDF)">
        <span>
          <IconButton
            size="small"
            onClick={onResetHighlights}
            disabled={saving || resetting}
            sx={{
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'error.contrastText',
              },
            }}
          >
            {resetting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <HighlightOffIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>

      {!mdDown && (
        <>
          <Divider flexItem orientation="vertical" />
          {/* color/opacity */}
          <Tooltip title="Highlight Color">
            <IconButton size="small" onClick={(e) => setColorEl(e.currentTarget)}>
              <ColorLensIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Opacity">
            <IconButton size="small" onClick={(e) => setAlphaEl(e.currentTarget)}>
              <OpacityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* zoom */}
          <Tooltip title="Zoom Out">
            <span>
              <IconButton size="small" onClick={() => onZoomChange?.(-0.1)} disabled={!onZoomChange}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Zoom In">
            <span>
              <IconButton size="small" onClick={() => onZoomChange?.(+0.1)} disabled={!onZoomChange}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Fit width">
            <span>
              <IconButton size="small" onClick={onFitWidth} disabled={!onFitWidth}>
                <FitScreenIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Reset zoom">
            <span>
              <IconButton size="small" onClick={onReset} disabled={!onReset}>
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}>
            <IconButton size="small" onClick={onToggleFullscreen}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </>
      )}

      {/* right actions - Save */}
      <Tooltip title="Save (⌘/Ctrl+S)">
        <span style={{ marginLeft: 'auto' }}>
          <IconButton
            size="small"
            onClick={onSave}
            disabled={!canClear || saving || resetting}
            color="primary"
          >
            {saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SaveIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>

      {/* Mobile menu icon */}
      {mdDown && (
        <IconButton size="small" onClick={(e) => setMenuEl(e.currentTarget)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      )}

      {/* menu (mobile extras) */}
      <Menu open={!!menuEl} anchorEl={menuEl} onClose={() => setMenuEl(null)}>
        {mdDown && (
          <>
            <MenuItem onClick={(e) => { setColorEl(e.currentTarget); setMenuEl(null); }}>
              <ColorLensIcon fontSize="small" style={{ marginRight: 8 }} /> Color…
            </MenuItem>
            <MenuItem onClick={(e) => { setAlphaEl(e.currentTarget); setMenuEl(null); }}>
              <OpacityIcon fontSize="small" style={{ marginRight: 8 }} /> Opacity…
            </MenuItem>
            <MenuItem onClick={() => { onZoomChange?.(+0.1); }}>
              <ZoomInIcon fontSize="small" style={{ marginRight: 8 }} /> Zoom In
            </MenuItem>
            <MenuItem onClick={() => { onZoomChange?.(-0.1); }}>
              <ZoomOutIcon fontSize="small" style={{ marginRight: 8 }} /> Zoom Out
            </MenuItem>
            <MenuItem onClick={() => { onFitWidth?.(); }}>
              <FitScreenIcon fontSize="small" style={{ marginRight: 8 }} /> Fit width
            </MenuItem>
            <MenuItem onClick={() => { onReset?.(); }}>
              <RestartAltIcon fontSize="small" style={{ marginRight: 8 }} /> Reset zoom
            </MenuItem>
            <Divider />
            {/* ⬇️ NEW: Reset highlights in mobile menu */}
            <MenuItem
              onClick={() => { setMenuEl(null); onResetHighlights?.(); }}
              disabled={resetting}
              sx={{ color: 'error.main' }}
            >
              <HighlightOffIcon fontSize="small" style={{ marginRight: 8 }} />
              {resetting ? 'Resetting...' : 'Reset All Highlights'}
            </MenuItem>
          </>
        )}
      </Menu>

      {/* color popover */}
      <Popover open={!!colorEl} anchorEl={colorEl} onClose={() => setColorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Box sx={{ p: 1, display: 'flex', gap: 1 }}>
          {SWATCHES.map((c) => (
            <Box key={c} onClick={() => { setColor?.(c); setColorEl(null); }}
              sx={{
                width: 24, height: 24, borderRadius: '50%', bgcolor: c,
                border: '1px solid rgba(0,0,0,0.2)', cursor: 'pointer'
              }} />
          ))}
        </Box>
      </Popover>

      {/* opacity popover */}
      <Popover open={!!alphaEl} anchorEl={alphaEl} onClose={() => setAlphaEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Box sx={{ p: 2, width: 220 }}>
          <Slider value={Math.round(curAlpha * 100)}
            onChange={(_, v) => setAlpha?.((Array.isArray(v) ? v[0] : v) / 100)}
            valueLabelDisplay="auto" />
        </Box>
      </Popover>

      {/* brush size (reserved) */}
      <Popover open={!!brushEl} anchorEl={brushEl} onClose={() => setBrushEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Box sx={{ p: 2, width: 220 }}>
          <Slider min={2} max={48} step={1} value={brushSize}
            onChange={(_, v) => setBrushSize?.(Array.isArray(v) ? v[0] : v)}
            valueLabelDisplay="auto" />
        </Box>
      </Popover>
    </Stack>
  );
}
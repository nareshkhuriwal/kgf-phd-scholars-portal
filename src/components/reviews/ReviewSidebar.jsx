import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Divider,
  Stack,
  Link,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { SECTION_GUIDELINES } from './sectionGuidelines';

function fmtBytes(b) {
  if (b == null) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0, n = Number(b);
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
}

const hasContent = (html = '') =>
  html.replace(/<[^>]*>/g, '').trim().length > 0;

export default function ReviewSidebar({
  paper,
  open = true,          // sidebar visibility (controlled by parent)
  onToggle,             // sidebar toggle (NOT used for details)
  sections = {},
  activeTab = 0,
  onSelectSection,
  editorOrder = [],
}) {
  const [detailsOpen, setDetailsOpen] = React.useState(true);

  const meta = paper?.paper || paper || {};
  const title = meta.title ?? paper?.title ?? '—';
  const authors = meta.authors ?? paper?.authors ?? '—';
  const year = meta.year ?? paper?.year ?? '—';
  const pdfUrl = meta.pdf_url ?? paper?.pdf_url ?? null;
  const fileName = meta.file_name ?? paper?.file_name ?? (pdfUrl ? pdfUrl.split('/').pop() : '—');
  const fileSize = meta.file_size ?? paper?.file_size ?? null;
  const filePath = meta.file_path ?? paper?.file_path ?? pdfUrl ?? '—';
  const [expandedGuide, setExpandedGuide] = React.useState(null);

  return (
    <Paper
      sx={{
        p: 1.5,
        border: '1px solid #eee',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#c1c1c1',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#a8a8a8',
        },
      }}
    >

      {/* ================= SECTIONS ================= */}
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1,
          fontWeight: 600,
          letterSpacing: 0.3,
          color: 'text.secondary',
        }}
      >
        Sections
      </Typography>


      <Stack spacing={0.5} sx={{
        mb: 1.5,
        maxHeight: 510,
        overflowY: 'auto',

        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#c1c1c1',
          borderRadius: '8px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#a8a8a8',
        },
      }}>
        {editorOrder.map((label, index) => {
          const filled = hasContent(sections[label]);
          const hasGuide = Boolean(SECTION_GUIDELINES[label]);

          return (
            <Box key={label}>
              {/* SECTION ROW */}
              <Box
                onClick={() => onSelectSection(index)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.25,
                  py: 0.85,
                  borderRadius: 1.25,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  bgcolor: activeTab === index ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {/* Number */}
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    bgcolor: activeTab === index ? 'primary.main' : 'grey.200',
                    color: activeTab === index ? '#fff' : 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </Box>

                {/* Label */}
                <Typography
                  variant="body2"
                  sx={{ flex: 1, fontWeight: activeTab === index ? 600 : 400 }}
                >
                  {label}
                </Typography>

                {/* EXPAND GUIDELINES ICON */}
                {hasGuide && (
                  <Tooltip title="Show guidelines">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation(); // 🔴 VERY IMPORTANT
                        setExpandedGuide(expandedGuide === label ? null : label);
                      }}
                    >
                      <ExpandMoreIcon
                        sx={{
                          fontSize: 18,
                          transform:
                            expandedGuide === label ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                )}

                {/* COMPLETED TICK */}
                {filled && (
                  <Tooltip title="Completed">
                    <CheckCircleIcon
                      sx={{ fontSize: 18, color: 'success.main', opacity: 0.9 }}
                    />
                  </Tooltip>
                )}
              </Box>

              {/* GUIDELINES BELOW SECTION */}
              <Collapse in={expandedGuide === label} timeout="auto" unmountOnExit>
                <Box
                  sx={{
                    mt: 0.75,
                    mb: 1,
                    px: 1.25,
                    py: 1,
                    borderRadius: 1,
                    backgroundColor: (theme) => theme.palette.grey[50],
                  }}
                >
                  {/* Optional header */}
                  <Typography
                    variant="overline"
                    sx={{
                      display: 'block',
                      mb: 0.75,
                      color: 'text.disabled',
                      letterSpacing: 0.8,
                    }}
                  >
                    Guiding Questions
                  </Typography>

                  {SECTION_GUIDELINES[label]?.map((q, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        mb: 0.75,
                      }}
                    >
                      {/* Number */}
                      <Typography
                        variant="caption"
                        sx={{
                          minWidth: 18,
                          textAlign: 'right',
                          fontWeight: 600,
                          color: 'text.secondary',
                        }}
                      >
                        {i + 1}.
                      </Typography>

                      {/* Question */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.5,
                        }}
                      >
                        {q}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Collapse>

            </Box>
          );
        })}


        {/* ================= DETAILS ================= */}

        <Divider sx={{ mb: 1 }} />

        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              letterSpacing: 0.3,
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'text.secondary',
            }}
          >
            Details
          </Typography>

        </Box>
        <Divider sx={{ mb: 1 }} />


        <Box>
          <Typography variant="caption" color="text.secondary">Title</Typography>
          <Typography variant="body2" noWrap title={title}>
            {title}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">Authors</Typography>
          <Typography variant="body2" noWrap title={authors}>
            {authors}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">Year</Typography>
          <Typography variant="body2">{year}</Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="caption" color="text.secondary">File name</Typography>
          <Typography variant="body2" noWrap title={fileName}>
            {fileName}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">Size</Typography>
          <Typography variant="body2">{fmtBytes(fileSize)}</Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">Path / URL</Typography>
          {pdfUrl ? (
            <Tooltip title={filePath}>
              <Link
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: 12,
                }}
              >
                {filePath}
              </Link>
            </Tooltip>
          ) : (
            <Typography variant="body2" noWrap title={filePath}>
              {filePath}
            </Typography>
          )}
        </Box>

      </Stack>

      <Divider sx={{ mb: 1 }} />



    </Paper>
  );
}

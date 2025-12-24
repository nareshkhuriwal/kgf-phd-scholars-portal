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
          borderRadius: '8px',
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
        maxHeight: 500,
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

          return (
            <Box
              key={label}
              onClick={() => onSelectSection(index)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.25,
                py: 0.85,
                borderRadius: 1.25,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                bgcolor: activeTab === index ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
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

              {/* Tick */}
              {filled && (
                <Tooltip title="Completed">
                  <CheckCircleIcon
                    sx={{
                      fontSize: 18,
                      color: 'success.main',
                      opacity: 0.9,
                    }}
                  />
                </Tooltip>
              )}

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


      {/* ================= GUIDELINES ================= */}
      <Divider sx={{ my: 1 }} />

      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            px: 0.5,
            py: 0.25,
          }}
          onClick={() => setDetailsOpen(v => !v)}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: 'text.secondary' }}
          >
            Guidelines
          </Typography>
          <ExpandMoreIcon
            sx={{
              fontSize: 18,
              transform: detailsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </Box>

        <Collapse in={detailsOpen} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 0.5, pl: 1 }}>
            {(SECTION_GUIDELINES[editorOrder[activeTab]] || []).map((q, i) => (
              <Typography
                key={i}
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 0.75,
                  color: 'text.secondary',
                  lineHeight: 1.4,
                }}
              >
                • {q}
              </Typography>
            ))}

            {!SECTION_GUIDELINES[editorOrder[activeTab]] && (
              <Typography variant="caption" color="text.secondary">
                No specific guidelines for this section.
              </Typography>
            )}
          </Box>
        </Collapse>
      </Box>


    </Paper>
  );
}

// src/components/site/LeftFeatures.jsx
import * as React from 'react';
import { Box, Typography, Stack, Chip, Button, IconButton } from '@mui/material';
import ArrowBackIosNew from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';

// Screenshots (use real UI shots)
import s1 from '../../assets/register/dashboard.png';
import s2 from '../../assets/register/library.png';
import s3 from '../../assets/register/paper_review.png';
import s4 from '../../assets/register/report.png';

const slides = [
  {
    img: s1,
    title: 'Unified Research Dashboard',
    caption: 'Track papers, reviews, collections, and chapter progress at a glance with status widgets and quick actions.'
  },
  {
    img: s2,
    title: 'Library & Smart Uploads',
    caption: 'Import PDFs/DOIs, auto-extract metadata, tag papers, and bulk-organize your literature repository.'
  },
  {
    img: s3,
    title: 'Review Workspace & Templates',
    caption: 'Structured forms for gaps, strengths, weaknesses, methodology, and results with reusable templates.'
  },
  {
    img: s4,
    title: 'Reports, Chapters & ROL',
    caption: 'Generate ROL tables, export to Word/Excel, and edit chapters with the built-in editor and citation helpers.'
  }
];

export default function LeftFeatures({ height }) {
  const [idx, setIdx] = React.useState(0);
  const next = React.useCallback(() => setIdx(i => (i + 1) % slides.length), []);
  const prev = React.useCallback(() => setIdx(i => (i - 1 + slides.length) % slides.length), []);

  // autoplay
  React.useEffect(() => {
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <Box sx={{ pr: { md: 6 }, color: 'white' }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
        KGF Scholars Portal
      </Typography>
      <Typography sx={{ lineHeight: 1.6, opacity: 0.9 }}>
        A complete workspace for PhD scholars to collect, review, and report literature—built for
        structured reviews, chapter drafting, and one-click exports.
      </Typography>

      {/* Slider */}
      <Box sx={{ position: 'relative', mt: 4, mb: 2 }}>
        <Box
          sx={{
            overflow: 'hidden',
            borderRadius: 2,
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            // Responsive height logic:
            aspectRatio: '16 / 9',
            maxHeight: { xs: 260, md: 420 },        // cap on large screens
            height: height || { xs: 'auto', md: 'auto' },
            bgcolor: 'rgba(255,255,255,0.04)'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              width: `${slides.length * 100}%`,
              height: '100%',
              transform: `translateX(-${idx * (100 / slides.length)}%)`,
              transition: 'transform .6s ease'
            }}
          >
            {slides.map((s, i) => (
              <Box key={i} sx={{ width: `${100 / slides.length}%`, position: 'relative' }}>
                <Box
                  component="img"
                  src={s.img}
                  alt={s.title}
                  // show the complete picture without crop:
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.45))'
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        <IconButton
          onClick={prev}
          sx={{
            position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)',
            bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' }
          }}>
          <ArrowBackIosNew fontSize="small" sx={{ color: 'white' }} />
        </IconButton>
        <IconButton
          onClick={next}
          sx={{
            position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)',
            bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' }
          }}>
          <ArrowForwardIos fontSize="small" sx={{ color: 'white' }} />
        </IconButton>

        {/* caption */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {slides[idx].title}
          </Typography>
          <Typography sx={{ opacity: 0.9 }}>{slides[idx].caption}</Typography>
        </Box>

        {/* dots */}
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          {slides.map((_, i) => (
            <Box
              key={i}
              onClick={() => setIdx(i)}
              sx={{
                width: 10, height: 10, borderRadius: '50%',
                bgcolor: i === idx ? 'white' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer'
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Feature highlights for KGF Scholars Portal */}
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 3 }}>
        {[
          'DOI/PDF import & auto-metadata',
          'Tagging, filters & saved views',
          'Review templates (gaps/strengths/limits)',
          'One-click structured summaries',
          'ROL table generator (Excel/Word)',
          'Chapter editor with CKEditor',
          'Collections board (drag & drop)',
          'Comments & notes',
          'Bulk actions & de-duplication',
          'RBAC & audit trail',
          'Export: CSV/Excel/Docx',
          'Autosave & versioning'
        ].map(t => (
          <Chip
            key={t}
            label={t}
            sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: 'white' }}
          />
        ))}
      </Stack>

    </Box>
  );
}

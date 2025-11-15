// src/components/site/LeftFeatures.jsx
import * as React from 'react';
import { Box, Typography, Stack, Chip, IconButton, keyframes } from '@mui/material';
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
    caption: 'Track papers, reviews, collections, and chapter progress at a glance with status widgets and quick actions.',
    accent: '#6366f1'
  },
  {
    img: s2,
    title: 'Library & Smart Uploads',
    caption: 'Import PDFs/DOIs, auto-extract metadata, tag papers, and bulk-organize your literature repository.',
    accent: '#ec4899'
  },
  {
    img: s3,
    title: 'Review Workspace & Templates',
    caption: 'Structured forms for gaps, strengths, weaknesses, methodology, and results with reusable templates.',
    accent: '#8b5cf6'
  },
  {
    img: s4,
    title: 'Reports, Chapters & ROL',
    caption: 'Generate ROL tables, export to Word/Excel, and edit chapters with the built-in editor and citation helpers.',
    accent: '#06b6d4'
  }
];

// Keyframe animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const fadeInUp = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(30px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from { 
    opacity: 0; 
    transform: scale(0.95);
  }
  to { 
    opacity: 1; 
    transform: scale(1);
  }
`;

const glow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 10px currentColor); }
  50% { filter: drop-shadow(0 0 20px currentColor); }
`;

const featureCategories = {
  'DOI/PDF import & auto-metadata': { color: '#6366f1', icon: '📥' },
  'Tagging, filters & saved views': { color: '#8b5cf6', icon: '🏷️' },
  'Review templates (gaps/strengths/limits)': { color: '#ec4899', icon: '📝' },
  'One-click structured summaries': { color: '#06b6d4', icon: '⚡' },
  'ROL table generator (Excel/Word)': { color: '#f59e0b', icon: '📊' },
  'Chapter editor with CKEditor': { color: '#10b981', icon: '✍️' },
  'Collections board (drag & drop)': { color: '#6366f1', icon: '📋' },
  'Comments & notes': { color: '#f97316', icon: '💬' },
  'Bulk actions & de-duplication': { color: '#14b8a6', icon: '⚙️' },
  'RBAC & audit trail': { color: '#ef4444', icon: '🔒' },
  'Export: CSV/Excel/Docx': { color: '#22c55e', icon: '📤' },
  'Autosave & versioning': { color: '#3b82f6', icon: '💾' }
};

export default function LeftFeatures({ height }) {
  const [idx, setIdx] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  
  const next = React.useCallback(() => setIdx(i => (i + 1) % slides.length), []);
  const prev = React.useCallback(() => setIdx(i => (i - 1 + slides.length) % slides.length), []);

  // Entrance animation
  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  // autoplay with pause on hover
  React.useEffect(() => {
    if (isPaused) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [next, isPaused]);

  const currentAccent = slides[idx].accent;

  return (
    <Box 
      sx={{ 
        pr: { md: 6 }, 
        color: 'white',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -100,
          left: -100,
          width: 400,
          height: 400,
          background: `radial-gradient(circle, ${currentAccent}22 0%, transparent 70%)`,
          borderRadius: '50%',
          animation: `${float} 8s ease-in-out infinite`,
          pointerEvents: 'none',
          transition: 'background 0.8s ease',
          filter: 'blur(40px)'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -50,
          right: -150,
          width: 500,
          height: 500,
          background: `radial-gradient(circle, ${currentAccent}15 0%, transparent 70%)`,
          borderRadius: '50%',
          animation: `${float} 10s ease-in-out infinite`,
          animationDelay: '2s',
          pointerEvents: 'none',
          transition: 'background 0.8s ease',
          filter: 'blur(60px)'
        }
      }}
    >
      {/* Header with animated gradient text */}
      <Box
        sx={{
          animation: isVisible ? `${fadeInUp} 0.8s ease-out` : 'none',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Typography 
          variant="h2" 
          sx={{ 
            fontWeight: 900, 
            mb: 1.5,
            background: `linear-gradient(135deg, #ffffff 0%, ${currentAccent} 40%, #ffffff 100%)`,
            backgroundSize: '200% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.04em',
            animation: `${shimmer} 4s linear infinite`,
            transition: 'background 0.8s ease',
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            lineHeight: 1.1,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -10,
              left: 0,
              width: 100,
              height: 5,
              background: `linear-gradient(90deg, ${currentAccent}, transparent)`,
              borderRadius: 3,
              transition: 'all 0.8s ease',
              boxShadow: `0 0 20px ${currentAccent}`
            }
          }}
        >
          KGF Scholars
        </Typography>
        
        <Typography 
          sx={{ 
            lineHeight: 1.8, 
            opacity: 0.92,
            mb: 5,
            fontSize: { xs: '1rem', md: '1.1rem' },
            maxWidth: '95%',
            fontWeight: 300,
            color: 'rgba(186, 183, 210, 0.95)'
          }}
        >
          A complete workspace for Research scholars to collect, review, and report literature—built for
          structured reviews, chapter drafting, and one-click exports.
        </Typography>
      </Box>

      {/* Enhanced Slider - properly centered between arrows */}
      <Box 
        sx={{ 
          position: 'relative',
          animation: isVisible ? `${scaleIn} 0.8s ease-out 0.2s backwards` : 'none',
          zIndex: 1,
          mb: 4
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Glow effect behind slider */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            background: `radial-gradient(ellipse, ${currentAccent}33 0%, transparent 70%)`,
            filter: 'blur(40px)',
            animation: `${pulse} 4s ease-in-out infinite`,
            pointerEvents: 'none',
            transition: 'background 0.8s ease',
            zIndex: -1
          }}
        />

        {/* Slider container with proper spacing for arrows */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Left Arrow */}
          <IconButton
            onClick={prev}
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(16px)',
              border: `2px solid ${currentAccent}55`,
              flexShrink: 0,
              width: 48,
              height: 48,
              '&:hover': { 
                bgcolor: currentAccent,
                borderColor: currentAccent,
                transform: 'scale(1.1)',
                boxShadow: `0 0 30px ${currentAccent}`,
                '& svg': {
                  animation: `${glow} 1s ease-in-out infinite`
                }
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 2
            }}
          >
            <ArrowBackIosNew sx={{ color: 'white', fontSize: '1.2rem', ml: 0.5 }} />
          </IconButton>

          {/* Slider content - centered between arrows */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              borderRadius: 4,
              boxShadow: `0 30px 90px ${currentAccent}40, 0 0 0 1px ${currentAccent}33`,
              aspectRatio: '16 / 9',
              maxHeight: { xs: 280, md: 440 },
              bgcolor: 'rgba(0,0,0,0.5)',
              position: 'relative',
              transition: 'all 0.5s ease',
              '&:hover': {
                boxShadow: `0 35px 110px ${currentAccent}55, 0 0 0 1px ${currentAccent}55`,
                transform: 'translateY(-5px)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(135deg, ${currentAccent}08 0%, transparent 50%, ${currentAccent}08 100%)`,
                pointerEvents: 'none',
                zIndex: 1,
                transition: 'opacity 0.5s ease'
              }
            }}
          >
            <Box
              sx={{
                display: 'flex',
                width: `${slides.length * 100}%`,
                height: '100%',
                transform: `translateX(-${idx * (100 / slides.length)}%)`,
                transition: 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {slides.map((s, i) => (
                <Box 
                  key={i} 
                  sx={{ 
                    width: `${100 / slides.length}%`,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 2,
                    opacity: i === idx ? 1 : 0.3,
                    transition: 'all 0.9s ease',
                    filter: i === idx ? 'none' : 'blur(3px)'
                  }}
                >
                  <Box
                    component="img"
                    src={s.img}
                    alt={s.title}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      borderRadius: 2
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right Arrow */}
          <IconButton
            onClick={next}
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(16px)',
              border: `2px solid ${currentAccent}55`,
              flexShrink: 0,
              width: 48,
              height: 48,
              '&:hover': { 
                bgcolor: currentAccent,
                borderColor: currentAccent,
                transform: 'scale(1.1)',
                boxShadow: `0 0 30px ${currentAccent}`,
                '& svg': {
                  animation: `${glow} 1s ease-in-out infinite`
                }
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 2
            }}
          >
            <ArrowForwardIos sx={{ color: 'white', fontSize: '1.2rem' }} />
          </IconButton>
        </Box>

        {/* Enhanced Caption with slide animation */}
        <Box 
          sx={{ 
            mt: 3.5,
            animation: `${fadeInUp} 0.6s ease-out`,
            position: 'relative',
            textAlign: 'center'
          }}
          key={idx}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              mb: 1,
              letterSpacing: '-0.02em',
              color: currentAccent,
              textShadow: `0 0 40px ${currentAccent}88`,
              transition: 'all 0.8s ease',
              fontSize: { xs: '1.3rem', md: '1.5rem' }
            }}
          >
            {slides[idx].title}
          </Typography>
          <Typography 
            sx={{ 
              opacity: 0.88,
              lineHeight: 1.7,
              fontSize: { xs: '0.9rem', md: '1rem' },
              fontWeight: 300,
              maxWidth: '90%',
              mx: 'auto'
            }}
          >
            {slides[idx].caption}
          </Typography>
        </Box>

        {/* Enhanced Navigation Dots */}
        <Stack 
          direction="row" 
          spacing={1.5} 
          sx={{ 
            mt: 2.5,
            justifyContent: 'center'
          }}
        >
          {slides.map((slide, i) => (
            <Box
              key={i}
              onClick={() => setIdx(i)}
              sx={{
                width: i === idx ? 36 : 12,
                height: 12,
                borderRadius: 10,
                bgcolor: i === idx ? currentAccent : 'rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: i === idx ? `0 0 20px ${currentAccent}` : 'none',
                border: i === idx ? `2px solid ${currentAccent}` : '2px solid transparent',
                '&:hover': {
                  bgcolor: i === idx ? currentAccent : 'rgba(255,255,255,0.4)',
                  transform: 'scale(1.2)',
                  boxShadow: `0 0 20px ${i === idx ? currentAccent : 'rgba(255,255,255,0.5)'}`
                }
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Feature highlights with colorful chips */}
      <Box 
        sx={{ 
          mt: 5,
          animation: isVisible ? `${fadeInUp} 0.8s ease-out 0.4s backwards` : 'none',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Typography 
          variant="subtitle2" 
          sx={{ 
            mb: 3, 
            opacity: 0.85,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: currentAccent,
            transition: 'color 0.8s ease',
            textAlign: 'center'
          }}
        >
          ✨ Powerful Features & Capabilities
        </Typography>
        <Stack 
          direction="row" 
          sx={{ 
            flexWrap: 'wrap',
            gap: 1.5,
            justifyContent: 'center'
          }}
        >
          {Object.entries(featureCategories).map(([text, { color, icon }], i) => (
            <Chip
              key={text}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                  <span>{text}</span>
                </Box>
              }
              size="small"
              sx={{ 
                bgcolor: `${color}15`,
                backdropFilter: 'blur(12px)',
                color: 'white',
                border: `1.5px solid ${color}40`,
                fontWeight: 500,
                fontSize: '0.78rem',
                py: 2.5,
                px: 1.5,
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: `${fadeInUp} 0.5s ease-out ${0.5 + i * 0.04}s backwards`,
                '&:hover': {
                  bgcolor: `${color}28`,
                  borderColor: `${color}88`,
                  transform: 'translateY(-5px) scale(1.05)',
                  boxShadow: `0 10px 25px ${color}55`,
                  '& span:first-of-type': {
                    transform: 'scale(1.4) rotate(12deg)'
                  }
                },
                '& span:first-of-type': {
                  transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'inline-block'
                }
              }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
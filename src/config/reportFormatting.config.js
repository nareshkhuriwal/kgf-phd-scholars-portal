// ---- Global Thesis Typography Settings ----
export const DOCUMENT_TYPOGRAPHY = {
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: '12pt',
  lineHeight: 1.5,
  textAlign: 'justify',
  '& p': {
    margin: 0,
    // textIndent: '0.5in', // First-line indent
  },
  '& h1': {
    fontSize: '14pt',
    fontWeight: 700,
    margin: '12pt 0 6pt',
    textIndent: 0,
  },
  '& h2': {
    fontSize: '13pt',
    fontWeight: 700,
    margin: '12pt 0 6pt',
    textIndent: 0,
  },
  '& h3': {
    fontSize: '12pt',
    fontWeight: 700,
    margin: '12pt 0 6pt',
    textIndent: 0,
  },
  '& ul, & ol': {
    paddingLeft: '0.5in',
    margin: 0,
  },
};

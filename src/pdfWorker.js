import { pdfjs } from 'react-pdf';

// Point to the ESM worker that ships with pdfjs-dist 5.4.296
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

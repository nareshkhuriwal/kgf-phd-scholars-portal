import { apiFetchBinary } from '../../services/apiBinary';

export async function fetchImageBuffer(imageUrl) {
  try {
    console.log('Fetching image for DOCX export:', imageUrl);

    const buffer = await apiFetchBinary('/editor/fetch-image', {
      method: 'POST',
      body: { url: imageUrl },
    });

    return buffer; // REAL ArrayBuffer
  } catch (err) {
    console.warn('Image skipped (DOCX export):', imageUrl, err);
    return null;
  }
}

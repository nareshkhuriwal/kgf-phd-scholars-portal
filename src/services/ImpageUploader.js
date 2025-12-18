// src/pages/reviews/EditorConfig.js
import { apiFetch } from './api.js';

// Upload adapter that uses your apiFetch helper
class EditorUploadAdapter {
  constructor(loader, paperId) {
    this.loader = loader;
    this.paperId = paperId;
  }

  upload() {
    return this.loader.file.then(async (file) => {
      const formData = new FormData();
      formData.append('upload', file);          // Laravel expects "upload"
      if (this.paperId) {
        formData.append('paper_id', this.paperId);
      }

      // apiFetch should already know BASE_URL, auth headers, etc.
      const res = await apiFetch('/editor/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include', // include cookies
        // IMPORTANT: do NOT set Content-Type; browser will set multipart boundary
      });

      const url = res?.url || res?.data?.url;
      if (!url) {
        throw new Error('Invalid upload response');
      }

      // CKEditor expects { default: 'https://...' }
      return { default: url };
    });
  }

  abort() {
    // optional – implement if you want to support aborting uploads
  }
}


export default function makeUploadPlugin(paperId) {
  return function EditorUploadPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
      return new EditorUploadAdapter(loader, paperId);
    };
  };
}


/**
 * CKEditor upload adapter
 */
class EditorUploadAdapterOld {
  constructor(loader, paperId) {
    this.loader = loader;
    this.paperId = paperId;
    this.abortController = new AbortController();
  }

  upload() {
    return this.loader.file.then(async (file) => {
      const formData = new FormData();
      formData.append('upload', file);

      if (this.paperId) {
        formData.append('paper_id', this.paperId);
      }

      // 🔐 JWT token (same token you already use)
      const token = localStorage.getItem('auth_token');

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/editor/upload-image`,
        {
          method: 'POST',
          body: formData,
          headers: {
            // Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          credentials: 'include', // include cookies
          signal: this.abortController.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Image upload failed');
      }

      const data = await response.json();

      if (!data?.url) {
        throw new Error('Upload API did not return image URL');
      }

      // ✅ CKEditor REQUIRED response shape
      return {
        default: data.url,
      };
    });
  }

  abort() {
    this.abortController.abort();
  }
}


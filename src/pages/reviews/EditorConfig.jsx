// src/pages/reviews/EditorConfig.js
import { apiFetch } from '../../services/api'; // adjust path if needed

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

// Factory to create the plugin for a specific paperId
function makeUploadPlugin(paperId) {
  return function editorUploadPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) =>
      new EditorUploadAdapter(loader, paperId);
  };
}

/**
 * Create CKEditor config for a given paper.
 * Usage: const config = makeEditorConfig(paperId);
 */
export default function makeEditorConfig(paperId) {
  return {
    toolbar: {
      items: [
        'undo', 'redo', '|',
        'heading', '|',
        'bold', 'italic', 'underline', 'strikethrough', 'link', '|',
        'bulletedList', 'numberedList', 'outdent', 'indent', '|',
        'alignment', '|',
        'blockQuote', 'imageUpload', 'insertTable', 'mediaEmbed', '|',
        'removeFormat',
      ],
    },

    alignment: {
      options: ['left', 'center', 'right', 'justify'],
    },

    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
    },

    // ⬇️ register upload plugin bound to this paperId
    extraPlugins: [makeUploadPlugin(paperId)],
  };
}

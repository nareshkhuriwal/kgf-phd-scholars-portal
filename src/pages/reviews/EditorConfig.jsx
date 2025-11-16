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


// ... EditorUploadAdapter + makeUploadPlugin stay exactly as you have them ...

export default function makeEditorConfig(paperId) {
  return {
    toolbar: {
      items: [
        'undo', 'redo', '|',
        'heading', '|',
        'bold', 'italic', 'underline', 'strikethrough', 'link', '|',

        // paragraph alignment + line spacing
        'alignment', 'lineHeight', '|',

        // lists & indent
        'bulletedList', 'numberedList', 'outdent', 'indent', '|',

        // shading / highlight
        'highlight', '|',

        // tables (incl. borders + background)
        'insertTable', 'tableProperties', 'tableCellProperties', '|',

        'blockQuote', 'imageUpload', 'mediaEmbed', '|',
        'removeFormat',
      ],
    },

    alignment: {
      options: [ 'left', 'center', 'right', 'justify' ],
    },

    // line & paragraph spacing dropdown
    lineHeight: {
      options: [ '1', '1.15', '1.5', '2', '2.5' ],
    },

    // highlight (pseudo “shading” button)
    highlight: {
      options: [
        { model: 'yellowMarker', class: 'marker-yellow', title: 'Yellow highlight', color: 'var(--ck-highlight-marker-yellow)', type: 'marker' },
        { model: 'greenMarker',  class: 'marker-green',  title: 'Green highlight',  color: 'var(--ck-highlight-marker-green)',  type: 'marker' },
        { model: 'pinkMarker',   class: 'marker-pink',   title: 'Pink highlight',   color: 'var(--ck-highlight-marker-pink)',   type: 'marker' }
      ]
    },

    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells',
        'tableProperties',
        'tableCellProperties',
      ],
    },

    extraPlugins: [makeUploadPlugin(paperId)],
  };
}

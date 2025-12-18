import { apiFetch } from '../../services/api';

/**
 * CKEditor upload adapter
 */
class EditorUploadAdapter {
  constructor(loader, paperId) {
    this.loader = loader;
    this.paperId = paperId;
    this.abortController = new AbortController();
  }

  upload() {
    return this.loader.file.then(async (file) => {
      const formData = new FormData();

      // Laravel-compatible field name
      formData.append('upload', file);

      if (this.paperId) {
        formData.append('paper_id', this.paperId);
      }

      try {
        const res = await apiFetch('/editor/upload-image', {
          method: 'POST',
          body: formData,
          signal: this.abortController.signal,
        });

        const url = res?.url || res?.data?.url;

        if (!url) {
          throw new Error('Upload API did not return image URL');
        }

        // CKEditor REQUIRED response shape
        console.log('Image uploaded:', url);
        return {
          default: url,
        };
      } catch (err) {
        console.error('Image upload failed', err);
        throw err;
      }
    });
  }

  abort() {
    this.abortController.abort();
  }
}

/**
 * Upload plugin factory (per paper)
 */
function makeUploadPlugin(paperId) {
  return function EditorUploadPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
      return new EditorUploadAdapter(loader, paperId);
    };
  };
}

/**
 * Main editor config (Decoupled Editor compatible)
 */
export default function makeEditorConfig(paperId) {
  return {
    placeholder: 'Write or review content here…',

    toolbar: {
      items: [
        'undo', 'redo',
        '|',
        'heading',
        '|',
        'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor',
        '|',
        'bold', 'italic', 'underline', 'strikethrough',
        'subscript', 'superscript',
        '|',
        'alignment',
        '|',
        'bulletedList', 'numberedList', 'todoList',
        '|',
        'outdent', 'indent',
        '|',
        'link', 'imageUpload', 'mediaEmbed',
        '|',
        'insertTable', 'blockQuote', 'codeBlock', 'horizontalLine',
        '|',
        'highlight', 'removeFormat', 'specialCharacters'
      ],
      shouldNotGroupWhenFull: true,
    },

    image: {
      toolbar: [
        'imageTextAlternative',
        'toggleImageCaption',
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side',
      ],
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

    link: {
      decorators: {
        openInNewTab: {
          mode: 'manual',
          label: 'Open in new tab',
          attributes: {
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        },
      },
    },

    extraPlugins: [makeUploadPlugin(paperId)],
  };
}

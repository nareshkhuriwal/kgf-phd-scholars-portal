
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
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
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

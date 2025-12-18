
import makeUploadPlugin from '../../services/ImpageUploader.js';

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

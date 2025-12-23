import makeUploadPlugin from '../../services/ImpageUploader.js';

/* -------------------------------------------------------
   FORCE ALL CONTENT INTO BLOCK ELEMENTS
------------------------------------------------------- */
function ForceBlockPlugin(editor) {
  const schema = editor.model.schema;

  // Disallow raw text directly under root
  schema.addChildCheck((context, childDefinition) => {
    if (context.endsWith('$root') && childDefinition.name === '$text') {
      return false;
    }
  });
}

/* -------------------------------------------------------
   NORMALIZE PASTED CONTENT (NO ROOT TEXT NODES)
------------------------------------------------------- */
function PasteBlockNormalizer(editor) {
  const clipboard = editor.plugins.get('ClipboardPipeline');

  clipboard.on('inputTransformation', (evt, data) => {
    const viewFragment = data.content;
    const children = Array.from(viewFragment.getChildren());

    children.forEach((child) => {
      if (child.is('text')) {
        const paragraph = editor.data.processor.toView('<p></p>');
        paragraph.getChild(0)._appendChild(child);
        viewFragment._removeChildren(child.index, 1);
        viewFragment._appendChild(paragraph);
      }
    });
  });
}

/* -------------------------------------------------------
   MAIN EDITOR CONFIG (DECOUPLED)
------------------------------------------------------- */
export default function makeEditorConfig(paperId) {
  return {
    placeholder: 'Write or review content here…',

    /* ---------- CRITICAL: BLOCK ENFORCEMENT ---------- */
    enterMode: 'paragraph',
    shiftEnterMode: 'paragraph',

    extraPlugins: [
      makeUploadPlugin(paperId),
      ForceBlockPlugin,
      PasteBlockNormalizer,
    ],

    /* ---------- TOOLBAR ---------- */
    toolbar: {
      items: [
        'undo', 'redo',
        '|',
        'heading',
        '|',
        'fontFamily', 'fontSize',
        '|',
        'bold', 'italic', 'underline',
        'subscript', 'superscript',
        '|',
        'alignment',
        '|',
        'bulletedList', 'numberedList',
        '|',
        'outdent', 'indent',
        '|',
        'link', 'imageUpload',
        '|',
        'insertTable',
        '|',
        'horizontalLine',
        '|',
        'removeFormat'
      ],
      shouldNotGroupWhenFull: true,
    },

    /* ---------- IMAGE ---------- */
    image: {
      toolbar: [
        'imageTextAlternative',
        'toggleImageCaption',
        'imageStyle:block',
        'imageStyle:side',
      ],
    },

    /* ---------- TABLE ---------- */
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells',
        'tableProperties',
        'tableCellProperties',
      ],
    },

    /* ---------- LINK ---------- */
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

    /* ---------- HTML SANITIZATION ---------- */
    htmlSupport: {
      allow: [
        {
          name: /^(p|h1|h2|h3|figure|img|table|thead|tbody|tr|td|th|strong|em|ul|ol|li|br)$/ ,
          attributes: true,
          classes: true,
          styles: true,
        },
      ],
    },

    /* ---------- REMOVE PROBLEMATIC FEATURES ---------- */
    removePlugins: [
      'MediaEmbed',
      'Markdown',
      'TodoList',
      'CodeBlock',
      'SpecialCharacters',
      'PasteFromOffice',
    ],
  };
}

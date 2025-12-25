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
   ALLOW SPAN ELEMENTS IN TEXT CONTENT
------------------------------------------------------- */
/* -------------------------------------------------------
   ALLOW SPAN ELEMENTS WITH CUSTOM ATTRIBUTES
------------------------------------------------------- */
/* -------------------------------------------------------
   ALLOW SPAN ELEMENTS WITH CUSTOM ATTRIBUTES
------------------------------------------------------- */
function AllowSpanPlugin(editor) {
  const schema = editor.model.schema;
  
  // Register htmlSpan as an inline text attribute (not a container)
  schema.register('htmlSpan', {
    allowWhere: '$text',
    isInline: true,
    isObject: true,
    allowContentOf: '$text',
    allowAttributes: ['dataCite', 'className', 'htmlStyle', 'htmlId'],
  });

  // Conversion from view (HTML) to model - UPCAST
  editor.conversion.for('upcast').elementToElement({
    view: {
      name: 'span',
      classes: 'citation-token'
    },
    model: (viewElement, { writer }) => {
      const dataCite = viewElement.getAttribute('data-cite') || '';
      const className = viewElement.getAttribute('class') || '';
      
      // Create text content
      const textNode = writer.createText(
        viewElement.getChild(0)?.data || '',
        {
          dataCite,
          className
        }
      );
      
      // Wrap in htmlSpan
      const span = writer.createElement('htmlSpan', {
        dataCite,
        className
      });
      
      writer.append(textNode, span);
      
      return span;
    },
    converterPriority: 'high',
  });

  // Also handle generic spans
  editor.conversion.for('upcast').elementToElement({
    view: 'span',
    model: (viewElement, { writer }) => {
      const dataCite = viewElement.getAttribute('data-cite') || '';
      const className = viewElement.getAttribute('class') || '';
      const style = viewElement.getAttribute('style') || '';
      const id = viewElement.getAttribute('id') || '';
      
      const attributes = {};
      if (dataCite) attributes.dataCite = dataCite;
      if (className) attributes.className = className;
      if (style) attributes.htmlStyle = style;
      if (id) attributes.htmlId = id;
      
      // Extract text content
      let textContent = '';
      for (const child of viewElement.getChildren()) {
        if (child.is('$text')) {
          textContent += child.data;
        }
      }
      
      const span = writer.createElement('htmlSpan', attributes);
      if (textContent) {
        writer.appendText(textContent, span);
      }
      
      return span;
    },
    converterPriority: 'normal',
  });

  // Conversion from model to view (editing) - DOWNCAST for EDITING
  editor.conversion.for('editingDowncast').elementToElement({
    model: 'htmlSpan',
    view: (modelElement, { writer }) => {
      const attributes = {};
      
      if (modelElement.hasAttribute('dataCite')) {
        attributes['data-cite'] = modelElement.getAttribute('dataCite');
      }
      if (modelElement.hasAttribute('className')) {
        attributes.class = modelElement.getAttribute('className');
      }
      if (modelElement.hasAttribute('htmlStyle')) {
        attributes.style = modelElement.getAttribute('htmlStyle');
      }
      if (modelElement.hasAttribute('htmlId')) {
        attributes.id = modelElement.getAttribute('htmlId');
      }

      return writer.createContainerElement('span', attributes);
    },
    converterPriority: 'high',
  });

  // Conversion from model to view (data/output) - DOWNCAST for DATA
  editor.conversion.for('dataDowncast').elementToElement({
    model: 'htmlSpan',
    view: (modelElement, { writer }) => {
      const attributes = {};
      
      if (modelElement.hasAttribute('dataCite')) {
        attributes['data-cite'] = modelElement.getAttribute('dataCite');
      }
      if (modelElement.hasAttribute('className')) {
        attributes.class = modelElement.getAttribute('className');
      }
      if (modelElement.hasAttribute('htmlStyle')) {
        attributes.style = modelElement.getAttribute('htmlStyle');
      }
      if (modelElement.hasAttribute('htmlId')) {
        attributes.id = modelElement.getAttribute('htmlId');
      }

      return writer.createContainerElement('span', attributes);
    },
    converterPriority: 'high',
  });
}
/* -------------------------------------------------------
   MAIN EDITOR CONFIG (DECOUPLED)
------------------------------------------------------- */
export default function makeEditorConfig(paperId, placeholder = '') {
  return {
    placeholder: placeholder || 'Write or review content here…',

    /* ---------- CRITICAL: BLOCK ENFORCEMENT ---------- */
    enterMode: 'paragraph',
    shiftEnterMode: 'paragraph',

    extraPlugins: [
      makeUploadPlugin(paperId),
      ForceBlockPlugin,
      PasteBlockNormalizer,
      AllowSpanPlugin,
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
        'link',
        'imageUpload',
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
          name: /^(p|h1|h2|h3|span|figure|img|table|thead|tbody|tr|td|th|strong|em|ul|ol|li|br)$/,
          attributes: {
            'data-cite': true,   // ✅ REQUIRED
            class: true,
            style: true,
          },
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

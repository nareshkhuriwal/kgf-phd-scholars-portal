export default class CitationPlugin {
  constructor(editor) {
    this.editor = editor;
  }

  init() {
    const editor = this.editor;

    // Register schema
    editor.model.schema.register('citation', {
      isInline: true,
      isObject: true,
      allowWhere: '$text',
      allowAttributes: ['key']
    });

    // Downcast
    editor.conversion.for('downcast').elementToElement({
      model: 'citation',
      view: (modelItem, { writer }) => {
        return writer.createContainerElement('span', {
          class: 'citation-token',
          'data-cite': modelItem.getAttribute('key')
        });
      }
    });

    // Upcast
    editor.conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        attributes: { 'data-cite': true }
      },
      model: (viewEl, { writer }) => {
        return writer.createElement('citation', {
          key: viewEl.getAttribute('data-cite')
        });
      }
    });

    // Toolbar button — PREBUILT SAFE
    editor.ui.componentFactory.add('citation', locale => {
      const button = new editor.ui.button.ButtonView(locale);

      button.set({
        label: 'Insert Citation',
        withText: true,
        tooltip: 'Insert reference'
      });

      button.on('execute', () => {
        editor.fire('openCitationPicker');
      });

      return button;
    });
  }
}

import { View } from 'backbone.marionette';
import text_tpl from '@templates/exercices/run/exercice-text.jst';

const TextView = View.extend({
  template: text_tpl,
  templateContext() {
    return {
      header: this.getOption("header"),
      subtitle: this.getOption("subtitle"),
      paragraphs: this.getOption("paragraphs"),
      footer: this.getOption("footer"),
      info: this.getOption("info"),
      warning: this.getOption("warning")
    };
  }
});

export default TextView;
import { View } from 'backbone.marionette';
import help_tpl from '@templates/exercices/run/exercice-help.jst';

const HelpView = View.extend({
  template: help_tpl,
  triggers: {
    'click .js-collapse': 'toggleCollapse'
  },
  templateContext() {
    return {
      subtitle: this.getOption("subtitle"),
      paragraphs: this.getOption("paragraphs"),
    };
  },

  onToggleCollapse() {
    const target = this.el.querySelector('div .card-body');
    if (target) {
      target.classList.toggle('show');
    }
  }
});

export default HelpView;
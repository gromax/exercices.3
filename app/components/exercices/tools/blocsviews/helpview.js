import { View } from 'backbone.marionette';
import help_tpl from '@templates/exercices/run/exercice-help.jst';

const HelpView = View.extend({
  showButton: true,
  template: help_tpl,
  triggers: {
    'click .js-collapse': 'toggleCollapse',
    'click button.js-close': 'toggleCollapse'
  },
  templateContext() {
    return {
      subtitle: this.getOption("subtitle"),
      paragraphs: this.getOption("paragraphs"),
      showButton: this.getOption("showButton")
    };
  },

  onToggleCollapse() {
    const target = this.el.querySelector('.card');
    if (target) {
      target.classList.toggle('show');
    }
    const button = this.el.querySelector('button.js-collapse');
    if (button) {
      button.classList.toggle('show');
    }
  }
});

export default HelpView;
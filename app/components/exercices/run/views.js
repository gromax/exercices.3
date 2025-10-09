import { View } from 'backbone.marionette';
import options_tpl from '@templates/exercices/run/exercice-options.jst'
import text_tpl from '@templates/exercices/run/exercice-text.jst'
import params_tpl from '@templates/exercices/run/exercice-apercu-params.jst' // pour l'aperçu des paramètres
import unknown_tpl from '@templates/exercices/run/exercice-unknown.jst'
import help_tpl from '@templates/exercices/run/exercice-help.jst'

const OptionsView = View.extend({
  template: options_tpl,
  triggers: {
    'click .js-submit': 'submit'
  },
  templateContext() {
    return {
      options: this.getOption("options"),
      selected: this.getOption("selected")
    };
  },
  onSubmit() {
    const data = {};
    this.$('select').each(function() {
      data[this.name] = this.value;
    });
    this.trigger('change', data);
  }
});

const ParamsView = View.extend({
  template: params_tpl,
  templateContext() {
    return {
      params: this.getOption("params")
    };
  }
});

const UnknownView = View.extend({
  template: unknown_tpl,
  templateContext() {
    return {
      name: this.getOption("name"),
      code: this.getOption("code")
    };
  }
});

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

export {
  OptionsView,
  ParamsView,
  TextView,
  UnknownView,
  HelpView
};
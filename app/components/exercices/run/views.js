import { View } from 'backbone.marionette';
import options_tpl from '@templates/exercices/run/exercice-options.jst'
import text_tpl from '@templates/exercices/run/exercice-text.jst'
import params_tpl from '@templates/exercices/run/exercice-apercu-params.jst' // pour l'aperçu des paramètres

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


const TextView = View.extend({
  template: text_tpl,
  templateContext() {
    return {
      header: this.getOption("params")?.header||false,
      subtitle: this.getOption("params")?.subtitle||false,
      paragraphs: this.getOption("content"),
      footer: this.getOption("footer")||false,
      info: this.getOption("params")?.info||false,
      warning: this.getOption("params")?.warning||false
    };
  }
});

export { OptionsView, ParamsView, TextView };
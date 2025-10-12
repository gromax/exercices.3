import { View } from 'backbone.marionette';
import options_tpl from '@templates/exercices/run/exercice-options.jst'
import text_tpl from '@templates/exercices/run/exercice-text.jst'
import params_tpl from '@templates/exercices/run/exercice-apercu-params.jst' // pour l'aperçu des paramètres
import unknown_tpl from '@templates/exercices/run/exercice-unknown.jst'
import help_tpl from '@templates/exercices/run/exercice-help.jst'
import radio_tpl from '@templates/exercices/run/exercice-radio.jst'
import form_tpl from '@templates/exercices/run/exercice.form.jst'

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

const RadioView = View.extend({
  template: radio_tpl,
  templateContext() {
    return {
      name: this.getOption("name"),
      items: this.getOption("items")
    };
  }
});

const FormView = View.extend({
  template: form_tpl,
  triggers: {
    'submit form': 'submit'
  },
  templateContext() {
    return {
      header: this.getOption("header")
    };
  },
  onRender() {
    const container = this.el.querySelector('.js-content');
    const subViews = this.getOption("subViews") || [];
    for (const subView of subViews) {
      container.appendChild(subView.el);
      subView.render();
    }
  },

  onSubmit() {
    const form = this.el.querySelector('form');
    const fdata = new FormData(form);
    const data = Object.fromEntries(fdata.entries());
    this.trigger('validation', data);
  }

});

export {
  OptionsView,
  ParamsView,
  TextView,
  UnknownView,
  HelpView,
  RadioView,
  FormView
};

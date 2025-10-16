import { View } from 'backbone.marionette';
import options_tpl from '@templates/exercices/run/exercice-options.jst'
import text_tpl from '@templates/exercices/run/exercice-text.jst'
import params_tpl from '@templates/exercices/run/exercice-apercu-params.jst' // pour l'aperçu des paramètres
import unknown_tpl from '@templates/exercices/run/exercice-unknown.jst'
import help_tpl from '@templates/exercices/run/exercice-help.jst'
import radio_tpl from '@templates/exercices/run/exercice-radio.jst'
import form_tpl from '@templates/exercices/run/exercice.form.jst'
import exercice_finished_tpl from '@templates/exercices/run/exercice-finished.jst'
import exercice_results_tpl from '@templates/exercices/run/exercice-results.jst'
import exercice_input_tpl from '@templates/exercices/run/exercice-input.jst'

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
      items: this.getOption("items"),
      answer: this.getOption("answer")
    };
  }
});

const InputView = View.extend({
  template: exercice_input_tpl,
  templateContext() {
    return {
      name: this.getOption("name"),
      tag: this.getOption("tag"),
      answer: this.getOption("answer")
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
    this.dataSubmit(data);
  },

  dataSubmit(data) {
    const blocParent = this.getOption("blocParent");
    if (!blocParent || typeof blocParent.validation !== 'function') {
      console.warn("Pas de validation possible, bloc parent manquant ou invalide");
      this.trigger("validation:success", data);
      return;
    }
    const errors = blocParent.validation(data);
    if (errors) {
      this.trigger("validation:error", errors);
      return;
    }
    this.trigger("validation:success", data);
  }
});

const ResultsView = View.extend({
  template: exercice_results_tpl,
  templateContext() {
    return {
      items: this.getOption("items")
    };
  }
});

const Finished_View = View.extend({
  template: exercice_finished_tpl,
  templateContext() {
    return {
      score: this.getOption("score")
    };
  }
});

export {
  OptionsView,
  ParamsView,
  TextView,
  Finished_View,
  UnknownView,
  HelpView,
  RadioView,
  FormView,
  ResultsView,
  InputView
};

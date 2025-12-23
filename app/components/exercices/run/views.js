import { View } from 'backbone.marionette';
import options_tpl from '@templates/exercices/run/exercice-options.jst'
import params_tpl from '@templates/exercices/run/exercice-apercu-params.jst' // pour l'aperçu des paramètres
import exercice_finished_tpl from '@templates/exercices/run/exercice-finished.jst'
import layout_tpl from '@templates/exercices/run/layout.jst'
import panel_eleve_tpl from '@templates/exercices/run/panel-eleve.jst'
import panel_prof_trial_tpl from '@templates/exercices/run/panel-prof-trial.jst'

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
  triggers: {
    'click .js-recycle': 'recycle'
  },
  templateContext() {
    return {
      params: this.getOption("params"),
      newButton: this.getOption("newButton")
    };
  }
});

const Finished_View = View.extend({
  template: exercice_finished_tpl,
  triggers: {
    'click .js-restart': 'restart'
  },
  templateContext() {
    return {
      score: this.getOption("score"),
      restart: this.getOption("restart") || false
    };
  }
});

const LayoutView = View.extend({
  template: layout_tpl,
  regions: {
    panel: ".js-exercice-panel",
    optionsSet: ".js-options-set",
    initParams: ".js-initparams",
    run: ".js-run"
  }
});

const PanelEleveView = View.extend({
  template: panel_eleve_tpl,
  modelEvents: {
    'change': 'render' // re-render on model change
  },
  triggers: {
    'click .js-prev': 'prev',
    'click .js-next': 'next'
  },
  templateContext() {
    return {
      total: this.getOption("total"),
    };
  }
});

const PanelProfTrialView = View.extend({
  template: panel_prof_trial_tpl,
  templateContext() {
    return {
      nom: this.getOption("nom") || 'Inconnu',
    };
  }
});

export {
  OptionsView,
  ParamsView,
  Finished_View,
  LayoutView,
  PanelEleveView,
  PanelProfTrialView
};

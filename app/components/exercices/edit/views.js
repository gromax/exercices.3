import { View } from 'backbone.marionette';
import { Form } from '../../behaviors.js';
import UseBootstrapTag from 'use-bootstrap-tag'
import exercice_edit_tpl from '@templates/exercices/edit/exercice-edit.jst'
import params_tpl from '@templates/exercices/edit/exercice-apercu-params.jst' // pour l'aperçu des paramètres
import { template } from 'underscore';

const EditExerciceView = View.extend({
  template: exercice_edit_tpl,
  behaviors: [Form],
  triggers: {
    "click .js-apercu": "form:apercu"
  },
  onRender() {
    // Initialisation du composant de gestion des tags pour les mots-clés
    UseBootstrapTag(this.el.querySelector('#exercice-keywords'));
  },
});

const ParamsView = View.extend({
  template: params_tpl,
  templateContext() {
    return {
      params: this.getOption("params")
    };
  }
});


export { EditExerciceView, ParamsView };
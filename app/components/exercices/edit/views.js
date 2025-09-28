import { View } from 'backbone.marionette';
import { Form } from '../../behaviors.js';
import UseBootstrapTag from 'use-bootstrap-tag'
import exercice_edit_tpl from '@templates/exercices/edit/exercice-edit.jst'

const EditExerciceView = View.extend({
  template: exercice_edit_tpl,
  behaviors: [Form],
  onRender() {
    // Initialisation du composant de gestion des tags pour les mots-clés
    UseBootstrapTag(this.el.querySelector('#exercice-keywords'));
  }
});

export { EditExerciceView };
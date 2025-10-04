import { View } from 'backbone.marionette';
import { Form } from '../../behaviors.js';
import UseBootstrapTag from 'use-bootstrap-tag'
import exercice_edit_tpl from '@templates/exercices/edit/exercice-edit.jst'

// test des modules
//import Algebrite from 'algebrite';
import Tools from '../tools.js';


const EditExerciceView = View.extend({
  template: exercice_edit_tpl,
  behaviors: [Form],
  triggers: {
    "click .js-tempo": "form:tempo"
  },
  onRender() {
    // Initialisation du composant de gestion des tags pour les mots-clés
    UseBootstrapTag(this.el.querySelector('#exercice-keywords'));
  },
  onFormTempo() {
    const com = this.el.querySelector("#exercice-init").value;
    try {
      const obj = Tools.initExoParams(com);
      console.log(obj);
    } catch (error) {
      console.error(error);
    } 
  }
});

export { EditExerciceView };
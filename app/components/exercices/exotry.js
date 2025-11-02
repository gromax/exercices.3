/**
 * Modèle décrivant un essai de réalisation d'un exercice
 */

import { MyModel, MyCollection } from '../common/entity.js'

const Item = MyModel.extend({
  urlRoot: "api/tryexos",
  defaults: {
    idExercice: null,
    idUser:null,
    options: {},
    init: {},
    answers: {},
    idUser: null,
    idExoDevoir: null,
    score: 0,
    finished: false
  },

  toString() {
    const id = this.get('id') ? `#${this.get('id')} :` : "";
    return `${id}`;
  },

  initialize() {
    this.on('change:intScore', this.onUpdateIntScore, this);
  },

  parse(data) {
    if (data.id) {
      data.id = Number(data.id);
    }
    data.options = JSON.parse(data.options);
    data.init = JSON.parse(data.init);
    data.answers = JSON.parse(data.answers);
    data.score = Number(data.score);
    data.finished = Boolean(data.finished);
    data.idExercice = Number(data.idExercice);
    data.idUser = Number(data.idUser);
    return data;
  },

  addAnswers(newAnswers) {
    const currentAnswers = this.get("answers") || {};
    const updatedAnswers = { ...currentAnswers, ...newAnswers };
    this.set("answers", updatedAnswers);
  },

  onUpdateIntScore() {
    const intScore = this.get("intScore") || 0;
    const scoreMax = this.get("scoreMax") || 0;
    if (scoreMax > 0) {
      const scorePercent = Math.round((intScore / scoreMax) * 100);
      this.set("score", scorePercent);
    }
  },

  isEleveTry() {
    return (this.get("idUser") !== null) && (this.get("idExoDevoir") !== null);
  },
});

const Collection = MyCollection.extend({
  model: Item,
  url: "api/tryexos",
  comparator: 'id',
});
  
export { Item, Collection }
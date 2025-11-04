/**
 * Modèle décrivant un essai de réalisation d'un exercice
 */

import { MyModel, MyCollection } from '../common/entity.js'

const Item = MyModel.extend({
  urlRoot: "api/trials",
  _needSave: false,
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
    if (data.id && /^\d+$/.test(data.id)) {
      data.id = Number(data.id);
    }
    if (data.options) {
      data.options = JSON.parse(data.options);
    }
    if (data.init) {
      data.init = JSON.parse(data.init);
    }
    if (data.answers) {
      data.answers = JSON.parse(data.answers);
    }
    data.score = Number(data.score);
    data.finished = Boolean(data.finished);
    data.idExercice = Number(data.idExercice);
    data.idUser = Number(data.idUser);
    return data;
  },

  toJSON() {
    const output = _.clone(_.pick(this.attributes, "id", "score", "idExoDevoir", "idUser"));
    output.finished = this.get("finished") ? 1 : 0;
    output.init = JSON.stringify(this.get("init") || {});
    output.answers = JSON.stringify(this.get("answers") || {});
    return output;
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

  setNeedSave() {
    this._needSave = true;
  },

  needSave() {
    return this._needSave;
  },
});

const Collection = MyCollection.extend({
  model: Item,
  url: "api/trials",
  comparator: 'id',
});
  
export { Item, Collection }
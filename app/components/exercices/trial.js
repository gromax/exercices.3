/**
 * Modèle décrivant un essai de réalisation d'un exercice
 */

import { MyModel, MyCollection } from '../common/entity.js'
import Misc from '../common/misc.js';

const Item = MyModel.extend({
  urlRoot: "api/trials",
  _needSave: false,
  defaults: {
    idExo: null,
    idUser:null,
    options: {},
    init: {},
    answers: {},
    idUser: null,
    idExoDevoir: null,
    score: 0,
    finished: false,
    idDevoir: null,
    idBDD:null
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
      data.idBDD = data.id;
    } else if (data.idBDD !== undefined){
      data.idBDD = Number(data.idBDD);
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
    data.finished = Misc.parseBoolean(data.finished);
    data.idExo = Number(data.idExo);
    if (data.idDevoir !== undefined) {
      data.idDevoir = Number(data.idDevoir);
    }
    data.idUser = Number(data.idUser);
    return data;
  },

  toJSON() {
    const output = _.clone(_.pick(this.attributes, "score", "idExoDevoir", "idUser"));
    output.id = this.get("idBDD");
    output.finished = this.get("finished") ? 1 : 0;
    const initValue = this.get("init") || {};
    Object.keys(initValue).forEach(key => {
        initValue[key] = String(initValue[key]);
    });
    output.init = JSON.stringify(initValue);
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

  resetNeedSave() {
    this._needSave = false;
  },

  needSave() {
    return this._needSave;
  },

  url() {
    const base = _.result(this, 'urlRoot') || (this.collection && this.collection.url) || '';
    // si pas d'id, POST vers base
    const idForUrl = this.get('idBDD') || this.id; // ou autre champ
    return idForUrl ? `${base}/${encodeURIComponent(idForUrl)}` : base;
  }
});

const Collection = MyCollection.extend({
  model: Item,
  url: "api/trials",
  comparator: 'id',
});
  
export { Item, Collection }
import { MyModel, MyCollection } from '../common/entity.js';
import Misc from '../common/misc.js';

const Item = MyModel.extend ({
  urlRoot: "api/devoirs",

  defaults: {
    nomOwner: "",
    idOwner: null,
    idClasse: null,
    nomClasse: "",
    nom: "",
    description: "",
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    timeleft:null,
    actif: true,
  },

  toString() {
    const id = this.get('id') ? `#${this.get('id')} :` : "";
    return `${id} ${this.get("nom")} ${this.get("description")}`;
  },

  toJSON() {
    return _.pick(this.attributes, 'id', 'idOwner', 'idClasse', 'nom', 'description', 'dateDebut', 'dateFin');
  },

  parse(data) {
    if (data.id) data.id = Number(data.id);
    const timeToEnd = Misc.computeTimeFromNowToDate(data.dateFin, true);
    const timeToBegin = Misc.computeTimeFromNowToDate(data.dateDebut, false);
    data.notStarted = (timeToBegin > 0);
    data.notEnded = (timeToEnd > 0);
    data.timeleft = Misc.computeTimeLeft(data.dateDebut, data.dateFin);
    data.actif = (data.timeleft !== null);
    data.idOwner = Number(data.idOwner);
    data.idClasse = Number(data.idClasse);
    data.dateDebutFr = Misc.formatDateFrench(data.dateDebut);
    data.dateFinFr = Misc.formatDateFrench(data.dateFin);
    return data;
  },

  clone() {
    const token = localStorage.getItem('jwt');
    return $.ajax(`api/devoirs/clone/${this.get("id")}`, {
      method:'POST',
      dataType:'json',
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    });
  },

  validate(attrs, options) {
    const errors = {};
    if (!attrs.nom) {
      errors.nom = "Ne doit pas être vide";
    } else {
      if (attrs.nom.length < 2) {
        errors.nom = "Trop court";
      }
    }
    if (!attrs.dateDebut) {
      errors.dateDebut = "Ne doit pas être vide";
    }
    if (!attrs.dateFin) {
      errors.dateFin = "Ne doit pas être vide";
    }
    if (attrs.dateDebut && attrs.dateFin && attrs.dateDebut > attrs.dateFin) {
      errors.dateFin = "La date de fin doit être postérieure à la date de début";
    }

    if (!_.isEmpty(errors)) {
      return errors;
    }
  },

});

const Collection = MyCollection.extend({
  url: "api/devoirs",
  model: Item,
  comparator: "nom",
});

export { Item, Collection };
import { MyModel, MyCollection } from '../common/entity.js';
import Misc from '../common/misc.js';

const Item = MyModel.extend ({
  urlRoot: "api/devoirs",

  defaults: {
    nomOwner: "",
    idOwner: null,
    nom: "",
    description: "",
    dateDebut: "2000-01-01",
    dateFin: "2000-02-01",
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
    data.timeleft = Misc.computeTimeLeft(data.dateDebut, data.dateFin);
    data.actif = (data.timeleft !== null);
    data.idOwner = Number(data.idOwner);
    return data;
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
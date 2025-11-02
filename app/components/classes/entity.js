import { MyModel, MyCollection } from "../common/entity";

const d = new Date();
const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const Item = MyModel.extend ({
  urlRoot: "api/classes",
  defaults: {
    nomOwner: "",
    idOwner:"",
    nom: "",
    description: "",
    ouverte: false,
    pwd:"",
    expiration: today,
    date: today
  },

  toString() {
    const id = this.get('id') ? `#${this.get('id')} :` : "";
    return `${id} ${this.get("nom")}`;
  },
  
  parse(data) {
    if (typeof data.ouverte === "string") {
      data.ouverte = (Number(data.ouverte) === 1);
    }
    data.idOwner = Number(data.idOwner);
    return data;
  },

  validate(attrs, options) {
    const errors = {};
    if (!attrs.nom) {
      errors.nom = "Ne doit pas être vide";
    } else {
      /*if (attrs.nom.length < 3) {
        errors.nom = "Trop court";
      }*/
    }
    if (!attrs.expiration) {
      errors.expiration = "Ne doit pas être vide";
    }
    if (!_.isEmpty(errors)) {
      return errors;
    }
  },

  testClasseMdp(mdp) {
    const promise = $.ajax(`api/classes/${this.get('idClasse')}/test`, {
      data: {
        pwd: mdp
      },
      dataType: "json",
      method: "GET"
    });
    return promise;
  },
});

const Collection = MyCollection.extend({
  url: "api/classes",
  model: Item,
  comparator: "nom",
});

export { Collection, Item }

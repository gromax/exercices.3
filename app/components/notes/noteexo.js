import { MyModel, MyCollection } from "../common/entity";

const Item = MyModel.extend ({
  urlRoot: "api/notesexos",
  readOnly: true,

  defaults: {
    idExo:null,
    title: "",
    idDevoir: null,
    description: "",
    options: "",
    idOwner: 0,
    idClasse: 0,
    num: 0,
    idUser: null,
    nomUser: "",
    prenomUser: "",
    note: 0,
    trialsNumber: 0
  },

  toString() {
    const id = this.get('id') ? `#${this.get('id')} :` : "";
    return `${id} ${this.get("title")}`;
  },

  parse(data) {
    data.idUser = Number(data.idUser);
    data.idExo = Number(data.idExo);
    data.idExoDevoir = Number(data.idExoDevoir);
    data.idDevoir = Number(data.idDevoir);
    data.note = Number(data.note);
    data.trialsNumber = Number(data.trialsNumber);
    data.num = Number(data.num);
    data.idOwner = Number(data.idOwner);
    data.idClasse = Number(data.idClasse);
    data.options = JSON.parse(data.options);
    return data;
  },
});

const Collection = MyCollection.extend({
  url: "api/notesexos",
  model: Item,
});

export { Item, Collection };
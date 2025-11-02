import { MyModel, MyCollection } from "../common/entity";

const Item = MyModel.extend({
  urlRoot: "api/exercices",
  defaults: {
    title: "Titre de l'exercice",
    description: "Description de l'exercice",
    keywords: "",
    options: "",
    code: "",
    init: ""
  },

  toString() {
    const id = this.get('id') ? `#${this.get('id')} :` : "";
    return `${id} ${this.get("title")}`;
  },

  parse(data) {
    if (data.id) {
      data.id = Number(data.id);
    }
    data.options = data.options || "";
    data.keywords = data.keywords || "";
    data.init = data.init || "";
    data.code = data.code || "";
    return data;
  },
});


const Collection = MyCollection.extend({
  url: "api/exercices",
  model: Item,
  comparator: "title"
});

export { Item, Collection }

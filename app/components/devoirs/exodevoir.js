import { MyModel, MyCollection } from "../common/entity";

const Item = MyModel.extend ({
  urlRoot: "api/exodevoirs",

  defaults: {
    idDevoir: "",
    idExo: "",
    title: "",
    description: "",
    options: "",
    idOwner: 0,
    idClasse: 0,
    num: 0
  },

  toString() {
    const id = this.get('id') ? `#${this.get('id')} :` : "";
    return `${id} ${this.get("title")}`;
  },

  moveUp(collection) {
    const currentId = this.get("id");
    if (collection.length <= 1) return; // un seul élément
    if (this.get('num') <= 0) return; // déjà en haut
    const currentNum = this.get('num');
    const nums = collection.pluck('num').filter(n => n < currentNum);
    if (nums.length === 0) return; // déjà en haut
    const nextNum = Math.max(...nums);
    this.set('num', nextNum);
    const defer = $.Deferred();
    const saving = this.save();
    $.when(saving).done(() => {
      collection.each((m) => {
        const n = m.get('num');
        if ((n >= nextNum) && (n < currentNum) &&(m.get("id") !== currentId)) {
          m.set('num', n+1);
        };
      });
      collection.sort();
      defer.resolve();
    }).fail((response) => {
      this.set('num', currentNum); // revert
      defer.reject(response);
    });
    return defer.promise();
  },

  moveDown(collection) {
    const currentId = this.get("id");
    if (collection.length <= 1) return; // un seul élément
    const currentNum = this.get('num');
    const nums = collection.pluck('num').filter(n => n > currentNum);
    if (nums.length === 0) return; // déjà en haut
    const nextNum = Math.min(...nums);
    this.set('num', nextNum);
    const defer = $.Deferred();
    const saving = this.save();
    $.when(saving).done(() => {
      collection.each((m) => {
        const n = m.get('num');
        if ((n <= nextNum) && (n > currentNum) && (m.get("id") !== currentId)) {
          m.set('num', n-1);
        };
      });
      collection.sort();
      defer.resolve();
    }).fail((response) => {
      this.set('num', currentNum); // revert
      defer.reject(response);
    });
    return defer.promise();
  },

  parse(data) {
    if (data.id) data.id = Number(data.id);
    data.idExo = Number(data.idExo);
    data.idDevoir = Number(data.idDevoir);
    data.num = Number(data.num);
    data.idOwner = Number(data.idOwner);
    data.idClasse = Number(data.idClasse);
    data.options = JSON.parse(data.options);
    return data;
  },

  toJSON() {
    const data = _.pick(this.attributes, 'id', 'idDevoir', 'idExo', 'options', 'num');
    data.options = JSON.stringify(data.options);
    return data;
  },
});

const Collection = MyCollection.extend({
  url: "api/exodevoirs",
  model: Item,
});

export { Item, Collection };
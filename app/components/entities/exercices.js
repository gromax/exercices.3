import Radio from "backbone.radio"
import Catalog from "@entities/exercices_catalog.js"

const Item = Backbone.Model.extend({
  defaults: {
    title: "Titre de l'exercice",
    description: "Description de l'exercice",
    keywords: "",
    options: {}
  }
});

const Collection = Backbone.Collection.extend({
  model: Item
});

const API = {
  getEntities: () => {
    return new Collection( require("@entities/exercices_catalog.js").catalog.all() );
  }
};

const channel = Radio.channel('entities');
channel.reply('exercices:entities', API.getEntities);


export { Item, Collection }

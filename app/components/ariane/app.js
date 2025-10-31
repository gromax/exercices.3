import { MnObject } from 'backbone.marionette';
import { Region } from 'backbone.marionette'
import { ArianeView } from "./view.js";

const ArianeItem = Backbone.Model.extend({
  defaults: {
    text: "",
    link: "",
    active: false,
    fragile: false
  }
});

const ArianeCollection = Backbone.Collection.extend({
  model:ArianeItem
});

const home = {
  text: "<i class='fa fa-home'></i>",
  link: "home",
  active: false,
  fragile: false
}

const collection = new ArianeCollection([ home ]); // comme on ne parse pas ici, le active restera false

const ArianeApp = MnObject.extend({
  channelName: "app",
  radioEvents: {
    'ariane:reset': 'reset',
    'ariane:push': 'push',
  },

  reset(data) {
    if (!Array.isArray(data)) {
      data = [];
    }
    data.unshift(home)
    _.each(data, function(item) {
      item.active = true;
    });
    _.last(data).active = false;
    collection.reset(data);
  },

  show() {
    const channel = this.getChannel();
    const view = new ArianeView({ collection: collection });
    view.on("navigation", function(event_name, data) {
      channel.trigger(event_name, data);
    });
    new Region({ el: '#ariane' }).show(view);
  },

  purgeFragile() {
    const toRemove = collection.filter(m => m.get('fragile') === true);
    if (toRemove.length) {
      collection.remove(toRemove);
    }
  },

  push(linkData) {
    const model = new ArianeItem(linkData);
    this.purgeFragile();
    const existing = collection.findWhere({ link: model.get("link") });
    if (existing) {
      const idx = collection.indexOf(existing);
      if (idx !== -1 && idx < collection.length -1) {
        collection.remove(collection.models.slice(idx));
      }
      collection.add(model);
      model.set("active", false);
    } else {
      const lastModel = collection.last();
      if (lastModel) {
        lastModel.set("active", true);
      }
      collection.add(model);
      model.set("active", false);
    }
  }
});

export const arianeApp = new ArianeApp();


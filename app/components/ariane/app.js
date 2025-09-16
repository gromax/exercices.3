import { MnObject } from 'backbone.marionette';
import { Region } from 'backbone.marionette'
import { ArianeView } from "./view.js";
import { arianeController } from './entity.js';

const ArianeApp = MnObject.extend({
  channelName: "app",
  radioEvents: {
    'ariane:reset': 'onReset',
    'ariane:add': 'add'
  },

  onReset(data) {
    if (!Array.isArray(data)) {
      data = [];
    }
    arianeController.reset(data);
  },

  show() {
    const channel = this.getChannel();
    const view = new ArianeView({ collection: arianeController.collection });
    view.on("navigation", function(event_name, data) {
      channel.trigger(event_name, data);
    });
    new Region({ el: '#ariane-region' }).show(view);
  },

  add(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    arianeController.add(data);
  }

});

export const arianeApp = new ArianeApp();


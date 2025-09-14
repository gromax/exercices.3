import { MnObject } from 'backbone.marionette';
import { ArianeView } from "@apps/ariane/ariane_view.js";
import { Region } from 'backbone.marionette'
import { arianeController } from '@entities/ariane.js';

const ArianeApp = MnObject.extend({
  channelName: "app",
  radioEvents: {
    'ariane:reset': 'onReset'
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
  }
});

export const arianeApp = new ArianeApp();


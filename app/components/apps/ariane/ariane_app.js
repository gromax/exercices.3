import Radio from 'backbone.radio';
import { MnObject } from 'backbone.marionette';
import { ArianeView } from "@apps/ariane/ariane_view.js";
import { Region } from 'backbone.marionette'
import { arianeController } from '@entities/ariane.js';

const navigationChannel = Radio.channel('navigation');

const ArianeApp = MnObject.extend({
  channelName: "ariane",
  radioEvents: {
    'show': 'onShow',
    'reset': 'onReset'
  },

  onReset(data) {
    if (!Array.isArray(data)) {
      data = [];
    }
    arianeController.reset(data);
  },

  onShow() {
    const view = new ArianeView({ collection: arianeController.collection });
    view.on("navigation", function(event_name, data) {
      navigationChannel.trigger(event_name, data);
    });
    new Region({ el: '#ariane-region' }).show(view);
  },

  show() {
    this.onShow();
  }
});

export const arianeApp = new ArianeApp();


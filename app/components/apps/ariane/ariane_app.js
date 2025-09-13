import { MnObject } from 'backbone.marionette';

const ArianeApp = MnObject.extend({
  channelName: "ariane",
  radioEvents: {
    'show': 'onShow',
    'reset': 'onReset'
  },

  initialize() {
    this.Ariane = require("@entities/ariane.js").ArianeController;
  },

  onReset(data) {
    if (!Array.isArray(data)) {
      data = [];
    }
    this.Ariane.reset(data);
  },

  onShow() {
    require("@apps/ariane/show/ariane_show_controller.js").controller.showAriane();
  },

  show() {
    this.onShow();
  }
});

export const arianeApp = new ArianeApp();


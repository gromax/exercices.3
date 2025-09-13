import { MnObject, Region } from 'backbone.marionette';
import { AlertView } from '@apps/common/common_views.js'

const mainRegion = new Region({
  el: '#main-region'
});

const Controller = MnObject.extend({
  channelName: "navigation",
  radioEvents: {
    "not:found": "notFound"
  },
  notFound() {
    const view = new AlertView({
      message: "Page introuvable",
      dismiss: false
    });
    mainRegion.show(view);
  },
});

new Controller();
import { MnObject } from 'backbone.marionette'
import { TrialsCollectionView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',
  showList(trials) {
    const channel = this.getChannel();

    const view = new TrialsCollectionView({
      collection: trials,
    });
    channel.request("region:main").show(view);

    view.on("item:trial:show", (childView) => {
        const model = childView.model;
        channel.trigger("trial:run", model.get("id"), model.get("idExoDevoir"), model.get("idExo"), model.get("idDevoir"), model.get("idUser"));
    });

  }
});

export const controller = new Controller();
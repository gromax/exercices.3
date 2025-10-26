import { MnObject, Region } from 'backbone.marionette';
import { ShowDevoirView, AssosExoDevoirCollectionView, LayoutView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',
  show(id, devoir, assosExos) {
    const channel = this.getChannel();
    if (devoir === undefined) {
      channel.trigger("ariane:reset", [
        { text: "Devoirs", link: "devoirs" },
        { text: "Devoir inconnu", link: `devoir:${id}` }
      ]);
      channel.trigger("missing:item");
      return;
    }
    
    channel.trigger("ariane:reset", [
      { text: "Devoirs", link: "devoirs" },
      { text: devoir.get("nom"), link: `devoir:${id}` }
    ]);
    
    const view = new ShowDevoirView({
      model: devoir
    });
    
    const assosExosView = new AssosExoDevoirCollectionView({
      collection: assosExos
    });

    const layout = new LayoutView();
    new Region({ el: '#main-region' }).show(layout);

    layout.showChildView('devoirRegion', view);
    layout.showChildView('assocsRegion', assosExosView);
  }
});

export const controller = new Controller();

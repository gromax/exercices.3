import { MnObject, Region } from 'backbone.marionette'
import { NotesExosCollectionView, PanelView, LayoutView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',
  showNotesExosListForDevoirUser(note, collecNotesExo, user) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const layoutView = new LayoutView();
    channel.request("region:main").show(layoutView);
    const panelView = new PanelView({
      model: note,
      nomComplet: user.get('nomComplet'),
    });
    layoutView.getRegion('panelRegion').show(panelView);

    const notesView = new NotesExosCollectionView({
      collection: collecNotesExo,
    });
    if (logged.isEleve()) {
      notesView.on("item:show", (childView) => {
        const model = childView.model;
        channel.trigger(
          "exodevoir:run",
          model.get("idExoDevoir"),
          model.get("idExo"),
          model.get("idDevoir"),
          logged.get("id")
        );
      });
    }
    layoutView.getRegion('itemsRegion').show(notesView);
  }
});

export const controller = new Controller();
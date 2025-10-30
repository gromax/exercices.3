import { MnObject, Region } from 'backbone.marionette'
import { NotesExosCollectionView, PanelView, LayoutView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',
  showNotesExosListForDevoirUser(idDevoir, idUser, devoir, collecNotesExo, user) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");

    if (user.get('id') !== logged.get('id')) {
      channel.trigger("ariane:reset", [
      { text: "Devoirs", link: "#devoirs" },
      { text: `Devoir : ${devoir.get('nom')}`, link: `#devoir:${idDevoir}` },
      { text: "Notes", link: `#devoir:${idDevoir}/notes` },
      { text: user.get('nomComplet'), link: `#devoir:${idDevoir}/notes/user:${idUser}` }
    ]);
    } else {
      channel.trigger("ariane:reset", [
        { text: devoir.get("nom"), link: `#mynotes:${idDevoir}` }
      ]);
    }

    const layoutView = new LayoutView();
    new Region({ el: '#main-region' }).show(layoutView);
    const panelView = new PanelView({
      model: devoir,
      nomComplet: user.get('nomComplet'),
    });
    layoutView.getRegion('panelRegion').show(panelView);

    const notesView = new NotesExosCollectionView({
      collection: collecNotesExo,
    });
    layoutView.getRegion('itemsRegion').show(notesView);
  }
});

export const controller = new Controller();
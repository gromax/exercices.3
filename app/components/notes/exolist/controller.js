import { MnObject, Region } from 'backbone.marionette'
import { NotesExosCollectionView, PanelView, LayoutView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',
  showNotesExosListForDevoirUser(note, collecNotesExo, user) {
    const channel = this.getChannel();
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
    layoutView.getRegion('itemsRegion').show(notesView);
  }
});

export const controller = new Controller();
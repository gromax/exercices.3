import { MnObject, Region } from 'backbone.marionette'
import { NotesCollectionView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',
  showNotesListForDevoir(idDevoir, devoir, collecNotes) {
    const channel = this.getChannel();
    channel.trigger("ariane:reset", [
      { text: "Devoirs", link: "#devoirs" },
      { text: `Devoir : ${devoir.get('nom')}`, link: `#devoir:${idDevoir}` },
      { text: "Notes", link: `#devoir:${idDevoir}/notes` }
    ])
    const notesView = new NotesCollectionView({
      collection: collecNotes,
      showId: true,
      showUser: true,
      showDevoir: false,
      showNomOwner: false,
      showTimeLeft: false
    });
    new Region({ el: '#main-region' }).show(notesView);
  }
});

export const controller = new Controller();
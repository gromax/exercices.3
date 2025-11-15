import { MnObject } from 'backbone.marionette'
import { NotesCollectionView, NotesCollectionViewForEleve } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',
  showNotesListForDevoir(devoir, collecNotes) {
    const channel = this.getChannel();

    const notesView = new NotesCollectionView({
      ncols: 2,
      collection: collecNotes,
      showUser: true,
      showDevoir: false,
      showNomOwner: false,
      showTimeLeft: false
    });
    notesView.on("item:show", (childView) => {
      const model = childView.model;
      const idDevoir = model.get('idDevoir');
      const idUser = model.get('idUser');
      channel.trigger("notes:devoir:user:show", idDevoir, idUser);
    });
    channel.request("region:main").show(notesView);
  },

  showNotesListForEleve(eleve, collecNotes) {
    // il manque clairement un panel
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    
    const notesView = new NotesCollectionViewForEleve({
      collection: collecNotes,
    });
    notesView.on("item:show", (childView) => {
      const model = childView.model;
      const idDevoir = model.get('idDevoir');
      const idUser = model.get('idUser');
      if (logged.id === idUser) {
        // si utilisateur est user alors se sont ses notes et c'est le home
        channel.trigger("notes:my:devoir", idDevoir);
      } else {
        channel.trigger("popup:alert", "À réfléchir. Pb de navigation ?");
      }
    });
    channel.request("region:main").show(notesView);
  }

});

export const controller = new Controller();
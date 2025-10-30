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
    new Region({ el: '#main-region' }).show(notesView);
  },

  showNotesListForEleve(idUser, eleve, collecNotes) {
    // il manque clairement un panel
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    
    if (logged.id === idUser) {
      // si utilisateur est user alors se sont ses notes et c'est le home
      channel.trigger("ariane:reset", []);
    } else {
      channel.trigger("ariane:reset", [
        { text: "users", link: "#users" },
        { text: `Élève : ${eleve.get('nomComplet')} ${eleve.get('prenom')}`, link: `#user:${idUser}` },
        { text: "Notes", link: `#user:${idUser}/notes` }
      ]);
    }
    const notesView = new NotesCollectionView({
      ncols: 4,
      collection: collecNotes,
      showUser: false,
      showDevoir: true,
      showNomOwner: false,
      showTimeLeft: true
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
    new Region({ el: '#main-region' }).show(notesView);
  }

});

export const controller = new Controller();
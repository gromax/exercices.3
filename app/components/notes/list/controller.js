import { MnObject } from 'backbone.marionette'
import { NotesCollectionView, NotesCollectionViewForEleve, PanelDevoirView } from './views.js';
import { LayoutView } from '../../common/views.js';

const Controller = MnObject.extend({
  channelName: 'app',
  showNotesListForDevoir(devoir, collecNotes) {
    if (!devoir) {
      console.warn("Controller NotesList: devoir est requis.");
      return;
    }
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const layout = new LayoutView();
    const panelView = new PanelDevoirView({
      model: devoir,
      showOwner: logged.isAdmin(),
    });

    const notesView = new NotesCollectionView({
      collection: collecNotes,
    });
    notesView.on("item:show", (childView) => {
      const model = childView.model;
      const idDevoir = model.get('idDevoir');
      const idUser = model.get('idUser');
      channel.trigger("notes:devoir:user:show", idDevoir, idUser);
    });

    layout.on("render", () => {
      layout.showChildView('panelRegion', panelView);
      layout.showChildView('contentRegion', notesView);
    });
    channel.request("region:main").show(layout);
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
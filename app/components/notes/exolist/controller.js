import { MnObject } from 'backbone.marionette'
import { NotesExosCollectionView, PanelView } from './views.js';
import { LayoutView } from '../../common/views.js';
import renderTexInDomElement from '../../common/rendertex';

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
      modeEleve: logged.isEleve(),
    });
    layoutView.getRegion('panelRegion').show(panelView);

    const notesView = new NotesExosCollectionView({
      collection: collecNotesExo,
      modeProf: logged.isProf() || logged.isAdmin(),
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
    } else {
      notesView.on("item:show", (childView) => {
        const model = childView.model;
        channel.trigger("trials:show", model.get("idUser"), model.get("idExoDevoir"));
      });
    }
    layoutView.getRegion('contentRegion').show(notesView);
    renderTexInDomElement(layoutView.el);
  }
});

export const controller = new Controller();
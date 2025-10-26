import { MnObject, Region } from 'backbone.marionette';
import { ShowDevoirView, AssosExoDevoirCollectionView, LayoutView } from './views.js';

const Controller = MnObject.extend({
  channelName: 'app',
  
  /**
   * Helper pour les fonctions
   * affiche la description et la liste des exercices
   * sur la gauche et prévoit une place sur la droite
   * pour l'ajout ou le paramétrage des exercices.
   */
  showLayoutView(devoir, assosExos) {
    const view = new ShowDevoirView({
      model: devoir
    });
    
    const assosExosView = new AssosExoDevoirCollectionView({
      collection: assosExos
    });

    const layout = new LayoutView({id:devoir.get('id')});
    new Region({ el: '#main-region' }).show(layout);

    layout.showChildView('devoirRegion', view);
    layout.showChildView('assocsRegion', assosExosView);

  },
  
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

    this.showLayoutView(devoir, assosExos);
  },

  showAddExo(id, devoir, assosExos, sujetsexercices, criterion) {
    const channel = this.getChannel();
    if (devoir === undefined) {
      channel.trigger("ariane:reset", [
        { text: "Devoirs", link: "devoirs" },
        { text: "Devoir inconnu", link: `devoir:${id}/addexo` }
      ]);
      channel.trigger("missing:item");
      return;
    }
    channel.trigger("ariane:reset", [
      { text: "Devoirs", link: "devoirs" },
      { text: devoir.get("nom"), link: `devoir:${id}` },
      { text: "Ajouter des exercices", link: `devoir:${id}/addexo` },
    ]);

    this.showLayoutView(devoir, assosExos);

    // ensuite j'ajoute la liste des sujets d'exercices à droite

    const { listExercicesView } = require('../../exercices/list/controller.js').controller.makeView(
      sujetsexercices,
      criterion,
      ".js-exercices"
    );
    listExercicesView.on("item:sujet:exercice:show", (childView) => {
      console.log("addexo", id, childView.model.get("id"));
      channel.trigger("devoir:addexo", { idDevoir:id, idExercice:childView.model.get("id") });
    });

  }
});

export const controller = new Controller();

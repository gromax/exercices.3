import { MnObject, Region } from 'backbone.marionette';
import { ShowDevoirView, AssosExoDevoirCollectionView, LayoutView } from './views.js';
import { TwoColsView } from '../../common/views.js';

const Controller = MnObject.extend({
  channelName: 'app',
  radioEvents: {
    'devoir:addexo': 'addExo',
  },
  
  /**
   * Helper pour les fonctions
   * affiche la description et la liste des exercices
   * sur la gauche et prévoit une place sur la droite
   * pour l'ajout ou le paramétrage des exercices.
   */
  showLayoutView(devoir, assosExos, region) {
    const view = new ShowDevoirView({
      model: devoir
    });
    
    const assosExosView = new AssosExoDevoirCollectionView({
      collection: assosExos
    });

    const devoirLayout = new LayoutView({id:devoir.get('id')});
    region.show(devoirLayout);
    devoirLayout.showChildView('devoirRegion', view);
    devoirLayout.showChildView('assocsRegion', assosExosView);
    return { devoirLayout, view, assosExosView };
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
      { text: devoir.get("nom"), link: `devoir:${id}` },
      { text: "Dashboard", link: `devoir:${id}/params` },
    ]);
    const region = new Region({ el: '#main-region' });
    this.showLayoutView(devoir, assosExos, region);
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
      { text: "Dashboard", link: `devoir:${id}/params` },
      { text: "Ajouter des exercices", link: `devoir:${id}/addexo` },
    ]);

    const twocolsLayout = new TwoColsView();
    new Region({ el: '#main-region' }).show(twocolsLayout);
    const { assosExosView } = this.showLayoutView(devoir, assosExos, twocolsLayout.getRegion('left'));

    // ensuite j'ajoute la liste des sujets d'exercices à droite

    const { listExercicesView } = require('../../exercices/list/controller.js').controller.makeView(
      sujetsexercices,
      criterion,
      twocolsLayout.getRegion('right')
    );
    listExercicesView.on("item:sujet:exercice:show", (childView) => {
      channel.trigger("devoir:addexo", id, childView.model.get("id"), assosExosView);
    });
  },

  addExo( idDevoir, idExercice, assosExosView ) {
    const channel = this.getChannel();
    const ExoDevoir = require('../exodevoir.js').Item;
    const exoDevoir = new ExoDevoir({
      idDevoir: idDevoir,
      idExo: idExercice
    });
    const saving = exoDevoir.save();
    channel.trigger("loading:up");
    $.when(saving).done(() => {
      channel.trigger("data:collection:additem", "exodevoirs", exoDevoir);
      assosExosView.collection.add(exoDevoir);
    }).fail((response) => {
      console.warn("Erreur ajout exercice au devoir", response.responseJSON);
      channel.trigger("popup:error", "Erreur inconnue lors de l'ajout de l'exercice au devoir.");
    }).always(() => {
      channel.trigger("loading:down");
    });
  },
});

export const controller = new Controller();

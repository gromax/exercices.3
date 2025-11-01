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
    const radio = this.getChannel();
    const view = new ShowDevoirView({
      model: devoir
    });

    assosExos.comparator = 'num';
    assosExos.sort();

    const assosExosView = new AssosExoDevoirCollectionView({
      collection: assosExos
    });

    const devoirLayout = new LayoutView({id:devoir.get('id')});
    region.show(devoirLayout);
    devoirLayout.showChildView('devoirRegion', view);
    devoirLayout.showChildView('assocsRegion', assosExosView);

    assosExosView.on("item:up", (childView) => {
      const model = childView.model;
      const update = model.moveUp(assosExos);
      if (!update) return;
      radio.trigger("loading:up");
      $.when(update).fail((response) => {
        console.warn("Erreur déplacement exercice dans le devoir", response.responseJSON);
        radio.trigger("popup:error", "Erreur inconnue lors du déplacement de l'exercice dans le devoir.");
      }).always(() => {
        radio.trigger("loading:down");
      });
    });

    assosExosView.on("item:down", (childView) => {
      const model = childView.model;
      const update = model.moveDown(assosExos);
      if (!update) return;
      radio.trigger("loading:up");
      $.when(update).fail((response) => {
        console.warn("Erreur déplacement exercice dans le devoir", response.responseJSON);
        radio.trigger("popup:error", "Erreur inconnue lors du déplacement de l'exercice dans le devoir.");
      }).always(() => {
        radio.trigger("loading:down");
      });
    });

    return { devoirLayout, view, assosExosView };
  },
  
  show(devoir, assosExos) {
    const channel = this.getChannel();
    if (!devoir) {
      channel.trigger("popup:error", "Devoir indéfini.");
      return;
    }
    
    this.showLayoutView(devoir, assosExos, channel.request("region:main"));
  },

  showAddExo(devoir, assosExos, sujetsexercices, criterion) {
    const channel = this.getChannel();
    if (!devoir) {
      channel.trigger("popup:error", "Devoir indéfini.");
      return;
    }

    const twocolsLayout = new TwoColsView();
    channel.request("region:main").show(twocolsLayout);
    const { assosExosView } = this.showLayoutView(devoir, assosExos, twocolsLayout.getRegion('left'));

    // ensuite j'ajoute la liste des sujets d'exercices à droite

    const { listExercicesView } = require('../../exercices/list/controller.js').controller.makeView(
      sujetsexercices,
      criterion,
      twocolsLayout.getRegion('right')
    );
    listExercicesView.on("item:sujet:exercice:show", (childView) => {
      channel.trigger("devoir:addexo", devoir.id, childView.model.get("id"), assosExosView);
    });
  },

  addExo( idDevoir, idExercice, assosExosView ) {
    const channel = this.getChannel();
    const nums = assosExosView.collection.pluck('num');
    const nextNum = nums.length === 0 ? 1 : (Math.max(...nums) + 1);
    const ExoDevoir = require('../exodevoir.js').Item;
    const exoDevoir = new ExoDevoir({
      idDevoir: idDevoir,
      idExo: idExercice,
      num: nextNum,
      options: {}
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

  showExo(devoir, assosExos, exoDevoir, sujet) {
    const channel = this.getChannel();
    if (!devoir || !exoDevoir || !sujet) {
      channel.trigger("popup:error", "Un ou plusieurs éléments sont manquants.");
      return;
    }

    const twocolsLayout = new TwoColsView();
    channel.request("region:main").show(twocolsLayout);
    const { assosExosView } = this.showLayoutView(devoir, assosExos, twocolsLayout.getRegion('left'));
    require('../../exercices/run/controller.js').controller.showApercuInDevoir(
      sujet,
      exoDevoir,
      twocolsLayout.getRegion('right')
    );
    assosExosView.on("item:destroy", (childView) => {
      const model = childView.model;
      if (model.get("id") === exoDevoir.id) {
        channel.trigger("devoir:dashboard", devoir.id);
      }
    });
  },

});

export const controller = new Controller();

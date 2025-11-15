import { MnObject } from 'backbone.marionette'
import { ExercicesPanel, ExercicesCollectionView } from './views.js'
import { LayoutView } from '../../common/views.js'

import renderMathInElement from "katex/contrib/auto-render";

const Controller = MnObject.extend({
  channelName: "app",
  makeView(exercices, region, options) {
    options = options || {};
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const layout = new LayoutView( { panelRight: true } );
    const panel = new ExercicesPanel({
      filterCriterion: options.criterion || "",
      showAddButton: options.showAddButton || false
    });
    const listExercicesView = new ExercicesCollectionView({
      collection: exercices,
      currentid: logged.id,
      showOwner: !logged.isEleve(),
      filterCriterion: options.criterion || ""
    });

    panel.on("items:filter", (filterCriterion) => {
      listExercicesView.trigger("set:filter:criterion", filterCriterion, { preventRender: false });
    });

    layout.on("render", () => {
      layout.getRegion('panelRegion').show(panel);
      layout.getRegion('contentRegion').show(listExercicesView);
    });
    region.show(layout);

    // Rendu de KaTeX dans la zone d'exercice
    renderMathInElement(region.$el[0], {
      delimiters: [
        {left: "$", right: "$", display: false},
        {left: "$$", right: "$$", display: true}
      ],
      throwOnError: false
    });
    
    return { listExercicesView, panel, layout };
  },
  
  list(exercices) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");
    const showAddButton = logged.isProf() || logged.isAdmin();
    const region = channel.request("region:main");
    const { listExercicesView } = this.makeView(exercices, region, { showAddButton });
    listExercicesView.on("item:sujet:exercice:show", (childView) => {
      channel.trigger("sujet:exercice:show", childView.model.get("id"));
    });


  }
});

export const controller = new Controller();

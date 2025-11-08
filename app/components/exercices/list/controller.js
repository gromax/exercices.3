import { MnObject, Region } from 'backbone.marionette'
import { ListLayout, ExercicesPanel, ExercicesCollectionView } from './views.js'

import renderMathInElement from "katex/contrib/auto-render";

const Controller = MnObject.extend({
  channelName: "app",
  makeView(exercices, criterion, region) {
    const channel = this.getChannel();
    criterion = criterion ? "" : "";
    const layout = new ListLayout();
    const panel = new ExercicesPanel({ filterCriterion: criterion });
    const listExercicesView = new ExercicesCollectionView({
      collection: exercices,
      filterCriterion: criterion
    });

    panel.on("items:filter", (filterCriterion) => {
      listExercicesView.trigger("set:filter:criterion", filterCriterion, { preventRender: false });
      channel.trigger("exercices:filter", filterCriterion);
    });

    layout.on("render", () => {
      layout.getRegion('panelRegion').show(panel);
      layout.getRegion('itemsRegion').show(listExercicesView);
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
  
  list(exercices, criterion) {
    const channel = this.getChannel();
    const region = channel.request("region:main");
    const { listExercicesView } = this.makeView(exercices, criterion, region);
    listExercicesView.on("item:sujet:exercice:show", (childView) => {
      channel.trigger("sujet:exercice:show", childView.model.get("id"));
    });


  }
});

export const controller = new Controller();

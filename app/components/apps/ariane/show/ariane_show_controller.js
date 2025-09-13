import { Region } from 'backbone.marionette'
import { ArianeView } from "@apps/ariane/show/ariane_show_view.js";
import { ArianeController } from "@entities/ariane.js";

const myRegion = new Region({
  el: '#ariane-region'   // le sélecteur CSS du div cible
});

export const controller = {
  showAriane() {
    const view = new ArianeView({ collection: ArianeController.collection });
    myRegion.show(view);
  }
}

import { View, CollectionView } from 'backbone.marionette';
import eleve_no_devoir_tpl from '@templates/home/show/devoirs-list-eleve-none.jst';
import eleve_devoir_item_tpl from '@templates/home/show/devoirs-list-eleve-item.jst';
import eleve_layout_tpl from '@templates/home/show/eleve-view-layout.jst';

const EleveNoDevoirView = View.extend({
  template: eleve_no_devoir_tpl,
  tagName: "a",
  className: "list-group-item"
});

const EleveDevoirItem = View.extend({
  tagName: "a",
  template: eleve_devoir_item_tpl,
  triggers: {
    "click": "devoir:show"
  },

  className() {
    if (!this.model.get("actif") || this.model.has("ficheActive") && !this.model.get("ficheActive")){
      return "list-group-item list-group-item-danger";
    } else {
      return "list-group-item";
    }
  },
  templateContext() {
    let faits = this.getOption("faits").where({aUF: options.model.get("id")});
    let exofiches = this.getOption("exofiches").where({idFiche: options.model.get("idFiche")});
    return {
      actif: data.actif && _.has(data,"ficheActive") && data.ficheActive,
      note: this.model.calcNote(exofiches, faits)
    };
  }
});

const EleveListeDevoirs = CollectionView.extend({
  className:"list-group",
  emptyView: EleveNoDevoirView,
  childView: EleveDevoirItem,
  childViewEventPrefix: "item",
  childViewOptions(model, index) {
    return {
      exofiches: this.getOption("exofiches"),
      faits: this.getOption("faits")
    };
  }
});

const EleveLayout = View.extend({
  template: eleve_layout_tpl,
  regions: {
    devoirsRegion: "#devoirs-region",
    unfinishedRegion: "#unfinished-region"
  }
});

export {
  EleveListeDevoirs,
  EleveLayout,
};

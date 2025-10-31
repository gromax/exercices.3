import { View, CollectionView } from 'backbone.marionette'
import item_tpl from '@templates/ariane/show/show-item.jst'
import ariane_tpl from '@templates/ariane/show/show-list.jst'
import not_loaded_tpl from '@templates/ariane/show/ariane-not-loaded-view.jst'

const NoView = View.extend({
  tagName: "li",
  className: "breadcrumb-item active",
  template: not_loaded_tpl
});

const ItemView = View.extend({
  tagName: "li",
  template: item_tpl,
  className() {
    if (this.model.get("active")){
      return "breadcrumb-item";
    } else {
      // Ça peut paraître bizarre, mais c'est quand il n'y a pas de lien
      // et que c'est inactif qu'il faut mettre la classe active avec bootstrap breadcrumb
      return "breadcrumb-item active";
    }
  },
  initialize() {
    this.listenTo(
      this.model,
      "change:active",
      function(){
        this.render();
      }
    );
  },
  triggers: {
    "click a.js-next" : "ariane:next",
    "click a.js-prev" : "ariane:prev"
  },
  /*
  onArianePrev() {
    const event_name = this.model.get("e");
    const data = this.model.get("prev");
    this.trigger("navigation", event_name, data);
  },
  onArianeNext() {
    const event_name = this.model.get("e");
    const data = this.model.get("next");
    this.trigger("navigation", event_name, data);
  }

    */
});

const ArianeView = CollectionView.extend({
  tagName: "nav",
  className: "breadcrumb",
  childView: ItemView,
  emptyView: NoView,
  childViewContainer: "ol",
  template: ariane_tpl,
});

export { ArianeView }

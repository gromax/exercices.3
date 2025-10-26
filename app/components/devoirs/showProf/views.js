import { View, CollectionView } from 'backbone.marionette'
import show_item_tpl from '@templates/devoirs/showProf/devoir-show.jst'
import assoc_devoir_exo_tpl from '@templates/devoirs/showProf/asso-devoir-exo.jst'
import no_asso_devoir_exo_tpl from '@templates/devoirs/showProf/no-asso-devoir-exo.jst'
import layout_tpl from '@templates/devoirs/showProf/devoir-layout.jst'

const ShowDevoirView = View.extend({
  template: show_item_tpl,
});

const NoAssocDevoirExoView = View.extend({
    tagName: "a",
    className: "list-group-item",
    template: no_asso_devoir_exo_tpl,
});

const ItemAssocDevoirExoView = View.extend({
    tagName: "a",
    className: "list-group-item",
    template: assoc_devoir_exo_tpl,
});

const AssosExoDevoirCollectionView = CollectionView.extend({
  className: "list-group",
  emptyView: NoAssocDevoirExoView,
  childView: ItemAssocDevoirExoView,
  childViewEventPrefix: "item",
});

const LayoutView = View.extend({
  template: layout_tpl,
  regions: {
    devoirRegion: ".js-devoir",
    assocsRegion: ".js-assocs",
  },
});

export { ShowDevoirView, AssosExoDevoirCollectionView, LayoutView }

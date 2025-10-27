import { View, CollectionView } from 'backbone.marionette'
import DestroyWarn from '../../behaviors/destroy.js';
import show_item_tpl from '@templates/devoirs/editexos/devoir-show.jst'
import assoc_devoir_exo_tpl from '@templates/devoirs/editexos/asso-devoir-exo.jst'
import no_asso_devoir_exo_tpl from '@templates/devoirs/editexos/no-asso-devoir-exo.jst'
import layout_tpl from '@templates/devoirs/editexos/devoir-layout.jst'

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
    behaviors: [
        DestroyWarn,
    ],
    
    modelEvents: {
      'change': 'render'
    },
    
    triggers: {
        "click .js-up": "up",
        "click .js-down": "down"
    },
});

const AssosExoDevoirCollectionView = CollectionView.extend({
    className: "list-group",
    emptyView: NoAssocDevoirExoView,
    childView: ItemAssocDevoirExoView,
    childViewEventPrefix: "item",
});

const LayoutView = View.extend({
    template: layout_tpl,
    templateContext() {
        return { id: this.getOption('id') };
    },
    regions: {
        devoirRegion: ".js-devoir",
        assocsRegion: ".js-assocs",
    },
});

export { ShowDevoirView, AssosExoDevoirCollectionView, LayoutView }

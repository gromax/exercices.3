import { View, CollectionView } from 'backbone.marionette'
import item_tpl from '@templates/notes/exolist/item.jst'
import noitem_tpl from '@templates/notes/exolist/noitem.jst'
import panel_tpl from '@templates/notes/exolist/panel.jst'
import layout_tpl from '@templates/notes/exolist/layout.jst'

const PanelView = View.extend({
    template: panel_tpl,
    templateContext() {
        return {
            nomComplet: this.getOption('nomComplet'),
        };
    }
});

const NoItemView = View.extend({
    tagName: "a",
    className: "list-group-item",
    template: noitem_tpl,
});

const ItemView = View.extend({
    tagName: "a",
    className: "list-group-item",
    triggers: {
        "click": "show"
    },
    template: item_tpl,
});

const NotesExosCollectionView = CollectionView.extend({
    className: "list-group",
    emptyView: NoItemView,
    childView: ItemView,
    childViewEventPrefix: "item",
});

const LayoutView = View.extend({
    template: layout_tpl,
    regions: {
        panelRegion: ".js-panel",
        itemsRegion: ".js-items",
    },
});

export { PanelView, NotesExosCollectionView, LayoutView }

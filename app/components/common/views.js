import { View } from 'backbone.marionette'
import twocols_tpl from '@templates/common/twocols.jst'
import layout_tpl from '@templates/common/layout.jst'

const TwoColsView = View.extend({
  template: twocols_tpl,
  regions: {
    left: '.js-left',
    right: '.js-right'
  }
});

const ListLayout = View.extend ({
  template: layout_tpl,
  regions: {
    panelRegion: ".js-panel",
    itemsRegion: ".js-items"
  }
});

export { TwoColsView, ListLayout };
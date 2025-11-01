import { MnObject, Region } from 'backbone.marionette'
import { DevoirsPanel, DevoirsCollectionView, ListLayout } from './views.js'


const Controller = MnObject.extend({
  channelName: 'app',

  list(devoirs) {
    const channel = this.getChannel();
    const logged = channel.request("logged:get");

    const devoirsListView = new DevoirsCollectionView({
      collection: devoirs,
      showNomOwner: logged.isAdmin(),
    });
    
    const listItemsLayout = new ListLayout();
    const panel = new DevoirsPanel({
      showAddButton: !logged.isAdmin(),
    });

    listItemsLayout.on("render", () => {
      listItemsLayout.getRegion('panelRegion').show(panel);
      listItemsLayout.getRegion('itemsRegion').show(devoirsListView);
    });

    channel.request("region:main").show(listItemsLayout);
  },
});

export const controller = new Controller();

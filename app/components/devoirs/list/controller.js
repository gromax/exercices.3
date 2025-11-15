import { MnObject } from 'backbone.marionette'
import {
    DevoirsPanel,
    DevoirsCollectionView
} from './views.js'
import { LayoutView } from '../../common/views.js'

const Controller = MnObject.extend({
    channelName: 'app',
    list(devoirs) {
        const channel = this.getChannel();
        const logged = channel.request("logged:get");

        const devoirsListView = new DevoirsCollectionView({
            collection: devoirs,
            showNomOwner: logged.isAdmin(),
        });
        
        const listItemsLayout = new LayoutView( { panelRight: true } );
        const panel = new DevoirsPanel({
            showAddButton: !logged.isAdmin(),
        });

        listItemsLayout.on("render", () => {
            listItemsLayout.getRegion('panelRegion').show(panel);
            listItemsLayout.getRegion('contentRegion').show(devoirsListView);
        });

        devoirsListView.on("item:clone", (childView) => {
            const model = childView.model;
            const cloning = model.clone();
            channel.trigger("loading:up");
            $.when(cloning).done((newDevoir) => {
                channel.trigger("data:purge", "exodevoirs");
                devoirs.add(newDevoir, {parse: true});
            }).fail((response) => {
                console.warn("Erreur clonage devoir", response.responseJSON);
                channel.trigger("popup:error", "Erreur lors du clonage du devoir.");
            }).always(() => {
                channel.trigger("loading:down");
            });
        });

        channel.request("region:main").show(listItemsLayout);
    },
});

export const controller = new Controller();

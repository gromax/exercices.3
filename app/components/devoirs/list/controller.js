import { MnObject } from 'backbone.marionette'
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

        devoirsListView.on("item:clone", (childView) => {
            const model = childView.model;
            const cloning = model.clone();
            channel.trigger("loading:up");
            $.when(cloning).done((newDevoir) => {
                channel.trigger("data:purge", "exodevoirs");
                devoirs.add(newDevoir);
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

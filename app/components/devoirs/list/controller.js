import { MnObject } from 'backbone.marionette'
import {
    DevoirsPanel,
    DevoirsCollectionView
} from './views.js'
import { LayoutView } from '../../common/views.js'

const Controller = MnObject.extend({
    channelName: 'app',
    list(devoirs, archives = false) {
        const channel = this.getChannel()
        const logged = channel.request("logged:get")

        const devoirsListView = new DevoirsCollectionView({
            archives: archives,
            collection: devoirs,
            showNomOwner: logged.isAdmin(),
            showClasse: !archives,
            showArchiveButton: !archives,
            showNotesButton: !archives,
            showStatus: !archives,
        })
        
        const listItemsLayout = new LayoutView( { panelRight: true } )
        const panel = new DevoirsPanel({
            showAddButton: !logged.isAdmin(),
            archives: archives,
        })

        panel.on("items:filter", (filterCriterion) => {
            devoirsListView.trigger("set:filter:criterion", filterCriterion, { preventRender: false })
        })

        listItemsLayout.on("render", () => {
            listItemsLayout.getRegion('panelRegion').show(panel)
            listItemsLayout.getRegion('contentRegion').show(devoirsListView)
        })

        devoirsListView.on("item:clone", (childView) => {
            const model = childView.model
            const cloning = model.clone()
            channel.trigger("loading:up")
            $.when(cloning).done((newDevoir) => {
                channel.trigger("data:purge", "exodevoirs")
                devoirs.add(newDevoir, {parse: true})
            }).fail((response) => {
                console.warn("Erreur clonage devoir", response.responseJSON)
                channel.trigger("popup:error", "Erreur lors du clonage du devoir.")
            }).always(() => {
                channel.trigger("loading:down")
            })
        })

        devoirsListView.on("item:archive", (childView) => {
            const model = childView.model
            const archiving = model.archive()
            channel.trigger("loading:up")
            $.when(archiving).done((newDevoir) => {
                channel.trigger("data:purge", "exodevoirs")
                devoirs.add(newDevoir, {parse: true})
            }).fail((response) => {
                console.warn("Erreur archivage devoir", response.responseJSON)
                channel.trigger("popup:error", "Erreur lors de l'archivage du devoir.")
            }).always(() => {
                channel.trigger("loading:down")
            })
        })

        channel.request("region:main").show(listItemsLayout)
    },
})

export const controller = new Controller()

import { Behavior } from 'backbone.marionette'

const FilterList = Behavior.extend({
    initialize() {
        // Si la vue a un filtre de base, on l'applique dès le départ
        if (typeof this.view.baseFilter === 'function') {
            this.view.setFilter(this.getCombinedFilter(""), { preventRender: true })
        }

        if ((typeof this.view.options.filterCriterion !== "undefined") && (this.options.filterCriterion !== "")) {
            this.trigger("set:filter:criterion", this.view.options.filterCriterion, { preventRender: true })
        }
    },

    getCombinedFilter(criterion) {
        const baseFilter = this.view.baseFilter
        const filterKeys = this.view.getOption("filterKeys")
        const parseFct = (model) =>
            _.reduce(filterKeys, (m, k) => m + model.get(k), "")
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()

        return (view, index, children) => {
            // 1. Vérifie la condition de base (ex: idClasse !== null)
            if (typeof baseFilter === 'function' && !baseFilter.call(this.view, view.model)) {
                return false
            }
            // 2. Vérifie le critère de recherche textuel
            if (!criterion || !filterKeys) return true
            return parseFct(view.model).indexOf(criterion) !== -1
        }
    },

    onSetFilterCriterion(criterion, options) {
        criterion = criterion
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
        this.view.setFilter(this.getCombinedFilter(criterion), options)
    }
})

export default FilterList
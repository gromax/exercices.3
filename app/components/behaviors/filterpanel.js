import { Behavior } from 'backbone.marionette'

const FilterPanel = Behavior.extend({
    ui: {
        criterion: "input.js-filter-criterion",
        form: "#filter-form",
    },
    events: {
        "submit @ui.form": "applyFilter",
    },

    applyFilter(e) {
        e.preventDefault()
        const criterion = this.ui.criterion.val()
        this.view.trigger("items:filter", criterion)
    },
    onSetFilterCriterion(criterion) {
        this.ui.criterion.val(criterion)
    }
})

export default FilterPanel

import { Behavior } from 'backbone.marionette'

const SortList = Behavior.extend({
    events: {
        "click a.js-sort":"sortFct"
    },

    sortFct(e) {
        e.preventDefault()
        this.view.$el.find(".js-sort-icon").remove()
        const $sortEl = $(e.currentTarget)
        const tag = $sortEl.data("sort")
        const collection = this.view.collection
        if (collection.comparatorAttr === tag) {
            $sortEl.append("<span class='js-sort-icon' style='margin-left: 5px'><i class='fa fa-sort-amount-desc'></i></span>")
            collection.comparatorAttr = `inv_${tag}`
            collection.comparator = function(a,b) {
                if (a.get(tag)>b.get(tag)) {
                    return -1
                } else {
                    return 1
                }
            }
        } else {
             $sortEl.append("<span class='js-sort-icon' style='margin-left: 5px'><i class='fa fa-sort-amount-asc'></i></span>")
             collection.comparatorAttr = tag
             collection.comparator = tag
        }
        collection.sort()
    }
})

export default SortList
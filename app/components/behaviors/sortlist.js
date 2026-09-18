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
        const compare = (a, b, direction) => {
            const firstValue = a.get(tag)
            const secondValue = b.get(tag)

            if (typeof firstValue === "string" && typeof secondValue === "string") {
                return direction * firstValue.localeCompare(secondValue, undefined, { sensitivity: "base" })
            }
            return direction * (firstValue - secondValue)
        }
        if (collection.comparatorAttr === tag) {
            $sortEl.append("<span class='js-sort-icon' style='margin-left: 5px'><i class='fa fa-sort-amount-desc'></i></span>")
            collection.comparatorAttr = `inv_${tag}`
            collection.comparator = (a, b) => compare(a, b, -1)
        } else {
             $sortEl.append("<span class='js-sort-icon' style='margin-left: 5px'><i class='fa fa-sort-amount-asc'></i></span>")
             collection.comparatorAttr = tag
             collection.comparator = (a, b) => compare(a, b, 1)
        }
        collection.sort()
    }
})

export default SortList
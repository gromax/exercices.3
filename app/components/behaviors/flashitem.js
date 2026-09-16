import { Behavior } from 'backbone.marionette'

const FlashItem = Behavior.extend({
    onFlashSuccess() {
        this.flash("success")
    },
    onFlashError() {
        this.flash("danger")
    },
    flash(cssClass) {
        const $view = this.$el
        const preCss = this.view.tagName === "tr"
            ? "table-" // dans Bootstrap
            : ""
        $view.hide().toggleClass(preCss+cssClass).fadeIn(800, function(){
            setTimeout( function(){ $view.toggleClass(preCss+cssClass) }, 500)
        })
    }
})

export default FlashItem
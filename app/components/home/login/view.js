import { View } from 'backbone.marionette'
import Form from '../../behaviors/form.js'
import login_tpl from '@templates/home/login/home-login.jst'
import forgotten_tpl from '@templates/home/login/forgotten.jst'

const LoginView = View.extend({
    className:"card",
    template: login_tpl,
    behaviors: [Form],
    showForgotten: false, // default value
    templateContext() {
        return {
            showForgotten: this.getOption("showForgotten")
        }
    },
})

const ForgottenView = View.extend({
    className:"card",
    template: forgotten_tpl,
    
    onRender() {
        const form = this.el.querySelector('form')
        form.addEventListener('submit', (event) => {
            event.preventDefault()
            event.stopPropagation()
            const fdata = new FormData(form)
            const data = Object.fromEntries(fdata.entries())
            this.trigger("forgotten:ask", data.email)
        });
    },

})

export { LoginView, ForgottenView }
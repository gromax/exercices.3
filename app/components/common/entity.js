/**
 * extentions communes pout les modèles backbon des entités et collections
 */

import Backbone from 'backbone'

const MyModel = Backbone.Model.extend({
    sync(method, model, options) {
        options = options || {};
        const token = localStorage.getItem('jwt');
        options.beforeSend = function (xhr) {
            if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
        };
        return Backbone.sync(method, model, options);
    },
});

export { MyModel }
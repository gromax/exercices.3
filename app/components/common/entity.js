/**
 * extentions communes pout les modèles backbon des entités et collections
 */

import Backbone from 'backbone'

const MyModel = Backbone.Model.extend({
    sync(method, model, options) {
        options = options || {}
        const originalSuccess = options.success
        const token = localStorage.getItem('jwt')
        options.beforeSend = function (xhr) {
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
        }
        options.success = function (data, status, xhr) {
            // traiter le token s'il y en a un
            if (data && data.token) {
                localStorage.setItem('jwt', data.token)
            }
            if (originalSuccess) originalSuccess.call(this, data, status, xhr)
        }
        return Backbone.sync(method, model, options)
    },
});

const MyCollection = Backbone.Collection.extend({
    _partial: false,
    getPartial() {
        return this._partial
    },
  
    setPartial(value) {
        this._partial = Boolean(value)
    },

    sync(method, model, options) {
        options = options || {}
        const token = localStorage.getItem('jwt')

        // n'autoriser que la lecture ('read') ; bloquer create/update/patch/delete
        if (this.constructor && this.constructor.readOnly && method !== 'read') {
            const err = new Error('Model is read-only')
            if (options && typeof options.error === 'function') options.error(err)
            // retourner une Promise rejetée (compatible fetch-style) ou un Deferred si présent
            if (typeof Promise !== 'undefined') return Promise.reject(err)
            if (Backbone.$ && Backbone.$.Deferred) return Backbone.$.Deferred().reject(err)
            throw err
        }

        options.beforeSend = function (xhr) {
            if (token) {
              xhr.setRequestHeader('Authorization', `Bearer ${token}`)
            }
        }
        return Backbone.sync(method, model, options)
    }
});

export { MyModel, MyCollection }
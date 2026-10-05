import _ from "underscore"
import MainBloc from "./mainbloc"
import { Node } from "./node"
import { TOptions, TParams, NestedArray } from "@types"
import { FluxBloc } from "./blocs/bloc"
import Halt from "./flux/halt"
import Needed from "./flux/needed"
import Affectation from "./affectation"
import TextNode from "./textnode"

const TRYNUMBER = 100

function parseParams(code:string, options:TOptions) {
    code = code || ""
    options = options || {}
    if (typeof options === 'string') {
        options = JSON.parse(options)
    }
    const main = MainBloc._parse(code)
    for (let attempt = 1; attempt <= TRYNUMBER; attempt++) {
        const result = _getInit(main.children, options)
        if (result !== null) {
            return result
        }
    }
    throw new Error(`Impossible d'initialiser les paramètres de l'exercice après ${TRYNUMBER} essais.`)
}


/**
 * Tentative d'initialisation des paramètres
 * @param {TOptions} options 
 * @returns {TParams|null} un objet de paramètres ou null si échec
 */
function _getInit(nodes:Array<Node>, options:TOptions):TParams|null {
    const params = {}
    let program = nodes.reverse()
    while (program.length > 0) {
        let item = program.pop()
        if (item instanceof Halt) {
            // arrêt de l'initialisation
            return _stringifyParams(params)
        }
        if (item instanceof TextNode) {
            continue
        }
        if (item instanceof Needed) {
            const goOn = item.goOn({ ...params, ...options })
            if (!goOn) {
                return null
            }
            continue
        }
        if (item instanceof FluxBloc) {
            const children = item.getFlux({ ...params, ...options })
            program.push(...children.reverse())
            continue
        }
        // doit être une affectation
        if (!(item instanceof Affectation)) {
            throw new Error("L'initialisation ne doit contenir que des conditions et des affectations.")
        }
        item.doAffectation(params, options)
    }
    // Filtrage des noms en _nom
    return _stringifyParams(params)
}

/**
 * @param {TParams}params L'objet de paramètres à transformer en chaînes de caractères.
 * @returns {TParams} L'objet de paramètres avec toutes les valeurs transformées en chaînes de caractères.
 */
function _stringifyParams(params:TParams):TParams {
    // Filtrage des noms en _nom
    const keys = Object.keys(params).filter(key => !key.startsWith('_'))
    const filtered = _.pick(params, keys)
    return _.mapObject(filtered, (val,key) => _stringifyValue(val))

}

function _stringifyValue(value:any):NestedArray<string> {
    if (Array.isArray(value)) {
        return value.map(v => _stringifyValue(v))
    }
    if (typeof value === 'undefined' || value === null) {
        return ''
    }
    if (typeof (value as any).toSaveString === 'function') {
        return (value as any).toSaveString()
    }
    return String(value)
}

export { parseParams }
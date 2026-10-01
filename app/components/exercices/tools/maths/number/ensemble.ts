import type { Base } from "./base"
import { Collection } from "./collection"
import { Ensemble, EnsemblePrimitif } from "./ensemblesitems/parent"
import { EmptySet, EMPTY_SET } from "./ensemblesitems/empty"
import { InvalidSet, INVALID_SET } from "./ensemblesitems/invalid"
import { Interval } from "./ensemblesitems/interval"
import { UnionIntervals } from "./ensemblesitems/unionintervals"
import { Operator } from "./ensemblesitems/operator"

class EnsembleCalculator {
    /**
     * union d'ensembles
     * @param {Ensemble} ensemble1
     * @param {Ensemble} ensemble2
     * @returns {EnsemblePrimitif} L'union des deux ensembles
     */
    static union(ensemble1: Ensemble, ensemble2: Ensemble): EnsemblePrimitif {
        if (ensemble1.isInvalid() || ensemble2.isInvalid()) {
            return INVALID_SET
        }
        const devEnsemble1 = EnsembleCalculator.develop(ensemble1)
        const devEnsemble2 = EnsembleCalculator.develop(ensemble2)
        if (devEnsemble1 instanceof EmptySet) {
            return devEnsemble2
        } else if(devEnsemble2 instanceof EmptySet) {
            return devEnsemble1
        }
        const inters1 = devEnsemble1 instanceof Interval
            ? [devEnsemble1]
            : devEnsemble1 instanceof UnionIntervals
                ? devEnsemble1.intervals
                : []
        if (inters1.length == 0) {
            throw new Error("L'ensemble1 n'a pas d'intervalles")
        }
        const inters2 = devEnsemble2 instanceof Interval
            ? [devEnsemble2]
            : devEnsemble2 instanceof UnionIntervals
                ? devEnsemble2.intervals
                : []
        if (inters2.length == 0) {
            throw new Error("L'ensemble2 n'a pas d'intervalles")
        }
        return UnionIntervals.makeFromIntervals([...inters1, ...inters2])
    }

    /**
     * intersection d'ensembles
     * @param {Ensemble} ensemble1
     * @param {Ensemble} ensemble2
     * @returns {EnsemblePrimitif} L'intersection des deux ensembles
     */
    static intersection(ensemble1: Ensemble, ensemble2: Ensemble): EnsemblePrimitif {
        if (ensemble1.isInvalid() || ensemble2.isInvalid()) {
            return INVALID_SET
        }
        const devEnsemble1 = EnsembleCalculator.develop(ensemble1)
        const devEnsemble2 = EnsembleCalculator.develop(ensemble2)
        if (devEnsemble1 instanceof EmptySet || devEnsemble2 instanceof EmptySet) {
            return EMPTY_SET
        }
        const inters1 = devEnsemble1 instanceof Interval
            ? [devEnsemble1]
            : devEnsemble1 instanceof UnionIntervals
                ? devEnsemble1.intervals
                : []
        if (inters1.length == 0) {
            throw new Error("L'ensemble1 n'a pas d'intervalles")
        }
        const inters2 = devEnsemble2 instanceof Interval
            ? [devEnsemble2]
            : devEnsemble2 instanceof UnionIntervals
                ? devEnsemble2.intervals
                : []
        if (inters2.length == 0) {
            throw new Error("L'ensemble2 n'a pas d'intervalles")
        }
        // Il faut calculer tous les produits.
        const products: Interval[] = []
        for (const inter1 of inters1) {
            for (const inter2 of inters2) {
                const intersection = Interval.intersection(inter1, inter2)
                if (intersection.length == 0) {
                    continue
                }
                products.push(intersection[0])
            }
        }
        // les produits obtenus sont forcément disjoints et non vides
        if (products.length == 0) {
            return EMPTY_SET
        } else if (products.length == 1) {
            return products[0]
        } else {
            return new UnionIntervals(products)
        }
    }

    /**
     * @param {string|boolean} opening Le crochet d'ouverture de l'intervalle.
     * @param {[Base,Base]|Base} bornes les bornes ouvrante et fermante
     * @param {string|boolean} closing Le crochet de fermeture de l'intervalle.
     */
    static makeInterval(opening: string|boolean, bornes: [Base,Base]|Base, closing: string|boolean): Interval {
        if (!(Array.isArray(bornes) && bornes.length == 2)
            && !((bornes instanceof Collection) && bornes.length == 2) ) {
            throw new Error("Les bornes doivent être un tableau de deux éléments ou une instance de Collection de deux éléments")
        }
        const _bornes = Array.isArray(bornes)
            ? bornes
            : (bornes as Collection).children
        const start = _bornes[0]
        const end = _bornes[1]
        return new Interval(opening, start, end, closing)
    }

    static emptySet(): EmptySet {
        return EMPTY_SET
    }

    static invalidSet(): InvalidSet {
        return INVALID_SET
    }

    static simplify(ensemble: Ensemble): Ensemble {
        if (ensemble.isInvalid()) {
            return INVALID_SET
        }
        return ensemble.simplifyBornes()
    }

    static develop(ensemble: Ensemble): EnsemblePrimitif {
        if (ensemble instanceof EnsemblePrimitif) {
            return ensemble
        }
        // forcément un Operator
        if (!(ensemble instanceof Operator)) {
            throw new Error("L'ensemble devrait être un opérateur pour être développé")
        }
        const children = ensemble.children().map(child => EnsembleCalculator.develop(child))
        // children doit avoir au moins 2 enfants
        if (children.length < 2) {
            throw new Error("Un opérateur doit avoir au moins deux enfants")
        }
        let accumulator = EnsembleCalculator.develop(children[0])
        if (ensemble.isUnion) {
            for (let i = 1; i < children.length; i++) {
                accumulator = EnsembleCalculator.union(accumulator, children[i])
            }
        } else {
            for (let i = 1; i < children.length; i++) {
                accumulator = EnsembleCalculator.intersection(accumulator, children[i])
            }
        }
        return accumulator
    }

    /**
     * Indique si un ensemble pourrait être développé
     * @param ensemble 
     * @returns 
     */
    static isDevelopped(ensemble: Ensemble): boolean {
        if (ensemble instanceof EnsemblePrimitif) {
            return true
        }
        if (!(ensemble instanceof Operator)) {
            throw new Error("L'ensemble devrait être un opérateur pour être développé")
        }
        // si intersection, on pourrait développer
        if (ensemble.isIntersection) {
            return false
        }
        const children = ensemble.children()
        if (children.some(child => EnsembleCalculator.isDevelopped(child))) {
            return false
        }
        // on a donc une union. S'il est développé, il doit avoir
        // autant d'enfant que son équivalent UnionIntervals
        const dev = EnsembleCalculator.develop(ensemble)
        if (!(dev instanceof UnionIntervals)) {
            return false
        }
        return dev.length === children.length
    }
}

export {
    Ensemble,
    EnsembleCalculator
}
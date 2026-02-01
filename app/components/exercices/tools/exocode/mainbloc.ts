import _ from "underscore"
import { parseBloc } from "./blocs/parsebloc"
import IfBloc from "./flux/ifbloc"
import FluxManager from "./flux/fluxmanager"
import Affectation from "./affectation"
import Bloc from "./blocs/bloc"
import TextNode from "./textnode"
import Parameter from "./parameter"
import Option from "./option"
import Colors from "./colors"
import { Node } from "./node"
import Until from "./flux/until"
import { TParams, TOptions } from "@types"

class Stack {
    _nodes:Array<Bloc>
    constructor() {
        this._nodes = []
    }

    get last():Bloc {
        if (this._nodes.length == 0) {
            throw new Error("Pile vide !")
        }
        return this._nodes[this._nodes.length-1]
    }

    pop():Bloc {
        if (this._nodes.length == 0) {
            throw new Error("Pile vide !")
        }
        return this._nodes.pop()
    }

    push(n:Bloc):void {
        this._nodes.push(n)
    }

    pushInLast(n:Node):void {
        const last = this.last
        last.push(n)
    }

    get length():number {
        return this._nodes.length
    }
}

class MainBloc {
    private _mainBloc:Bloc
    private _runned:boolean = false

    constructor(container:Bloc) {
        this._mainBloc = container
    }

    static runCode(code:string, params:TParams, options:TOptions) {
        const main = MainBloc._parse(code)
        return main.run(params, options)
    }
        
    /**
     * Fonction qui analyse le contenu d'un exercice et renvoie un objet représentant sa structure
     * @param {string} content le contenu à analyser
     * @returns {object} l'objet représentant la structure de l'exercice
     */
    static _parse(content:string):MainBloc {
        const colors = new Colors() // instancie une palette pour les blocs qui en auraient besoin
        const lines = content.split('\n')
        const stack = new Stack()
        const mainBloc = new Bloc("main", "", false)
        stack.push(mainBloc)

        for (const line of lines) {
            if (line.startsWith('#')) {
                // ligne de commentaire ignorée
                continue
            }
            const trimmed = line.split('#')[0].trim()
            if (trimmed === '</main>') {
                throw new Error("Erreur de syntaxe : fin de bloc main interdite")
            }

            if (FluxManager.isElse(trimmed)) {
                const last = stack.last
                if (!(last instanceof IfBloc)) {
                    throw new Error("<else> ne ferme pas  un <if> ou <elif>")
                }
                last.closeIfBranch()
                continue
            }

            const condition = FluxManager.tryParse(trimmed)
            if (condition instanceof Until) {
                stack.push(condition)
                continue
            } else if (condition instanceof IfBloc) {
                condition.closeIfNecessary(stack.last)
                stack.push(condition)
                continue
            } else if (condition instanceof Node) {
                stack.pushInLast(condition)
                continue
            }

            // je dois test options avant affectation
            // car en cas de @x => ... cela pourrait être pris
            // pour une affectation
            const option = Option.parse(trimmed)
            if (option) {
                stack.pushInLast(option)
                continue
            }

            const affectation = Affectation.parse(trimmed)
            if (affectation) {
                stack.pushInLast(affectation)
                continue
            }

            if (trimmed === IfBloc.END) {
                // ferme tous les blocs elif jusqu'au if.
                let item
                do {
                    item = stack.pop()
                    if (!(item instanceof IfBloc)) {
                        throw new Error(`Erreur de syntaxe : fin de condition referme <${item.tag}>`)
                    }
                    item.close()
                    stack.pushInLast(item)
                } while (item.tag !== IfBloc.IF) // s'arrêtera forcément au pire sur le bloc MainBloc
                continue
            }

            const parameter = Parameter.parse(trimmed)
            if (parameter) {
                stack.pushInLast(parameter)
                continue
            }

            const bloc = parseBloc(trimmed)
            if (bloc) {
                bloc.setColors(colors)
                if (bloc.closed) {
                    stack.pushInLast(bloc)
                } else {
                    stack.push(bloc)
                }
                continue
            }
            
            const m = trimmed.match(/^<\/(\w+)>$/)
            if (m) {
                // fin de bloc
                const tag = m[1]
                const item = stack.pop()
                if (!(item instanceof Bloc)) {
                   throw new Error("Erreur de syntaxe : fin de bloc sans début")
                }
                if (item.tag !== tag) {
                    throw new Error(`Erreur de syntaxe : fin de bloc ${tag} mais on attendait </${item.tag}>`)
                }
                item.close()
                stack.pushInLast(item)
                continue
            }
            if (/^<.*:.*\/?>$/.test(trimmed)) {
                throw new Error(`Erreur de syntaxe : bloc non reconnu ${trimmed}`)
            }
            stack.pushInLast(new TextNode(trimmed))
        }
        if (stack.length !== 1) {
            throw new Error("Erreur de syntaxe : blocs non fermés")
        }
        
        return new MainBloc(mainBloc)
    }

    /**
     * Exécute le bloc principal et renvoie les contenus bruts
     * @param {TParams} params
     * @param {Array<Node>} options
     * @returns {Array<Node>}
     */
    run(params:TParams, options:TOptions):Array<Node> {
        if (this._runned) {
            // déjà exécuté
            throw new Error("Le bloc principal ne peut être exécuté qu'une seule fois.")
        }
        this._runned = true
        const parameters:TParams = { ...params, ...options }
        this._mainBloc.run(parameters)
        // Pas besoin de récupérer le résultat qui dans ce cas
        // est le bloc lui-même
        return this._mainBloc.children.reverse()
    }

    get children():Array<Node> {
        return this._mainBloc.children
    }
}

export default MainBloc
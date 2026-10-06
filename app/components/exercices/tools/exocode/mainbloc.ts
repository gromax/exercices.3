import _ from "underscore"
import { parseBloc } from "./blocs/parsebloc"
import IfBloc from "./flux/ifbloc"
import FluxManager from "./flux/fluxmanager"
import Affectation from "./simplenodes/affectation"
import { Bloc } from "./blocs/bloc"
import { ContentBloc, BlocWithView } from "./blocs/contentbloc"
import { FluxBloc } from "./flux/fluxbloc"
import TextNode from "./simplenodes/textnode"
import Parameter from "./simplenodes/parameter"
import Option from "./simplenodes/option"
import Colors from "./colors"
import { Node } from "./node"
import { FluxNode } from "./flux/fluxnode"
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
    private _mainBloc:ContentBloc
    private _runned:boolean = false

    constructor(container:ContentBloc) {
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
        const mainBloc = new ContentBloc("main")
        stack.push(mainBloc)

        for (const line of lines) {
            if (line.startsWith('#')) {
                // ligne de commentaire ignorée
                continue
            }
            const trimmed = line.split('#')[0].trim()

            if (FluxManager.isElse(trimmed)) {
                const last = stack.last
                if (!(last instanceof IfBloc)) {
                    throw new Error("<else> ne ferme pas  un <if> ou <elif>")
                }
                last.closeIfBranch()
                continue
            }

            const fluxNode = FluxManager.tryParse(trimmed)
            if (fluxNode instanceof IfBloc) {
                fluxNode.closeIfNecessary(stack.last)
                stack.push(fluxNode)
                continue
            } else if (fluxNode instanceof FluxBloc) {
                stack.push(fluxNode)
                continue
            } else if (fluxNode instanceof FluxNode) {
                stack.pushInLast(fluxNode)
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
                let item:Bloc
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
                if (bloc instanceof BlocWithView) {
                    bloc.setColors(colors)
                }
                
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
                if (stack.length === 1) {
                    throw new Error(`Erreur de syntaxe : fin de bloc ${trimmed} sans début`)
                }
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
            const last = stack.pop()
            throw new Error(`Erreur de syntaxe : bloc <${last.tag}> non fermé`)
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
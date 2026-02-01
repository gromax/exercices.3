import MainBloc from "./mainbloc"
import { Node } from "./node"
import Bloc from "./blocs/bloc"
import TextNode from "./textnode"

function parseOptions(content:string) {
    const mainBlock = MainBloc._parse(content)
    return _parseOptions(mainBlock.children)
}


type TParseOptionsReturn = {
    options:Record<string,Array<string>>,
    defaultsOptions:Record<string,string>
}


/**
 * Produit l'objet décrivant les options possibles
 */
function _parseOptions(nodes:Array<Node>):TParseOptionsReturn {
    const options = {}
    const defaultsOptions = {}
    for (const child of nodes) {
        if (child instanceof TextNode){
            continue
        }

        if (!(child instanceof Bloc) || child.tag !== 'option') {
            throw new Error("Le contenu des options ne peut contenir que des blocs <option>.")
        }

        const [key, defaultValue,values] = child.parseOption()
        if (key.startsWith('_')) {
            throw new Error(`Le nom d'option ${key} est invalide (ne doit pas commencer par _).`)
        }
        options[key] = values
        defaultsOptions[key] = defaultValue
    }
    return { options, defaultsOptions }
}

export { parseOptions }

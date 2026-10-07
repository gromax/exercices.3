import { ContentBloc } from "./contentbloc"
import TextBloc from "./textbloc"
import InputTextBloc from "./input/inputtextbloc"
import RadioBloc from "./input/radiobloc"
import FormBloc from "./FormBloc"
import GraphBloc from "./graphbloc"
import ChoiceBloc from "./choice"
import TkzTabBloc from "./tkztabbloc"
import InputChoice from "./input/inputchoice"
import TableBloc from "./tablebloc"
import { GraphItemBloc } from "./graphitems/graphitembloc"
import { OptionBloc } from "./optionBloc"

type HasTryCreate = {
    tryCreate: (tag:string, paramsString:string|null) => false|ContentBloc
}

const CLASSES:Array<HasTryCreate> = [
    TableBloc,
    TextBloc,
    GraphBloc,
    GraphItemBloc,
    ChoiceBloc,
    TkzTabBloc,
    OptionBloc,
    FormBloc,
    InputTextBloc,
    RadioBloc,
    InputChoice,
]

function parseBloc(line:string):ContentBloc|null {
    const regex = /^<(\w+)\s*(?::\s*([^>\/]+?))?\s*>$/
    const m = line.match(regex)
    if (m=== null) {
        return null
    }
    const label = m[1].toLowerCase()
    const paramsString = m[2]
        ? m[2] // en attente de tolowecase
        : null
    for (const choixClasse of CLASSES) {
        const essai = choixClasse.tryCreate(label, paramsString)
        if (essai !== false) {
            return essai
        }
    }
    throw new Error(`Bloc inconnu : ${line}`)
}

export { parseBloc }
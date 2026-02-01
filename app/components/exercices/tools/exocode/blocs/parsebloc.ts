import Bloc from "./bloc"
import TextBloc from "./textbloc"
import InputTextBloc from "./input/inputtextbloc"
import RadioBloc from "./input/radiobloc"
import InputEnsemble from "./input/inputensemble"
import FormBloc from "./FormBloc"
import GraphBloc from "./graphbloc"
import ChoiceBloc from "./choice"
import TkzTabBloc from "./tkztabbloc"
import InputChoice from "./input/inputchoice"
import TableBloc from "./tablebloc"

function parseBloc(line:string):Bloc|null {
    const regex = /^<(\w+)\s*(:\s*[^>/]+)?>$/
    const m = line.match(regex)
    if (m=== null) {
        return null
    }
    const label = m[1]
    const paramsString = m[2] ? m[2].slice(1).trim() : ''
    if (TableBloc.LABELS.includes(label)) {
        return new TableBloc(label, paramsString)
    }
    if (TextBloc.LABELS.includes(label)) {
        return new TextBloc(label, paramsString)
    }
    if (InputTextBloc.LABEL == label) {
        return new InputTextBloc(label, paramsString)
    }
    if (RadioBloc.LABEL == label) {
        return new RadioBloc(label, paramsString)
    }
    if (InputEnsemble.LABEL == label) {
        return new InputEnsemble(label, paramsString)
    }
    if (FormBloc.LABELS.includes(label)) {
        return new FormBloc(label, paramsString, false)
    }
    if (GraphBloc.LABELS.includes(label)) {
        return new GraphBloc(label, paramsString, false)
    }
    if (ChoiceBloc.LABELS.includes(label)) {
        return new ChoiceBloc(label, paramsString)
    }
    if (InputChoice.LABELS.includes(label)) {
        return new InputChoice(label, paramsString)
    }
    if (TkzTabBloc.LABELS.includes(label)) {
        return new TkzTabBloc(label, paramsString)
    }
    return new Bloc(label, paramsString, false)
}

export { parseBloc }
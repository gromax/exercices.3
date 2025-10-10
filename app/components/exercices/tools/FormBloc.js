import Bloc from "./bloc";

class FormBloc extends Bloc {
    static LABELS = ['form', 'formulaire'];
    static FIELDS = ['input', 'radio'];
    constructor(label, paramsString, closed) {
        super(label, paramsString, closed);
        this.setParam('type', label);
        this.setParam('fields', []);
    }

    run(params, options={}) {
        if (this._executionChildren) {
            // déjà exécuté
            return this;
        }
        super.run(params, options);
        // pour un bloc de formulaire ne conserve que les blocs de texte et les champs
        this._executionChildren = this._executionChildren.filter(
            item => (item instanceof TextBloc) || (FormBloc.FIELDS.includes(item.label))
        );
        this.setParam('fields', this._executionChildren.filter(item => item instanceof Bloc && item.label === 'field').map(item => item.params));
        return this;
    }

    toView(params, options) {
        const result = this.run(params, options);
        return new FormView({
            fields: this._params["fields"] || [],
            content: result.content,
        });
    }
}

export default FormBloc;

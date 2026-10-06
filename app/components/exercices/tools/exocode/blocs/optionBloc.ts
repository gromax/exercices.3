import { ContentBloc } from './contentbloc'

class OptionBloc extends ContentBloc {
    static readonly LABELS = ['option']
    static readonly NEEDS_ID = true
    static readonly HAS_OPTIONS = true
    private readonly _identifiant: string

    constructor(tag:string, identifiant:string) {
        super(tag)
        this._identifiant = identifiant
    }

    parseOption():[string, string, Record<string, string>] {
        if (this._identifiant === '') {
            throw new Error("Un bloc <option> doit avoir une étiquette <option:étiquette>")
        }
        this.run({})
        const options:Record<string, string> = {}
        if (this._options) {
            for (const option of this._options) {
                if (options[option.key] !== undefined) {
                    console.warn(`La clé ${option.key} est définie plusieurs fois dans les options d'un même bloc <option>`)
                }
                options[option.key] = option.value
            }
        }
        return [this._identifiant, this._defaultOption, options]
    }
}

export { OptionBloc }
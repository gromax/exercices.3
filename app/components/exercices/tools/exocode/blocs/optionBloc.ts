import { ContentBloc } from './bloc'

class OptionBloc extends ContentBloc {
    static readonly LABELS = ['option']
    readonly HAS_OPTIONS = true

    constructor(tag:string, paramsString:string) {
        super(tag, paramsString, false)
    }

    parseOption():[string, string, Record<string, string>] {
        if (this._paramsString === '') {
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
        return [this._paramsString, this._defaultOption, options]
    }
}

export { OptionBloc }
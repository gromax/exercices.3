import Bloc from "./bloc";
import TkzTabView from "../blocsviews/tkztabview";
import Colors from "../colors";

class TkzTabBloc extends Bloc {
    static LABELS = ['tkztab'];

    constructor(label, paramsString) {
        super(label, paramsString, false);
        this._lines = [];
        this._color = 'black';
    }

    /**
     * Définir les couleurs à utiliser
     * @param {Colors} colors 
     */
    setColors(colors) {
        this._colors = colors;
    }

    _customView(answers) {
        if (this.params.xlist === undefined) {
            throw new Error("<tkztab/> Le paramètre 'xlist' est obligatoire.");
        }

        const config = {
            color: this._color,
            xtag: this._params.tag || "$x$",
        }

        if (this.params.pixelsperline !== undefined) {
            config.pixelsYUnit = Number(this.params.pixelsperline);
        }
        if (this.params.lgt !== undefined) {
            config.lgt = Number(this.params.lgt);
        }
        if (this.params.espcl !== undefined) {
            config.espcl = Number(this.params.espcl);
        }
        if (this.params.margin !== undefined) {
            config.margin = Number(this.params.margin);
        }
        if (this.params.headerheight !== undefined) {
            config.headerHeight = Number(this.params.headerheight);
        }

        return new TkzTabView({
            xlist: this.params.xlist,
            lines: this._lines,
            config
        });
    }

    setParam(key, value) {
        if ((key === 'var') || (key === 'sign')) {
            const items = value.split(':')
            if (items.length !== 3) {
                throw new Error(`<${key}:${value}/> Le paramètre '${key}' est mal formé.`);
            }
            const tag = items[0].trim();
            const hauteur = parseInt(items[1].trim());
            if (isNaN(hauteur) || hauteur < 1) {
                throw new Error(`<${key}:${value}/> La hauteur doit être un entier supérieur ou égal à 1.`);
            }
            const line = items[2].trim();
            this._lines.push({type: key, tag, hauteur, line});
            return;
        }
        if (key === 'color') {
            const n = parseInt(value);
            if (!isNaN(n)) {
                value = this._colors.getColor(n);
            }
            this._color = value;
            return;
        }
        super.setParam(key, value);
    }

}

export default TkzTabBloc;


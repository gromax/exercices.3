import TabVarLine from "./tabvarline"

class TabVarLineForm extends TabVarLine {
    _renderRight () {
        for (let item of this._values) {
            item.renderButton(this._hauteur, this._y0, this._svg)
        }
        super._renderRight()
    }
}

export default TabVarLineForm
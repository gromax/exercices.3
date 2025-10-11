import Bloc from "./bloc";
import { FormView } from "../run/views";

class FormBloc extends Bloc {
    static LABELS = ['form', 'formulaire'];
    _customView() {
        const subViews = [];
        for (const child of this._executionChildren) {
            if (typeof child.view === "function") {
                const subView = child.view();
                subViews.push(subView);
            }
        }
        const formView = new FormView({
            name: this.header,
            subViews: subViews
        });
        return formView;
    }
}

export default FormBloc;

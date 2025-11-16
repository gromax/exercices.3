import nerdamer from 'nerdamer';
import 'nerdamer/all';

function variablesInExpression(expr) {
    try {
        const parsed = nerdamer(String(expr));
        // nerdamer(...).variables() renvoie les symboles non numériques trouvés
        const vars = typeof parsed.variables === 'function' ? parsed.variables() : [];
        return vars;
    } catch (e) {
        // parsing error => pas numérique
        return [];
    }
}

export { variablesInExpression };
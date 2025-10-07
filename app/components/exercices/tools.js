import MainBloc from './tools/mainbloc.js';


class Tools {
    /**
     * Fonction d'initialisation des paramètres d'un exercice
     * Certains paramètres pouvant être aléatoire
     * on peut prévoir des reboot si certaines conditions sont insatisfaites
     * réessaie jusqu'à 50 fois avant de renvoyer une erreur
     * @param {string} text 
     * @param {object} options 
     * @returns {object}
     */
    static initExoParams(text, options) {
        for (let attempt = 1; attempt <= 50; attempt++) {
            const result = Tools.initExoParamsOneTry(text, options);
            if (result !== null) {
                return result;
            }
        }
        throw new Error("Impossible d'initialiser les paramètres de l'exercice après 50 essais.");
    }

    /**
     * Fonction d'initialisation des paramètres d'un exercice
     * Fait un essain unique de résolution des paramètres
     * @param {string} text 
     * @param {object|null} options 
     * @param {object} params paramètres déjà connus
     */
    static initExoParamsOneTry(text, options, params) {
        params = params || {};
        options = options || {};
        if (typeof options === 'string') {
            options = JSON.parse(options);
        }
        text = text || "";
        const main = MainBloc.parse(text, true);
        return main.getInit(params, options);
    }

    /**
     * Produit l'objet décrivant les options possibles
     * Une option doit s'écrire sous la forme :
     * <option name>
     * # description optionnelle
     * key => label
     * ...
     * </option>
     * La valeur par défaut est toujours la première
     * la clé DOIT être numérique
     * @param {*} content 
     * @returns 
     */
    static parseOptions(content) {
        const main = MainBloc.parse(content, false);
        return main.parseOptions();
    }

}


export default Tools;
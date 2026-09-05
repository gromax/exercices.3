<?php
    // C'est la classe de l'utilisateur connecté

namespace BDDObject;
use ErrorController as EC;
use SessionController as SC;

class Logged extends User
{
    const TIME_OUT = 5400; // durée d'inactivité avant déconnexion = 90min
    const SAVE_CONNEXION_ATTEMPTS_IN_BDD = true;
    /**
     * Indique si l'utilisateur est en mode administrateur
     * @var bool Indique si l'utilisateur est en mode administrateur
     */
    protected $_isInAdminMode;

    ##################################### METHODES STATIQUES #####################################

    /**
     * Récupère l'utilisateur connecté à partir du token de session
     * @return Logged L'utilisateur connecté
     */
    public static function getFromToken()
    {
        $data = SC::readToken();
        if ($data === null)
        {
            return new Logged();
        }
        return new Logged($data);
    }

    /**
     * Tente de connecter un utilisateur avec un identifiant et un mot de passe
     * @param string $identifiant L'identifiant de l'utilisateur (email)
     * @param string $pwd Le mot de passe de l'utilisateur
     * @return Logged|null L'utilisateur connecté si la connexion réussit, null sinon
     */
    public static function tryConnexion($identifiant, $pwd)
    {
        if ($identifiant !== ''){
            if ($pwd === "") {
                EC::addError("Vous avez envoyé un mot de passe vide ! Essayez de réactualiser la page (CTRL+F5)");
                EC::set_error_code(422);
                return null;
            }

            $results = User::getList(array(
                'wheres' => array('email' => $identifiant),
                'forcecols' => ['hash']
            ));
            if (count($results) == 0)
            {
                EC::addError("Mot de passe ou identifiant invalide.");
                EC::set_error_code(422);
                return null;
            }
            $result = $results[array_key_first($results)];
            $hash = $result['hash'];
            if (($hash=="") || (password_verify($pwd, $hash)))
            {
                // Le hash correspond, connexion réussie
                //$bdd_result["pwd"] = $pwd;
                return new Logged($result);
            }
        }
        EC::addError("Mot de passe ou identifiant invalide.");
        EC::set_error_code(422);
        return null;
    }

    /**
     * Récupère les données complètes de l'utilisateur connecté
     * @return Logged L'utilisateur connecté avec toutes ses données
     */
    public static function getFullData()
    {
        $uLog = Logged::getFromToken();
        if ($uLog->isOff())
        {
            return $uLog;
        }
        $results = User::getList([
            'wheres' => [
                'id' => (integer) $uLog->getId(),
                'email' => $uLog->get('email')
            ]
        ]);
        if (count($results) == 0) {
            return new Logged();
        }
        $result = $results[array_key_first($results)];
        return new Logged($result);
    }

    ##################################### METHODES #####################################

    /**
     * Constructeur de l'objet Logged
     * @param array $params Paramètres pour initialiser l'objet
     */
    public function __construct($params=array())
    {
        parent::__construct($params);
        if (!isset($params['adminMode'])) {
            $params['adminMode'] = false;
        }
        $this->_isInAdminMode = $params['adminMode'];
    }

    /**
     * Prépare les données de l'utilisateur pour le token de session
     * @return array Données de l'utilisateur pour le token
     */
    public function dataForToken()
    {
        $data = parent::dataForToken();
        if ($this->get("rank") === User::RANK_ADMIN) {
            $data['adminMode'] = $this->_isInAdminMode;
        }
        return $data;
    }

    /**
     * Définit le mode administrateur pour l'utilisateur
     * @param bool $mode true pour activer le mode administrateur, false pour le désactiver
     */
    public function setAdminMode($mode)
    {
        if ($this->get("rank") === User::RANK_ADMIN) {
            $this->_isInAdminMode = (bool) $mode;
        }
    }

    /**
     * Indique si l'utilisateur est un administrateur
     * @return bool true si l'utilisateur est un administrateur, false sinon
     */
    public function isAdmin()
    {
        return ($this->get("rank") === User::RANK_ROOT) || (($this->get("rank") === User::RANK_ADMIN) && $this->_isInAdminMode);
    }

    /**
     * Indique si l'utilisateur est un professeur
     * @return bool true si l'utilisateur est un professeur, false sinon
     */
    public function isProf()
    {
        return ($this->get("rank") === User::RANK_PROF) || (($this->get("rank") === User::RANK_ADMIN) && !$this->_isInAdminMode);
    }

    /**
     * Indique si l'utilisateur peut être promu en admin
     * @return bool true si l'utilisateur peut être promu en admin, false sinon
     */
    public function promotable()
    {
        return $this->get("rank") === User::RANK_ADMIN && !$this->_isInAdminMode;
    }

    /**
     * Convertit l'objet Logged en tableau
     * @return array Tableau représentant l'objet Logged
     */
    public function toArray()
    {
        $data = parent::toArray();
        if ($this->get("rank") === User::RANK_ADMIN) {
            $data['adminMode'] = $this->_isInAdminMode;
        }
        return $data;
    }

}

?>

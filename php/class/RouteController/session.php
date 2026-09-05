<?php

namespace RouteController;
use ErrorController as EC;
use SessionController as SC;
use BDDObject\User;
use BDDObject\Logged;
use BDDObject\Message;
use BDDObject\InitKey;

class session
{
    /**
     * paramètres de la requête
     * @var array Les paramètres de la requête
     */
    private $params;

    /**
     * Constructeur
     * @param array $params Les paramètres de la requête
     */
    public function __construct($params)
    {
        $this->params = $params;
    }

    /**
     * Récupère les informations de session de l'utilisateur connecté
     * @return array Les données de session de l'utilisateur
     */
    public function fetch()
    {
        $uLog = Logged::getFromToken();
        $data = $this->getData($uLog);
        // ajout du token si l'utilisateur est connecté
        if (!$uLog->isOff())
        {
            return array_merge(
                $data,
                [
                    "token" => SC::makeToken($uLog->dataForToken())
                ]
            );
        }
        return $data;
    }

    /**
     * Passe l'utilisateur connecté en mode administrateur
     * @return array|false Les données de session mises à jour ou false en cas d'erreur
     */
    public function promoteAdmin()
    {
        $uLog = Logged::getFromToken();
        if (!$uLog->promotable())
        {
            EC::addError("Cette commande ne s'applique pas à cet utilisateur, dans son état actuel.");
            EC::set_error_code(404);
            return false;
        }
        $uLog->setAdminMode(true);
        return [
            "token" => SC::makeToken($uLog->dataForToken())
        ];
    }

    /**
     * Passe l'utilisateur connecté en mode non administrateur
     * @return array|false Les données de session mises à jour ou false en cas d'erreur
     */
    public function demoteFromAdmin()
    {
        $uLog = Logged::getFromToken();
        if (!$uLog->isAdmin() || $uLog->isRoot())
        {
            EC::addError("Cette commande ne s'applique pas à cet utilisateur, dans son état actuel.");
            EC::set_error_code(404);
            return false;
        }
        $uLog->setAdminMode(false);
        return [
            "token" => SC::makeToken($uLog->dataForToken())
        ];
    }

    /**
     * Tente de connecter un utilisateur avec un identifiant et un mot de passe
     * @return array|false Les données de session de l'utilisateur connecté ou false en cas d'erreur
     */
    public function insert()
    {
        $data = json_decode(file_get_contents("php://input"),true);

        if (isset($data['identifiant']) && isset($data['pwd']))
        {
            $identifiant=$data['identifiant'];
            $pwd=$data['pwd'];
        }
        else
        {
            EC::set_error_code(501);
            return false;
        }

        $logged = Logged::tryConnexion($identifiant, $pwd);

        if ($logged == null)
        {
            return array("errors" => array(
                "pwd" => array("Identifiant ou mot de passe incorrect"),
                "identifiant" => array("Identifiant ou mot de passe incorrect")
            ) );
        }
        $logged->updateTime();

        $jwt = SC::makeToken($logged->dataForToken());
        return array(
            "logged" => $logged->toArray(),
            "unread" => Message::unReadNumber($logged->getId()),
            "token" => $jwt
        );
    }

    /**
     * Permet à un administrateur de se connecter en tant qu'un autre utilisateur
     * @return array|false Les données de session de l'utilisateur connecté ou false en cas d'erreur
     */
    public function sudo()
    {
        $uLog = Logged::getFromToken();
        if (!$uLog->isAdmin())
        {
            EC::addError("Vous n'avez pas les droits pour exécuter un sudo.");
            EC::set_error_code(404);
            return false;
        }
        $id = $this->params["id"];
        $userToConnect = User::getObject($id);
        if ($userToConnect==null)
        {
            EC::addError("L'utilisateur #$id n'existe pas.");
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isStronger($userToConnect))
        {
            EC::addError("L'utilisateur $id a un rang trop élevé.");
            EC::set_error_code(403);
            return false;
        }

        return [
            "logged"=> array_merge(
                $userToConnect->toArray(),
                array("unread"=>Message::unReadNumber($userToConnect->getId())),
            ),
            "token" => SC::makeToken($userToConnect->dataForToken())
        ];
    }

    /**
     * Récupère les données de session de l'utilisateur connecté
     * @param Logged|null $log L'utilisateur connecté (optionnel)
     * @return array Les données de session de l'utilisateur
     */
    protected function getData($log = null)
    {
        $uLog = $log === null ? Logged::getFullData() : $log;
        if ($uLog->isOff()) {
            return [ "logged"=>$uLog->toArray() ];
        }
        return [
            "logged"=>array_merge(
                $uLog->toArray(),
                array("unread"=>Message::unReadNumber($uLog->getId()) )
            ),
            "messages"=>EC::messages()
        ];
    }

    /**
     * Connecte un utilisateur en utilisant une clé d'initialisation
     * @return array|false Les données de session de l'utilisateur connecté ou false en cas d'erreur
     */
    public function logOnKey()
    {
        $key = $this->params["key"];
        $keys = InitKey::getList([
          'wheres' => ['initKey' => $key]
        ]);
        if (count($keys) === 0)
        {
            EC::set_error_code(404);
            return false;
        }
        $item = $keys[array_key_first($keys)];
        $idUser = $item['idUser'];
        InitKey::deleteFromIdUser($idUser);
        $user = User::getObject($idUser);
        if ($user === null) {
            EC::set_error_code(404);
            return false;
        }
        $uLog = new Logged($user->toArray());
        $uLog->updateTime();
        $jwt = SC::makeToken($uLog->dataForToken());
        return array(
            "logged" => $uLog->toArray(),
            "unread" => Message::unReadNumber($uLog->getId()),
            "token" => $jwt
        );
    }
}
?>

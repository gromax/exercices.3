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
     * paramères de la requète
     * @array
     */
    private $params;
    /**
     * Constructeur
     */
    public function __construct($params)
    {
        $this->params = $params;
    }

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

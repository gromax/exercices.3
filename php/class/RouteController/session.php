<?php

namespace RouteController;
use ErrorController as EC;
use SessionController as SC;
use BDDObject\User;
use BDDObject\Logged;
use BDDObject\Message;

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
        $uLog = Logged::getConnectedUser();
        $data = $this->getData($uLog);
        // ajout du token si l'utilisateur est connecté
        if ($uLog->connexionOk()) {
            return array_merge(
                $data,
                array("token" => SC::make_token($uLog->getId(), $uLog->getEmail(), $uLog->getRank()) )
            );
        }
        return $data;
    }

    public function delete()
    {
        return $this->getData(null);
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

        $data = $logged->toArray();
        $jwt = SC::make_token($data['id'], $data['email'], $data['rank']);
        return array(
            "logged" => $logged->toArray(),
            "unread" => Message::unReadNumber($logged->getId()),
            "token" => $jwt
        );
    }

    public function sudo()
    {
        $uLog = Logged::getConnectedUser();
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

        return array(
            "logged"=> array_merge(
                $userToConnect->toArray(),
                array("unread"=>Message::unReadNumber($userToConnect->getId())),
            ),
            "token"=>SC::make_token($userToConnect->getId(), $userToConnect->getEmail(), $userToConnect->getRank())
        );
    }

    public function logged()
    {
        $uLog = Logged::getConnectedUser();
        if ($uLog === null) $uLog = Logged::getConnectedUser();
        # On teste seulement si l'utilisateur est connecté
        # sans remettre à jour son time
        return array( "logged"=>$uLog->connexionOk() );
    }


    protected function getData($uLog = null)
    {
        if ($uLog === null) $uLog = Logged::getConnectedUser();
        if ($uLog->connexionOk()) {
            if($uLog->isRoot()) {
                return array(
                    "logged"=>array_merge(
                        $uLog->toArray(),
                        array("unread"=>Message::unReadNumber($uLog->getId()) )
                    ),
                    "messages"=>EC::messages()
                );
            } elseif ($uLog->isAdmin()) {
                return array(
                    "logged"=>array_merge(
                        $uLog->toArray(),
                        array("unread"=>Message::unReadNumber($uLog->getId()) )
                    ),
                    "messages"=>EC::messages()
                );
            } elseif ($uLog->isProf()) {
                return array(
                    "logged"=>array_merge(
                        $uLog->toArray(),
                        array("unread"=>Message::unReadNumber($uLog->getId()) )
                    ),
                    "messages"=>EC::messages()
                );
            } else {
                return array(
                    "logged"=>array_merge(
                        $uLog->toArray(),
                        array("unread"=>Message::unReadNumber($uLog->getId()) )
                    ),
                    "messages"=>EC::messages()
                );
            }
        }
        return array(
            "logged"=>$uLog->toArray()
        );
    }

    public function reinitMDP()
    {
        $key = $this->params["key"];
        Logged::tryConnexionOnInitMDP($key);
        $uLog = Logged::getConnectedUser();
        if ($uLog->connexionOk())
        {
            return $data = $this->getData($uLog);
        }
        else
        {
            EC::set_error_code(401);
            return false;
        }
    }
}
?>

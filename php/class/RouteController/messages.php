<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Message;
use BDDObject\User;
use BDDObject\Logged;
use BDDObject\Note;

class messages
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
    /**
     * renvoie les infos sur l'objet d'identifiant id
     * @return array
     */

    public function delete()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        else
        {
            $id = (integer) $this->params['id'];
            $message=Message::getObject($id);
            if ($message === null)
            {
                EC::set_error_code(404);
                return false;
            }
            elseif($uLog->isAdmin() || $message->isOwnedBy($uLog))
            {
                if ($message->delete())
                    return array( "message" => "Model successfully destroyed!");
            }
            else
            {
                EC::set_error_code(403);
                return false;
            }
        }
        EC::set_error_code(501);
        return false;
    }

    public function insert()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
        $data["idOwner"] = $uLog->getId();

        // Si l'utilisateur est élève, le dest est forcément le prof
        if ($uLog->isEleve()) {
            $classe = $uLog->getClasse();
            if ($classe ==null) {
                EC::set_error_code(501);
                return false;
            } else {
                $data["idDest"] = $classe->toArray()["idOwner"];
            }
        }

        if (!isset($data["aUE"])) {
            $aUE = 0;
            $data["aUE"] = 0;
        } else {
            $aUE = (integer) $data["aUE"];
            if ($aUE !==0) {
                // Il s'agit de savoir si l'insertion est authorisée
                $oUE = Note::getObject($aUE);
                if ($oUE === null) {
                    EC::set_error_code(404);
                    return false;
                }
                // maintenant toute personne pouvant modifier la fiche peut écrire un message
                if (!$oUE->writeAllowed($uLog)) {
                    EC::set_error_code(403);
                    return false;
                }
                // Dans le cas où l'auteur n'est pas un admin, le destinataire est forcément l'élève
                if (!$uLog->isEleve()) {
                    $data["idDest"] = $oUE->idOwner();
                }
            }
        }

        if (!isset($data["idDest"])){
            EC::set_error_code(501);
            return false;
        }

        $message = new Message($data);
        $idMessage = $message->insertion();
        if ($idMessage!==null) {
            if ($uLog->isEleve()) {
                $destName = 'Prof';
            } else {
                $destName = $message->getDestName();
            }
            $output = $message->toArray();
            $output["destName"] = $destName;
            $output["lu"] = true;
            $output["ownerName"] = "Moi";
            return $output;
        }
        // Si on en arrive là, erreur
        EC::set_error_code(501);
        return false;
    }

    public function setLu()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        $id = (integer) $this->params['id'];
        $message = Message::getObject($id);
        if ($message === null) {
            EC::set_error_code(404);
            return false;
        }
        if (!$message->isDestTo($uLog)) {
            EC::set_error_code(403);
            return false;
        }
        $setOk = $message->setLu();
        if ($setOk === true) {
            return true;
        }
        EC::set_error_code(501);
        return false;
    }
}
?>

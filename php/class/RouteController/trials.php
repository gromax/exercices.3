<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Trial;
use BDDObject\Unfinished;
use BDDObject\Logged;

class trials
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

    public function delete()
    {
        $uLog=Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::addError("Utilisateur non connecté");
            EC::set_error_code(401);
            return false;
        }
        // effacement sans intérêt même pour un professeur
        if (!$uLog->isAdmin())
        {
            EC::addError("Accès interdit.");
            EC::set_error_code(403);
            return false;
        }

        $id = (integer) $this->params['id'];
        $oTrial=Trial::getObject($id);
        if ($oTrial === null)
        {
            EC::addError("Essai introuvable.");
            EC::set_error_code(404);
            return false;
        }
        
        if ($oTrial->delete())
        {
            return array( "message" => "Model successfully destroyed!");
        }
        EC::set_error_code(501);
        return false;
    }

    public function insert()
    {
        $uLog=Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::addError("Utilisateur non connecté.");
            EC::set_error_code(401);
            return false;
        }
        if (!$uLog->isEleve())
        {
            EC::addError("Action autorisée seulement aux élèves.");
            EC::set_error_code(403);
            return false;
        }

        $data = json_decode(file_get_contents("php://input"),true);
        $idExoDevoir = (integer) $data['idExoDevoir'];
        $idUser = (integer) $data['idUser'];
        if (Trial::insertAllowed($idExoDevoir, $idUser) === false)
        {
            EC::addError("Insertion non autorisée pour cet essai.");
            EC::set_error_code(403);
            return false;
        }
        $oTrial = new Unfinished($data);
        $response = $oTrial->insert();
        if ($response === null) {
            EC::set_error_code(501);
            return false;
        }
        if (is_array($response)) {
            // erreur de validation
            EC::set_error_code(422);
            return $response;
        }
        // nécessite un chargement complet pour récupérer les données liées
        return $oTrial->toArray();
    }

    public function update()
    {
        $uLog=Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::addError("Utilisateur non connecté.");
            EC::set_error_code(401);
            return false;
        }
        $id = (integer) $this->params['id'];
        $oTrial = Trial::getObject($id);
        if ($oTrial === null)
        {
            EC::addError("Essai introuvable.");
            EC::set_error_code(404);
            return false;
        }
        if ($oTrial->get("idUser") !== $uLog->getId())
        {
            EC::addError("Pas les droits pour modifier cet essai.");
            EC::set_error_code(403);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
      
        $response = $oTrial->update($data);
        if (is_array($response))
        {
            // erreurs de validation
            EC::set_error_code(422);
            return $response;
        }
        if ($response === false)
        {
            EC::set_error_code(501);
            return false;
        }
        return $oTrial->toArray();
    }

}
?>

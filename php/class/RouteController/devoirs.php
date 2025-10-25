<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Devoir;
use BDDObject\Logged;

class devoirs
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
            EC::addError("Utilisateur non connecté.");
            EC::set_error_code(401);
            return false;
        }
        if (!$uLog->isProf(true))
        {
            EC::addError("Interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }

        $id = (integer) $this->params['id'];
        $devoir=Devoir::getObject($id);
        if ($devoir === null)
        {
            EC::addError("Devoir introuvable.");
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isAdmin() && $devoir->get("idOwner") !== $uLog->getId())
        {
            EC::addError("Interdit, vous n'êtes pas le propriétaire du devoir.");
            EC::set_error_code(403);
            return false;
        }
        if ($devoir->delete())
        {
            return array( "message" => "Model successfully destroyed!");
        }
        EC::set_error_code(501);
        return false;
    }

    public function insert()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::addError("Utilisateur non connecté.");
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve()) {
            // Interdit pour élève
            EC::addError("Interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
        $data["idOwner"] = $uLog->getId();
        $devoir = new Devoir($data);
        $response = $devoir->insert();
        if ($response ===null)
        {
            EC::set_error_code(501);
            return false;
        }
        if (is_array($response))
        {
            // erreur de validation
            EC::set_error_code(422);
            return $response;
        }
        return $devoir->toArray();
    }

    public function update()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::addError("Utilisateur non connecté.");
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve()) {
            // Interdit pour élève
            EC::addError("Interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }
        $id = (integer) $this->params['id'];
        $devoir=Devoir::getObject($id);
        if ($devoir === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isAdmin() && $devoir->get("idOwner") !== $uLog->getId())
        {
            // pas propriétaire ni admin
            EC::addError("Tentative de mise à jour d'un devoir sans autorisation.");
            EC::set_error_code(403);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
        $response = $devoir->update($data);
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
        return $devoir->toArray();
    }
}
?>

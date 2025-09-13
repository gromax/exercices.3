<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Fiche;
use BDDObject\ExoFiche;
use BDDObject\Note;
use BDDObject\Exam;
use BDDObject\AssoUF;
use BDDObject\Logged;

class fiches
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
        if (!$uLog->isProf(true))
        {
            EC::set_error_code(403);
            return false;
        }

        $id = (integer) $this->params['id'];
        $fiche=Fiche::getObject($id);
        if ($fiche === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if ($uLog->isAdmin() || $fiche->isOwnedBy($uLog))
        {
            if ($fiche->delete())
            {
                return array( "message" => "Model successfully destroyed!");
            }
        }
        else
        {
            EC::set_error_code(403);
            return false;
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
        if ($uLog->isEleve()) {
            // Interdit pour élève
            EC::set_error_code(403);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
        $data["idOwner"] = $uLog->getId();
        $fiche = new Fiche($data);
        $id = $fiche->insertion();
        if ($id!==null)
        {
            return $fiche->toArray();
        }
        // Si on en arrive là, erreur
        EC::set_error_code(501);
        return false;
    }

    public function update()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve()) {
            // Interdit pour élève
            EC::set_error_code(403);
            return false;
        }
        $id = (integer) $this->params['id'];
        $fiche=Fiche::getObject($id);
        if ($fiche === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if ($uLog->isAdmin() || $fiche->isOwnedBy($uLog))
        {
           $data = json_decode(file_get_contents("php://input"),true);
           $modOk = $fiche->update($data);
           if ($modOk === true)
           {
               return $fiche->toArray();
           }
        }
        else
        {
            // Interdit, pas propriétaire ni admin
            EC::set_error_code(403);
            return false;
        }
        EC::set_error_code(501);
        return false;
    }

}
?>

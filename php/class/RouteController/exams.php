<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Fiche;
use BDDObject\Exam;
use BDDObject\Logged;

class exams
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
        if ($uLog->isEleve())
        {
            EC::set_error_code(403);
            return false;
        }

        $id = (integer) $this->params['id'];
        $exam=Exam::getObject($id);
        if ($exam === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if ($uLog->isAdmin() || $exam->getFiche()->isOwnedBy($uLog))
        {
            if ($exam->delete())
                return array( "message" => "Model successfully destroyed!");
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
        if ($uLog->isEleve())
        {
            EC::set_error_code(403);
            return false;
        }

        $data = json_decode(file_get_contents("php://input"),true);
        $idFiche = (integer) $data['idFiche'];
        $fiche = Fiche::getObject($idFiche);
        if ($fiche===null)
        {
            EC::set_error_code(404);
            return false;
        }
        if ($uLog->isAdmin() || $fiche->isOwnedBy($uLog))
        {
            $exam = new Exam($data);
            $id = $exam->insertion();
            if ($id!==null){
                return $exam->toArray();
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

    public function update()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        $id = (integer) $this->params['id'];
        $exam = Exam::getObject($id);
        if ($exam === null)
        {
            EC::set_error_code(404);
            return false;
        }

        if ($uLog->isAdmin() || $exam->getFiche()->isOwnedBy($uLog))
        {
            $data = json_decode(file_get_contents("php://input"),true);
            $modOk = $exam->update($data);
            if ($modOk === true)
            {
                return $exam->toArray();
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

}
?>

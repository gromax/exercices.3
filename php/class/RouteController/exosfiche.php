<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Fiche;
use BDDObject\ExoFiche;
use BDDObject\Logged;

class exosfiche
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

    public function fetch()
    {
        $uLog =Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }

        $id = (integer) $this->params['id'];
        $exoFiche = ExoFiche::getObject($id);
        if ($exoFiche===null)
        {
            EC::set_error_code(404);
            return false;
        }
        $fiche = $exoFiche->getFiche();
         if ( $uLog->isAdmin() || ($uLog->isProf() && $fiche->isOwnedBy($uLog)) )
        {
            return $exoFiche->toArray();
        }
        else
        {
            EC::set_error_code(403);
            return false;
        }
    }


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
        $exofiche=ExoFiche::getObject($id);
        if ($exofiche === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if ($uLog->isAdmin() || $exofiche->getFiche()->isOwnedBy($uLog))
        {
            if ($exofiche->delete())
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
            $exofiche = new ExoFiche($data);
            $id = $exofiche->insertion();
            if ($id!==null){
                return $exofiche->toArray();
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
        $exofiche = ExoFiche::getObject($id);
        if ($exofiche === null)
        {
            EC::set_error_code(404);
            return false;
        }

        if ($uLog->isAdmin() || $exofiche->getFiche()->isOwnedBy($uLog))
        {
            $data = json_decode(file_get_contents("php://input"),true);
            $modOk = $exofiche->update($data);
            if ($modOk === true)
            {
                return $exofiche->toArray();
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

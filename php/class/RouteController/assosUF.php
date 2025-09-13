<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Fiche;
use BDDObject\User;
use BDDObject\AssoUF;
use BDDObject\Logged;
use BDDObject\ExoFiche;
use BDDObject\Note;

class assosUF
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

    public function fetchList()
    {
        $uLog =Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        # Seul un élève est susceptible de charger directement sa liste d'assoc
        if ($uLog->isEleve())
        {
            return array(
                "exofiches" => ExoFiche::getList(array("idUser"=>$uLog->getId())),
                "assocs" => AssoUF::getList(array("idUser"=> $uLog->getId() )),
                "faits" => Note::getList(array("idUser"=>$uLog->getId()))
            );
        } else {
            EC::set_error_code(403);
            return false;
        }

        EC::set_error_code(501);
        return false;
    }

    /*public function fetchItem()
    {
        $id = (integer) $this->params['id'];
        $uLog =Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        # Seul un élève est susceptible de charger directement sa liste d'assoc
        if ($uLog->isEleve())
        {
            $exofiche = ExoFiche::get($id);
            if ( ($exofiche == null) || (((integer)$exofiche["idUser"]) != $uLog->getId()) ) {
                EC::set_error_code(404);
                return false;
            }
            // La fiche est bien associée à l'élève
            $fiche = Fiche::get($exofiche["idFiche"]);
            if ($fiche==null) {
                EC::set_error_code(501);
                return false;
            }
            if (!$fiche["visible"]) {
                EC::set_error_code(404);
                return false;
            }


            return array(
                "exofiche" => ExoFiche::get($id),
                "fiche" => AssoUF::getList(array("idUser"=> $uLog->getId() )),
                "faits" => Note::getList(array("idUser"=>$uLog->getId()))
            );
        } else {
            EC::set_error_code(403);
            return false;
        }

        EC::set_error_code(501);
        return false;
    }*/

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
        $oUF=AssoUF::getObject($id);
        if ($oUF === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if ( $uLog->isAdmin() || $uLog->isProf() && ($oUF->isOwnedBy($uLog) || $oUF->isMyTeacher($uLog)) )
        {
            if ($oUF->delete())
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
        $idUser = (integer) $data['idUser'];
        if ((($fiche = Fiche::getObject($idFiche))===null) || (($user = User::getObject($idUser))===null))
        {
            EC::set_error_code(404);
            return false;
        }

        if ($uLog->isAdmin() || ($fiche->isOwnedBy($uLog) && $user->isMyTeacher($uLog) ))
        {
            $oUF = new AssoUF($data);
            $id = $oUF->insertion();
            if ($id!==null){
                return $oUF->toArray();
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
        $oUF = AssoUF::getObject($id);
        if ($oUF === null)
        {
            EC::set_error_code(404);
            return false;
        }

        if ( $uLog->isAdmin() || $uLog->isProf() && ($oUF->isOwnedBy($uLog) || $oUF->isMyTeacher($uLog)) )
        {
            $data = json_decode(file_get_contents("php://input"),true);
            $modOk = $oUF->update($data);
            if ($modOk === true)
            {
                return $oUF->toArray();
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

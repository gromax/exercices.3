<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Note;
use BDDObject\ExoFiche;
use BDDObject\AssoUF;
use BDDObject\User;
use BDDObject\Logged;

class notes
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
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        $id = (integer) $this->params['id'];
        $note=Note::getObject($id);
        if ($note === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if ($uLog->isProf(true) && $note->writeAllowed($uLog))
        {
            if ($note->delete())
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

        $data = json_decode(file_get_contents("php://input"),true);
        $aEF = (integer) $data['aEF'];
        $aUF = (integer) $data['aUF'];
        $exoFiche = ExoFiche::getObject($aEF);

        // Recherche des items parents
        if (($exoFiche === null) || (($fiche = $exoFiche->getFiche()) === null) || (($oUF = AssoUF::getObject($aUF)) === null))
        {
            EC::set_error_code(404);
            return false;
        }

        // Vérification de la cohérence
        if ( $oUF->getIdFiche() !== $fiche->getId() )
        {
            // Situation incohérente
            EC::set_error_code(501);
            return false;
        }

        // Vérification des autorisations
        if (
            ($uLog->isAdmin()) ||
            ($uLog->isProf() && $fiche->isOwnedBy($uLog)) ||
            ( $uLog->isEleve() && ($oUF->getIdUser()==$uLog->getId()) )
        )
        {
            $data['idUser'] = $uLog->getId();
            $note = new Note($data);
            $id = $note->insertion();
            if ($id!==null)
            {
                return $note->toArray();
            }
        }
        else
        {
            EC::set_error_code(403);
            return false;
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
        $id = (integer) $this->params['id'];
        $note=Note::getObject($id);
        if ($note === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if ($note->writeAllowed($uLog))
        {
            $data = json_decode(file_get_contents("php://input"),true);
            if ($note->update($data))
            {
                return $note->toArray();
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

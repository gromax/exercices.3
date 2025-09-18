<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Conx;
use BDDObject\Logged;

class cons
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
        if (!$uLog->isAdmin())
        {
            EC::set_error_code(403);
            return false;
        }

        if (isset($this->params['id']))
        {
            $id = (integer) $this->params['id'];
            $conx = Conx::getObject($id);
            if ($conx===null)
            {
                EC::set_error_code(404);
                return false;
            }
            elseif ( $uLog->isAdmin() )
            {
                return $cons->toArray();
            }
            else
            {
                EC::set_error_code(403);
                return false;
            }
        }
        else
        {
            return Conx::getList();
        }

        EC::set_error_code(501);
        return false;
    }

    public function delete()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        if (!$uLog->isAdmin())
        {
            EC::set_error_code(403);
            return false;
        }

        $id = (integer) $this->params['id'];
        $conx=Conx::getObject($id);
        if ($conx === null)
        {
            EC::set_error_code(404);
            return false;
        }

        if ($conx->delete())
        {
            return array( "message" => "Model successfully destroyed!");
        }

        EC::set_error_code(501);
        return false;
    }

    public function purge()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        if (!$uLog->isAdmin())
        {
            EC::set_error_code(403);
            return false;
        }
        if (Conx::purge())
        {
            return array("message" => "Connexions logs successfully destroyed!");
        }
        EC::set_error_code(501);
        return false;
    }

}
?>

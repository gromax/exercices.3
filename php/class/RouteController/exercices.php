<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Exercice;

class exercices
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
        $id = (integer) $this->params['id'];
        $exercice = Exercice::getObject($id);
        if ($exercice===null)
        {
            EC::set_error_code(404);
            return false;
        }
        else
        {
            return $exercice->toArray();
        }
    }

    public function fetchList()
    {

        return Exercice::getList();
    }
}
?>

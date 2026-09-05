<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Exercice;
use BDDObject\Logged;

class exercices
{
    /**
     * Paramètres de la requête
     * @var array Les paramètres de la requête
     */
    private $params;

    /**
     * Constructeur
     * Initialise l'objet avec les paramètres de la requête
     * @param array $params Les paramètres de la requête
     */
    public function __construct($params)
    {
        $this->params = $params;
    }

    /**
     * Insère un nouvel exercice
     * @return array|false Les données de l'exercice inséré ou false en cas d'erreur
     */
    public function insert()
    {
        $uLog=Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve()) {
            // interdit pour élève
            EC::set_error_code(403);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
        $data["idOwner"] = $uLog->getId();
        $exercice = new Exercice($data);
        $reponse = $exercice->insert();

        if ($reponse === null)
        {
            EC::set_error_code(501);
            return false;
        }
        if (is_array($reponse))
        {
            // erreurs de validation
            EC::set_error_code(422);
            return $reponse;
        }
        return $exercice->toArray();
    }

    /**
     * Met à jour un exercice existant
     * @return array|false Les données de l'exercice mis à jour ou false en cas d'erreur
     */
    public function update()
    {
        $uLog=Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve()) {
            // Interdit pour élève
            EC::set_error_code(403);
            return false;
        }
        $id = (int) $this->params['id'];
        $exercice = Exercice::getObject($id);
        if ($exercice === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isAdmin() && ($exercice->get("idOwner") !== $uLog->getId()))
        {
            // Interdit, pas propriétaire ni admin
            EC::addError("Tentative de mise à jour d'un exercice sans autorisation.");
            EC::set_error_code(403);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
        $reponse = $exercice->update($data);
        if (is_array($reponse))
        {
            // erreurs de validation
            EC::set_error_code(422);
            return $reponse;
        }
        if ($reponse === false)
        {
            EC::set_error_code(501);
            return false;
        }
        return $exercice->toArray();
    }

    /**
     * Récupère un exercice par son ID
     * @return array|false Les données de l'exercice ou false en cas d'erreur
     */
    public function fetch()
    {
        $id = (int) $this->params['id'];
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

    /**
     * Récupère la liste de tous les exercices
     * @return array La liste des exercices
     */
    public function fetchList()
    {
        return Exercice::getList();
    }

    /**
     * Supprime un exercice par son ID
     * @return bool True si la suppression a réussi, false en cas d'erreur
     */
    public function delete()
    {
        $uLog=Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve()) {
            // interdit pour élève
            EC::set_error_code(403);
            return false;
        }
        $id = (int) $this->params['id'];
        $exercice = Exercice::getObject($id);
        if ($exercice === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isAdmin() && $exercice->get("idOwner") !== $uLog->getId())
        {
            // Interdit, pas propriétaire ni admin
            EC::set_error_code(403);
            return false;
        }
        if (!$exercice->delete())
        {
            EC::set_error_code(501);
            return false;
        }
        EC::add("Model successfully destroyed!");
        return true;
    }
}
?>

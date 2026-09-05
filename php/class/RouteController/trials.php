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
    private array $params;

    /**
     * Constructeur
     */
    public function __construct(array $params)
    {
        $this->params = $params;
    }

    /**
     * Récupère la liste des essais pour un utilisateur et un exercice/devoir donné.
     * @return array|false
     */
    public function getList()
    {
        $uLog=Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::addError("Utilisateur non connecté.");
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve())
        {
            EC::addError("Accès interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }
        $idUser = (int) $this->params['idUser'];
        $idExoDevoir = (int) $this->params['idExoDevoir'];
        if ($uLog->isProf())
        {
            $filter = [
                'wheres' => ['devoirs.idOwner' => $uLog->get('id')]
            ];
        }
        else {
            $filter = [
                'wheres' => []
            ];
        }
        $filter['wheres']['trials.idUser'] = $idUser;
        $filter['wheres']['trials.idExoDevoir'] = $idExoDevoir;
        return Trial::getList($filter);
    }

    /**
     * Supprime un essai donné.
     * @return array|false
     */
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

        $id = (int) $this->params['id'];
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

    /**
     * Insère un nouvel essai pour un utilisateur et un exercice/devoir donné.
     * @return array|false
     */
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
        $idExoDevoir = (int) $data['idExoDevoir'];
        $idUser = (int) $data['idUser'];
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

    /**
     * Met à jour un essai existant.
     * @return array|false
     */
    public function update()
    {
        $uLog=Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::addError("Utilisateur non connecté.");
            EC::set_error_code(401);
            return false;
        }
        $id = (int) $this->params['id'];
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
        // Tout s'est bien passé
        $output = $oTrial->toArray();
        // On va ajouter à l'output la note MAJ du devoir correspondant
        // ce calcul semble ne plus être requis
        // $output['noteDevoir'] = Note::getNote($oTrial->get("idExoDevoir"), $oTrial->get("idUser"));
        return $output;
    }

}
?>

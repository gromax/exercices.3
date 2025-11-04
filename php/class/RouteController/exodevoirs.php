<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\ExoDevoir;
use BDDObject\Devoir;
use BDDObject\Exercice;
use BDDObject\Logged;



class exodevoirs
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
      $uLog =Logged::getConnectedUser();
      if (!$uLog->connexionOk())
      {
        EC::addError("Utilisateur non connecté.");
        EC::set_error_code(401);
        return false;
      }

      if (isset($this->params['id']))
      {
        $id = (integer) $this->params['id'];
        return $this->fetchItem($id);
      }

      if ($uLog->isAdmin()) return ExoDevoir::getList();
      if ($uLog->isProf()) return ExoDevoir::getList([
        'wheres' => ['devoirs.idOwner'=> $uLog->getId()],
        'hideCols' => ['idOwner', 'idClasse']
      ]);
      if ($uLog->isEleve()) return ExoDevoir::getList([
        'wheres' => ['devoirs.idClasse' => $uLog->get("idClasse")],
        'hideCols' => ['idOwner', 'idClasse']
      ]);
      EC::addError("Pas les droits pour accéder aux associations.");
      EC::set_error_code(403);
      return false;
    }

    private function fetchItem($id) {
      $uLog =Logged::getConnectedUser();
      if (!$uLog->connexionOk())
      {
        EC::addError("Utilisateur non connecté.");
        EC::set_error_code(401);
        return false;
      }
      $oED = ExoDevoir::getObject($id);
      if ($oED===null)
      {
        EC::addError("Association introuvable.");
        EC::set_error_code(404);
        return false;
      }
      if ( $uLog->isAdmin() || $oED->get("idOwner") === $uLog->getId() || $oED->get("idClasse") === $uLog->get("idClasse") )
      {
        return $oED->toArray();
      }
      EC::addError("Pas les droits pour accéder à cette association.");
      EC::set_error_code(403);
      return false;
    }

    public function delete()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::addError("Utilisateur non connecté");
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve())
        {
            EC::addError("Interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }

        $id = (integer) $this->params['id'];
        $oED=ExoDevoir::getObject($id);
        if ($oED === null)
        {
            EC::addError("Association introuvable.");
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isAdmin() && $oED->get("idOwner") !== $uLog->getId())
        {
            EC::addError("Pas les droits pour supprimer cette association.");
            EC::set_error_code(403);
            return false;
        }
        if ($oED->delete())
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
        if ($uLog->isEleve())
        {
            EC::addError("Action interdite pour les élèves.");
            EC::set_error_code(403);
            return false;
        }

        $data = json_decode(file_get_contents("php://input"),true);
        $idDevoir = (integer) $data['idDevoir'];
        $idExo = (integer) $data['idExo'];
        $devoir = Devoir::getObject($idDevoir);
        if ($devoir === null)
        {
            EC::addError("Devoir introuvable.");
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isAdmin() && $devoir->get("idOwner") !== $uLog->getId())
        {
            EC::addError("Pas les droits pour modifier ce devoir.");
            EC::set_error_code(403);
            return false;
        }
        $exo = Exercice::getObject($idExo);
        if ($exo === null)
        {
            EC::addError("Exercice introuvable.");
            EC::set_error_code(404);
            return false;
        }
        $oED = new ExoDevoir($data);
        $response = $oED->insert();
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
        return ExoDevoir::getObject($oED->getId())->toArray();
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
        if ($uLog->isEleve())
        {
            EC::addError("Interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }
        $id = (integer) $this->params['id'];
        $oED = ExoDevoir::getObject($id);
        if ($oED === null)
        {
            EC::addError("Association introuvable.");
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isAdmin() && $oED->get("idOwner") !== $uLog->getId())
        {
            EC::addError("Pas les droits pour modifier cette association.");
            EC::set_error_code(403);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
        
        $currentNum = $oED->get("num");
        $nextNum = isset($data['num']) ? (integer) $data['num'] : $currentNum;
        
        $response = $oED->update($data);
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

        // réordonnancement demandé
        if (!$oED->reorder($currentNum, $nextNum))
        {
            return false;
        }
        return $oED->toArray();
    }

}
?>

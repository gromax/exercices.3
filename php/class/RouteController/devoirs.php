<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Devoir;
use BDDObject\ExoDevoir;
use BDDObject\Logged;

class devoirs
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
      $uLog =Logged::getFromToken();
      if ($uLog->isOff())
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

      if ($uLog->isAdmin()) return Devoir::getList();
      if ($uLog->isProf()) return Devoir::getList([
        'wheres' => ['idOwner'=> $uLog->getId()]
      ]);
      if ($uLog->isEleve()) return Devoir::getList([
        'wheres' => ['idClasse' => $uLog->get('idClasse')]
      ]);
      EC::addError("Pas les droits pour accéder aux devoirs.");
      EC::set_error_code(403);
      return false;
    }

    private function fetchItem($id) {
      $uLog =Logged::getFromToken();
      if ($uLog->isOff())
      {
        EC::addError("Utilisateur non connecté.");
        EC::set_error_code(401);
        return false;
      }
      $oDevoir = Devoir::getObject($id);
      if ($oDevoir===null)
      {
        EC::addError("Devoir introuvable.");
        EC::set_error_code(404);
        return false;
      }
      if ( $uLog->isAdmin() || $oDevoir->get("idOwner") === $uLog->getId() || $oDevoir->get("idClasse") === $uLog->get('idClasse') )
      {
        return $oDevoir->toArray();
      }
      EC::addError("Pas les droits pour accéder à ce devoir.");
      EC::set_error_code(403);
      return false;
    }

    public function delete()
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
            EC::addError("Interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }

        $id = (integer) $this->params['id'];
        $devoir=Devoir::getObject($id);
        if ($devoir === null)
        {
            EC::addError("Devoir introuvable.");
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isAdmin() && $devoir->get("idOwner") !== $uLog->getId())
        {
            EC::addError("Interdit, vous n'êtes pas le propriétaire du devoir.");
            EC::set_error_code(403);
            return false;
        }
        if ($devoir->delete())
        {
            return array( "message" => "Model successfully destroyed!");
        }
        EC::set_error_code(501);
        return false;
    }

    public function clone()
    {
        $uLog=Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::addError("Utilisateur non connecté.");
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve()) {
            // Interdit pour élève
            EC::addError("Interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }
        $id = (integer) $this->params['id'];
        $devoir=Devoir::getObject($id);
        if ($devoir === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isAdmin() && $devoir->get("idOwner") !== $uLog->getId())
        {
            // pas propriétaire ni admin
            EC::addError("Tentative de clonage d'un devoir sans autorisation.");
            EC::set_error_code(403);
            return false;
        }
        $newDevoir = $devoir->clone();
        $responseDevoir = $newDevoir->insert();
        if ($responseDevoir ===null)
        {
            EC::set_error_code(501);
            return false;
        }
        $exoDevoirs = ExoDevoir::getList([
            'wheres' => ['idDevoir' => $devoir->getId()]
        ]);
        foreach ($exoDevoirs as $exoDevoir) {
            $oExoDevoir = new ExoDevoir($exoDevoir);
            $newExoDevoir = new ExoDevoir([
                'idDevoir' => $newDevoir->getId(),
                'idExo' => $oExoDevoir->get('idExo'),
                'options' => $oExoDevoir->get('options'),
                'num' => $oExoDevoir->get('num')
            ]);
            $responseExoDevoir = $newExoDevoir->insert();
            if ($responseExoDevoir === null) {
                EC::set_error_code(501);
                return false;
            }
        }
        return $newDevoir->toArray();
    }

    public function insert()
    {
        $uLog=Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::addError("Utilisateur non connecté.");
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve()) {
            // Interdit pour élève
            EC::addError("Interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
        $data["idOwner"] = $uLog->getId();
        $devoir = new Devoir($data);
        $response = $devoir->insert();
        if ($response ===null)
        {
            EC::set_error_code(501);
            return false;
        }
        if (is_array($response))
        {
            // erreur de validation
            EC::set_error_code(422);
            return $response;
        }
        // il faut recharger l'objet pour obtenir tous les champs
        $devoir = Devoir::getObject($devoir->getId());
        return $devoir->toArray();
    }

    public function update()
    {
        $uLog=Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::addError("Utilisateur non connecté.");
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve()) {
            // Interdit pour élève
            EC::addError("Interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }
        $id = (integer) $this->params['id'];
        $devoir=Devoir::getObject($id);
        if ($devoir === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isAdmin() && $devoir->get("idOwner") !== $uLog->getId())
        {
            // pas propriétaire ni admin
            EC::addError("Tentative de mise à jour d'un devoir sans autorisation.");
            EC::set_error_code(403);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
        $response = $devoir->update($data);
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
        // la modification de l'idClasse peut nécessiter une mise à jour
        if (isset($data["idClasse"]))
        {
            return Devoir::getObject($id)->toArray();
        }
        return $devoir->toArray();
    }
}
?>

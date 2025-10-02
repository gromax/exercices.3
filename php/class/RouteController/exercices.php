<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Exercice;
use BDDObject\Logged;

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

  public function insert()
  {
    $uLog=Logged::getConnectedUser();
    if (!$uLog->connexionOk())
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

  public function update()
  {
    $uLog=Logged::getConnectedUser();
    if (!$uLog->connexionOk())
    {
      EC::set_error_code(401);
      return false;
    }
    if ($uLog->isEleve()) {
      // Interdit pour élève
      EC::set_error_code(403);
      return false;
    }
    $id = (integer) $this->params['id'];
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

  public function delete()
  {
    $uLog=Logged::getConnectedUser();
    if (!$uLog->connexionOk())
    {
      EC::set_error_code(401);
      return false;
    }
    if ($uLog->isEleve()) {
      // interdit pour élève
      EC::set_error_code(403);
      return false;
    }
    $id = (integer) $this->params['id'];
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

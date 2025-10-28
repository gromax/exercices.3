<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Note;
use BDDObject\Devoir;
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


  public function fetch()
  {
    $uLog =Logged::getConnectedUser();
    if (!$uLog->connexionOk())
    {
      EC::addError("Utilisateur non connecté.");
      EC::set_error_code(401);
      return false;
    }

    if ($uLog->isAdmin()) return Note::getList();
    if ($uLog->isProf()) return Note::getList([
      'wheres' => ['devoirs.idOwner'=> $uLog->getId()]
    ]);
    if ($uLog->isEleve()) return Note::getList([
      'wheres' => [
        'users.id' => $uLog->getId(),
        'trials.idUser' => $uLog->getId()
      ]
    ]);
    EC::addError("Pas les droits pour accéder aux associations.");
    EC::set_error_code(403);
    return false;
  }

  public function fetchDevoir($idDevoir)
  {
    $uLog =Logged::getConnectedUser();
    if (!$uLog->connexionOk())
    {
      EC::addError("Utilisateur non connecté.");
      EC::set_error_code(401);
      return false;
    }
    $id = (integer) $this->params['id'];
    $oDevoir = Devoir::getObject($id);
    if (!$oDevoir)
    {
      EC::addError("Devoir introuvable.");
      EC::set_error_code(404);
      return false;
    }
    if (!$uLog->isAdmin() && $oDevoir->get("idOwner") !== $uLog->getId() && $oDevoir->get("idClasse") !== $uLog->getClasseId())
    {
      EC::addError("Pas les droits pour accéder à ce devoir.");
      EC::set_error_code(403);
      return false;
    }
    if ($uLog->isEleve()) {
      return Note::getList([
        'wheres' => [
          'users.id' => $uLog->getId(),
          'trials.idUser' => $uLog->getId(),
          'devoirs.id' => $idDevoir
        ]
      ]);
    }
    return Note::getList([
      'wheres' => [
        'devoirs.id' => $idDevoir
      ]
    ]);
  }
}
?>

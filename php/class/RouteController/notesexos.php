<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\NoteExo;
use BDDObject\Logged;

class notesexos
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

    if ($uLog->isAdmin()) return NoteExo::getList();
    if ($uLog->isProf()) return NoteExo::getList([
      'wheres' => ['devoirs.idOwner'=> $uLog->getId()],
      'hideCols' => ['idOwner', 'idClasse']
    ]);
    if ($uLog->isEleve()) return NoteExo::getList([
      'wheres' => ['devoirs.idClasse' => $uLog->get("idClasse")],
      'hideCols' => ['idOwner', 'idClasse']
    ]);
    EC::addError("Pas les droits pour accéder aux associations.");
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
    $oNote = NoteExo::getObject($id);
    if ($oNote===null)
    {
      EC::addError("Association introuvable.");
      EC::set_error_code(404);
      return false;
    }
    if ( $uLog->isAdmin() || $oNote->get("idOwner") === $uLog->getId() || $oNote->get("idClasse") === $uLog->get("idClasse") )
    {
      return $oNote->toArray();
    }
    EC::addError("Pas les droits pour accéder à cette association.");
    EC::set_error_code(403);
    return false;
  }
}
?>

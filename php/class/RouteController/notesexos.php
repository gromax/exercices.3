<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\NoteExo;
use BDDObject\Logged;

class notesexos
{
    /**
     * paramètres de la requête
     * @var array Les paramètres de la requête
     */
    private $params;

    /**
     * Constructeur
     * @param array $params Les paramètres de la requête
     */
    public function __construct($params)
    {
            $this->params = $params;
    }

    /**
     * Récupère la liste des notes d'exercices en fonction des droits de l'utilisateur
     * @return array|false La liste des notes d'exercices ou false en cas d'erreur
     */
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
            $id = (int) $this->params['id'];
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

    /**
     * Récupère une note d'exercice spécifique en fonction des droits de l'utilisateur
     * @param int $id L'ID de la note d'exercice
     * @return array|false Les données de la note d'exercice ou false en cas d'erreur
     */
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
            EC::addError("Note d'exercice introuvable.");
            EC::set_error_code(404);
            return false;
        }
        if ( $uLog->isAdmin() || $oNote->get("idOwner") === $uLog->getId() || $oNote->get("idClasse") === $uLog->get("idClasse") )
        {
            return $oNote->toArray();
        }
        EC::addError("Pas les droits pour accéder à cette note d'exercice.");
        EC::set_error_code(403);
        return false;
    }
}
?>

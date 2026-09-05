<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Note;
use BDDObject\Devoir;
use BDDObject\Logged;

class notes
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
     * Récupère la liste des notes en fonction des droits de l'utilisateur
     * @return array|false La liste des notes ou false en cas d'erreur
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

        if ($uLog->isAdmin()) return Note::getList();
        if ($uLog->isProf()) return Note::getList([
            'wheres' => ['devoirs.idOwner'=> $uLog->getId()],
            'wheres_trials' => ['devoirs.idOwner'=> $uLog->getId()]
        ]);
        if ($uLog->isEleve()) return Note::getList([
            'wheres' => [
                'users.id' => $uLog->getId()
            ],
            'wheres_trials' => [
                'trials.idUser' => $uLog->getId()
            ]
        ]);
        EC::addError("Pas les droits pour accéder aux associations.");
        EC::set_error_code(403);
        return false;
    }

    /**
     * Récupère la liste des notes pour un devoir spécifique en fonction des droits de l'utilisateur
     * @param int $idDevoir L'ID du devoir
     * @return array|false La liste des notes ou false en cas d'erreur
     */
    public function fetchDevoir($idDevoir)
    {
        $uLog =Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::addError("Utilisateur non connecté.");
            EC::set_error_code(401);
            return false;
        }
        $id = (int) $this->params['id'];
        $oDevoir = Devoir::getObject($id);
        if (!$oDevoir)
        {
            EC::addError("Devoir introuvable.");
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isAdmin()
             && $oDevoir->get("idOwner") !== $uLog->getId()
             && $oDevoir->get("idClasse") !== $uLog->get('idClasse'))
        {
            EC::addError("Pas les droits pour accéder à ce devoir.");
            EC::set_error_code(403);
            return false;
        }
        if ($uLog->isEleve()) {
            return Note::getList([
                'wheres' => [
                    'users.id' => $uLog->getId(),
                    'devoirs.id' => $idDevoir
                ],
                'wheres_trials' => [
                    'trials.idUser' => $uLog->getId(),
                    'devoirs.id' => $idDevoir
                ]
            ]);
        }
        return Note::getList([
            'wheres' => [
                'devoirs.id' => $idDevoir
            ],
            'wheres_trials' => [
                'devoirs.id' => $idDevoir
            ]
        ]);
    }
}
?>

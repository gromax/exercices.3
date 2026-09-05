<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Classe;
use BDDObject\User;
use BDDObject\Logged;

class classes
{
    /**
     * paramères de la requète
     * @var array $params Les paramètres de la requête
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
     * Récupère une classe en fonction de son ID
     * @return array|false Les informations de la classe ou false en cas d'erreur
     */
    public function fetch()
    {
        $uLog =Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::set_error_code(401);
            return false;
        }

        if (isset($this->params['id']))
        {
            $id = (int) $this->params['id'];
            return $this->fetchClasse($id);
        }

        if ($uLog->isAdmin()) return Classe::getList();
        if ($uLog->isProf()) return Classe::getList([
                'wheres' => ['idOwner'=> $uLog->getId()]
        ]);
        if ($uLog->isEleve()) return Classe::getList([
            'wheres' => ['id' => $uLog->getId()],
            'hideCols' => ['pwd']
        ]);
        EC::set_error_code(403);
        return false;
    }

    /**
     * Récupère une classe spécifique en fonction de son ID
     * @param int $id L'ID de la classe
     * @return array|false Les informations de la classe ou false en cas d'erreur
     */
    private function fetchClasse($id) {
        $uLog =Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::set_error_code(401);
            return false;
        }
        $classe = Classe::getObject($id);
        if ($classe===null)
        {
            EC::set_error_code(404);
            return false;
        }
        if ( $uLog->isAdmin() || $classe->get("idOwner") === $uLog->getId() )
        {
            return $classe->toArray();
        }
        EC::set_error_code(403);
        return false;
    }

    /**
     * Récupère la liste des classes ouvertes à l'inscription
     * @return array La liste des classes ouvertes
     */
    public function fetchToJoin()
    {
        // Renvoie la liste des classes ouvertes à l'inscription
        return Classe::getList([
                "wheres" => [
                    'ouverte' => true,
                    'expiration' => ['>=', date('Y-m-d') ]
                ],
                "hideCols" => ['pwd']
        ]);
    }

    /**
     * Supprime une classe en fonction de son ID
     * @return array|false Message de succès ou false en cas d'erreur
     */
    public function delete()
    {
        $uLog=Logged::getFromToken();
        if ($uLog->isOff())
        {
            EC::addError("Utilisateur non connecté.");
            EC::set_error_code(401);
            return false;
        }
        elseif ($uLog->isEleve())
        {
            EC::addError("Interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }
        $id = (integer) $this->params['id'];
        $classe=Classe::getObject($id);
        if ($classe === null)
        {
            EC::addError("Classe introuvable.");
            EC::set_error_code(404);
            return false;
        }
        if(!$uLog->isAdmin() && $classe->get("idOwner") !== $uLog->getId())
        {
            EC::addError("Pas propriétaire de la classe.");
            EC::set_error_code(403);
            return false;
        }
        if ($classe->delete()) {
            return array( "message" => "Model successfully destroyed!");
        }
        EC::set_error_code(501);
        return false;
    }

    /**
     * Insère une nouvelle classe
     * @return array|false Les informations de la classe insérée ou false en cas d'erreur
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
        if ($uLog->isEleve()) {
            // interdit pour élève
            EC::addError("Interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
        if ($uLog->isAdmin() && isset($data["idOwner"]))
        {
            // Dans ce cas, l'utilisateur a la possibilité de créer une classe pour un autre
            $idOwner = $data["idOwner"];
            $owner =User::getObject($idOwner);
            if (($owner == null) || !$owner->isProf())
            {
                EC::set_error_code(501);
                return false;
            }
            $data["idOwner"] = $owner;
        } else {
            // Sinon le propriétaire est forcément celui qui est connecté
            $data["idOwner"] = $uLog->getId();
        }
        $classe = new Classe($data);
        $reponse = $classe->insert();

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
        return $classe->toArray();
    }

    /**
     * Met à jour une classe existante
     * @return array|false Les informations de la classe mise à jour ou false en cas d'erreur
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
        if ($uLog->isEleve()) {
            // Interdit pour élève
            EC::addError("Interdit aux élèves.");
            EC::set_error_code(403);
            return false;
        }
        $id = (int) $this->params['id'];
        $classe = Classe::getObject($id);
        if ($classe === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if (!$uLog->isAdmin() && ($classe->get("idOwner") !== $uLog->getId()))
        {
            // Interdit, pas propriétaire ni admin
            EC::addError("Tentative de mise à jour d'une classe sans autorisation.");
            EC::set_error_code(403);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
        $reponse = $classe->update($data);
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
        return $classe->toArray();
    }

    /**
     * Permet à un utilisateur de rejoindre une classe
     * @return array|false Les informations de l'utilisateur ou false en cas d'erreur
     */
    public function join()
    {
        $idClasse = (int) $this->params['id'];
        $classe = Classe::getObject($idClasse);
        if ($classe === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if (!$classe->get("ouverte"))
        {
            EC::addError("Classe fermée.");
            EC::set_error_code(403);
            return false;
        }

        $data = json_decode(file_get_contents("php://input"),true);
        if (isset($data["pwdClasse"]))
        {
            $pwdClasse = $data["pwdClasse"];
        }
        else
        {
            $pwdClasse = "";
        }

        if (!$classe->testPwd($pwdClasse))
        {
            EC::addError("Mot de passe invalide.");
            EC::set_error_code(422);
            return false;
        }

        // On procède à l'inscription
        $data['idClasse'] = $idClasse;
        $data['rank'] = User::RANK_ELEVE;
        $user=new User($data);

        $reponse = $user->insert();
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
        return $user->toArray();
    }

    /**
     * Teste le mot de passe d'une classe
     * @return array|false Message de succès ou false en cas d'erreur
     */
    public function testMDP()
    {
        $idClasse = (int) $this->params['id'];
        $pwd = "";
        if (isset($_GET['pwd']))
        {
            $pwd = $_GET['pwd'];
        }

        $classe = Classe::getObject($idClasse);

        if ($classe === null)
        {
            EC::addError("La classe n'existe pas");
            EC::set_error_code(404);
            return false;
        }
        if (!$classe->testPwd($pwd))
        {
            EC::addError("Mot de passe invalide.");
            EC::set_error_code(422);
            return false;
        }
        return array("message"=>"Mot de passe correct");
    }
}
?>

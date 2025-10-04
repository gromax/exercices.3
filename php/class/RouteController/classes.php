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
  /**
   * renvoie les infos sur l'objet d'identifiant id
   * @return array
   */
  public function fetch()
  {
    $uLog =Logged::getConnectedUser();
    if (!$uLog->connexionOk())
    {
      EC::set_error_code(401);
      return false;
    }

    if (isset($this->params['id']))
    {
      $id = (integer) $this->params['id'];
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

  private function fetchClasse($id) {
    $uLog =Logged::getConnectedUser();
    if (!$uLog->connexionOk())
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

  public function fetchToJoin()
  {
    // Renvoie la liste des classes ouvertes à l'inscription
    return Classe::getList([
        "wheres" => ['ouverte' => true],
        "hideCols" => ['pwd']
    ]);
  }

  public function delete()
  {
    $uLog=Logged::getConnectedUser();
    if (!$uLog->connexionOk())
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

  public function join()
  {
    $idClasse = (integer) $this->params['id'];
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
    $validation = $user->insertion_validation();
    if ($validation === true)
    {
      $id = $user->insertion();
      if ($id!==null)
      {
        return $user->toArray();
      }
    }
    else
    {
      EC::set_error_code(422);
      return array('errors'=>$validation);
    }
    EC::set_error_code(501);
    return false;
  }

  public function testMDP()
  {
    $idClasse = (integer) $this->params['id'];
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

<?php

namespace BDDObject;

use ErrorController as EC;
use PDO;
use PDOException;
use DB;
use MeekroDBException;
use SessionController as SC;

final class Classe
{
  const SAVE_IN_SESSION = true;

  private $id='';
  private $nom='';
  private $description='';
  private $pwd='';       // Mot de passe servant à entrer dans la classe. En clair
  private $ouverte=false;    // Indique si la classe est déjà active
  private $date=null;      // Date de création

  private $_idOwner=null;   // id du propriétaire
  private $_owner=null;    // Objet user du propriétaire
  private $_fiches=null;    // Tableau des fiches
  private $_nomOwner=null;  // Nom du propriétaire

  ##################################### METHODES STATIQUES #####################################

  public function __construct($params=array())
  {
    if(isset($params['id'])) $this->id = (integer) $params['id'];
    if(isset($params['nom'])) $this->nom = $params['nom'];
    if(isset($params['description'])) $this->description = $params['description'];
    if(isset($params['pwd'])) $this->pwd = $params['pwd'];
    if(isset($params['ouverte'])) $this->ouverte = (boolean)$params['ouverte'];

    if(isset($params['date'])) $this->date=$params['date'];
    else $this->date=date('Y-m-d');

    if(isset($params['idOwner'])) $this->_idOwner = (integer) $params['idOwner'];
    if(isset($params['nomOwner'])) $this->_nomOwner = $params['nomOwner'];

    if(isset($params['owner']))
    {
      $_owner = $params['owner'];
      if ($_owner instanceof User)
      {
        $this->_owner = $_owner;
        $this->_idOwner = $_owner->getId();
        $this->_nomOwner = $_owner->getName();
      }
    }
  }

  public static function getList($params = array())
  {
    if(isset($params['forJoin'])) $forJoin = $params['forJoin']; else $forJoin = false;
    if(isset($params['onlyOpen'])) $onlyOpen = $params['onlyOpen']; else $onlyOpen = false;
    if(isset($params['hasUser'])) $hasUser = $params['hasUser']; else $hasUser = null;
    if(isset($params['ownerIs'])) $ownerIs = $params['ownerIs']; else $ownerIs = null;
    if(isset($params['primaryKey'])) $primaryKey = $params['primaryKey']; else $primaryKey = null;
    if(isset($params['forEleve'])) $forEleve = $params['forEleve']; else $forEleve = null;

    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $identifiant = "";
      if ($hasUser !== null) {
        if ($onlyOpen) {
          $sql = "SELECT c.id id, c.nom nom, c.description, c.idOwner idOwner, c.pwd pwd, c.date date, c.ouverte ouverte, u.nom nomOwner, u.prenom prenomOwner, u.rank rankOwner, u.email emailOwner FROM (( ".PREFIX_BDD."classes c INNER JOIN ".PREFIX_BDD."users u ON c.idOwner = u.id ) INNER JOIN users m ON m.idClasse = c.id) WHERE ouverte=1 AND m.id=:identifiant";
        } else {
          $sql = "SELECT c.id id, c.nom nom, c.description, c.idOwner idOwner, c.pwd pwd, c.date date, c.ouverte ouverte, u.nom nomOwner, u.prenom prenomOwner, u.rank rankOwner, u.email emailOwner FROM (( ".PREFIX_BDD."classes c INNER JOIN ".PREFIX_BDD."users u ON c.idOwner = u.id ) INNER JOIN users m ON m.idClasse = c.id) WHERE m.id=:identifiant";
        }
        $identifiant = $hasUser;
      } elseif ($ownerIs !== null) {
        if ($onlyOpen){
          $sql = "SELECT c.id id, c.nom nom, c.description, c.idOwner idOwner, c.pwd pwd, c.date date, c.ouverte ouverte, u.nom nomOwner, u.prenom prenomOwner, u.rank rankOwner, u.email emailOwner FROM (".PREFIX_BDD."classes c INNER JOIN ".PREFIX_BDD."users u ON c.idOwner = u.id) WHERE ouverte=1 AND c.idOwner=:identifiant";
        } else {
          $sql = "SELECT c.id id, c.nom nom, c.description, c.idOwner idOwner, c.pwd pwd, c.date date, c.ouverte ouverte, u.nom nomOwner, u.prenom prenomOwner, u.rank rankOwner, u.email emailOwner FROM (".PREFIX_BDD."classes c INNER JOIN ".PREFIX_BDD."users u ON c.idOwner = u.id) WHERE c.idOwner = :identifiant";
        }
        $identifiant = $ownerIs;
      } else {
        if ($onlyOpen){
          $sql = "SELECT c.id id, c.nom nom, c.description, c.idOwner idOwner, c.pwd pwd, c.date date, c.ouverte ouverte, u.nom nomOwner, u.prenom prenomOwner, u.rank rankOwner, u.email emailOwner FROM ".PREFIX_BDD."classes c INNER JOIN ".PREFIX_BDD."users u ON c.idOwner = u.id WHERE ouverte=1";
        } elseif ($forJoin) {
          $sql = "SELECT id, nom, description, ouverte, date FROM ".PREFIX_BDD."classes WHERE ouverte=1";
        } elseif ($forEleve!==null) {
          $identifiant = $forEleve;
          $sql = "SELECT c.id, c.nom, c.description, c.ouverte, c.date FROM (".PREFIX_BDD."classes c INNER JOIN ".PREFIX_BDD."users u ON c.id = u.idClasse) WHERE u.id = :identifiant";
        } else {
          $sql = "SELECT c.id id, c.nom nom, c.description, c.idOwner idOwner, c.pwd pwd, c.date date, c.ouverte ouverte, u.nom nomOwner, u.prenom prenomOwner, u.rank rankOwner, u.email emailOwner FROM (".PREFIX_BDD."classes c INNER JOIN ".PREFIX_BDD."users u ON c.idOwner = u.id)";
        }
      }
      $stmt = $pdo->prepare($sql);
      if ($identifiant != "") {
        $stmt->bindParam(':identifiant', $identifiant);
      }
      $stmt->execute();
      $bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage(), 'Classe/getList');
      $bdd_result = array();
    }

    // Si nécessaire, réorganise le tableau pour faire de $primaryKey la clé des différentes valeurs
    if ($primaryKey !== null) {
      return array_combine(array_column($bdd_result, $primaryKey), $bdd_result);
    } else return $bdd_result;
  }

  public static function getObject($id)
  {
    return self::get($id, true);
  }

  public static function get($id,$returnObject=false)
  {
    if ($id===null) return null;
    if ($id instanceof Classe) {
      // On a transmis directement un objet classe
      if ($returnObject) return $id;
      return $id->toArray;
    } elseif (is_numeric($id)) $id = (integer) $id;

    if (self::SAVE_IN_SESSION) {
      // On essaie de récupérer la classe en session
      $classe = SC::get()->getParamInCollection('classes', $id, null);
      if ($classe !== null){
        if ($returnObject) return $classe;
        else return $classe->toArray();
      }
    }

    require_once BDD_CONFIG;
    try {
      $bdd_result=DB::queryFirstRow("SELECT c.id id, c.nom nom, c.description, c.idOwner idOwner, c.pwd pwd, c.date date, c.ouverte ouverte, u.nom nomOwner, u.prenom prenomOwner, u.rank rankOwner, u.email emailOwner FROM ".PREFIX_BDD."classes c INNER JOIN ".PREFIX_BDD."users u ON c.idOwner = u.id WHERE c.id=%s", $id);
      if ($bdd_result==null) return null;

      // Construction de l'objet pour sauvegarde en session
      if ((self::SAVE_IN_SESSION) || ($returnObject)) {
        $bdd_result['owner']=new User(array('id'=>$bdd_result['idOwner'], 'nom'=>$bdd_result['nomOwner'], 'prenom'=>$bdd_result['prenomOwner'], 'rank'=>$bdd_result['rankOwner'], 'email'=>$bdd_result['emailOwner']));
        $classe = new Classe($bdd_result);
        if (self::SAVE_IN_SESSION) SC::get()->setParamInCollection('classes', $classe->getId(), $classe);
        if ($returnObject) return $classe;
        else return $classe->toArray();
      }
      return $bdd_result;

    } catch(MeekroDBException $e) {
      EC::addBDDError($e->getMessage(), 'Classe/get');
      return null;
    }
  }

  public static function checkNomClasse($nom)
  {
    return (is_string($nom) && (strlen($nom)>=NOMCLASSE_MIN_SIZE) && (strlen($nom)<=NOMCLASSE_MAX_SIZE));
  }

  public static function testMDP($id, $pwd)
  {
    require_once BDD_CONFIG;
    try {
      $bdd_result = DB::queryFirstRow("SELECT id FROM ".PREFIX_BDD."classes WHERE id=%s AND pwd=%s", $id, $pwd);
    } catch(MeekroDBException $e) {
      EC::addBDDError($e->getMessage(), 'Logged/tryConnexion');
      return null;
    }

    if ($bdd_result !== null) { // Connexion réussie
      return array("success"=>true);
    }

    EC::addError("Mot de passe invalide.");
    return array("error"=>"Mot de passe invalide.");
  }


  ##################################### METHODES #####################################

  public function __toString()
  {
    return '[#'.$this->id.'] '.$this->nom;
  }

  public function insertion_update_validation()
  {
    // vérifie si l'utilisateur peut-être inséré
    $errors = array();
    if (strlen($this->nom)>NOMCLASSE_MAX_SIZE)
    {
      $errors["nom"] = "Nom trop long";
    }
    elseif (strlen($this->nom)<NOMCLASSE_MIN_SIZE)
    {
      $errors["nom"] = "Nom trop court";
    }
    if (count($errors)>0)
      return $errors;
    else
      return true;
  }

  public function insertion()
  {
    require_once BDD_CONFIG;
    try {
      // Ajout de la classe
      DB::insert(PREFIX_BDD.'classes', $this->toBDDArray() );
    } catch(MeekroDBException $e) {
      EC::addBDDError($e->getMessage(),'Classe/insertion');
      return null;
    }
    $this->id=DB::insertId();
    // sauvegarde d'une copie de la classe en session
    if (self::SAVE_IN_SESSION) $session=SC::get()->setParamInCollection('classes', $this->id, $this);

    EC::add("La classe a bien été ajoutée.");
    return $this->id;
  }

  public function update($params=array(),$updateBDD=true)
  {
    $bddModif=false;
    if(isset($params['nom'])) { $this->nom = $params['nom']; $bddModif=true; }
    if(isset($params['description'])) { $this->description = $params['description']; $bddModif=true; }
    if(isset($params['pwd'])) { $this->pwd = $params['pwd']; $bddModif=true; }
    if(isset($params['ouverte'])) { $this->ouverte = (boolean)$params['ouverte']; $bddModif=true; }

    if (!$bddModif) {
      EC::add("Aucune modification.");
      return true;
    }
    if (!$updateBDD) {
      EC::add("La classe a bien été modifiée.");
      return true;
    }

    require_once BDD_CONFIG;
    try{
      DB::update(PREFIX_BDD.'classes', $this->toBDDArray(),"id=%i",$this->id);
    } catch(MeekroDBException $e) {
      EC::addBDDError($e->getMessage(), 'Classe/update');
      return false;
    }
    EC::add("La classe a bien été modifiée.");
    return true;
  }

  public function delete()
  {
    // On autorise que la suppressio d'une classe vide
    $liste = User::getList(array("classe"=>$this->id));
    if (count($liste)>0) {
      EC::addError("La classe contient encore des élèves. Supprimez-les d'abord.", "Classe/Suppression");
      return false;
    }
    require_once BDD_CONFIG;
    try {
      DB::delete(PREFIX_BDD.'classes', 'id=%i', $this->id);
      EC::add("La classe a bien été supprimée.");
      if (self::SAVE_IN_SESSION) $session=SC::get()->unsetParamInCollection('classes', $this->id);
      return true;
    } catch(MeekroDBException $e) {
      EC::addBDDError($e->getMessage(), "Classe/Suppression");
    }
    return false;
  }

  public function hasUser($user)
  {
    $eleves = $this->eleves();
    if (is_integer($user)) return isset($eleves[$user]);   // $idUser
    else return isset($eleves[$user->getId()]);        // objet $user
  }

  public function toArray()
  {
    $answer=array(
      'id'=>$this->id,
      'nom'=>$this->nom,
      'description'=>$this->description,
      'pwd'=>$this->pwd,
      'idOwner'=>$this->getOwnerId(),
      'nomOwner'=>$this->getOwnerName(),
      'ouverte'=>$this->ouverte,
      'date'=>$this->date
    );
    return $answer;
  }

  private function toBDDArray()
  {
    $out = array(
      'nom'=>$this->nom,
      'description'=>$this->description,
      'pwd'=>$this->pwd,
      'idOwner'=>$this->getOwnerId(),
      'ouverte'=>$this->ouverte,
      'date'=>$this->date
    );
    if ($this->id !== '') {
      $out['id'] = $this->id;
    }
    return $out;
  }

  public function getId()
  {
    return $this->id;
  }

  public function isOpen()
  {
    return $this->ouverte;
  }

  public function getNom()
  {
    return $this->nom;
  }

  public function testPwd($pwd)
  {
    return ($this->pwd == $pwd);
  }

  public function isOwnedBy($user)
  {
    if ( is_integer($user) ) return ($user === $this->getOwnerId());
    if ( $user instanceof User ) return ($user->getId() === $this->getOwnerId());
    return false;
  }

  public function eleves()
  {
    return User::getList(array('classe' => $this->id));
  }

  public function getOwner()
  {
    if ($this->_owner !== null) return $this->_owner;
    elseif ($this->idOwner !== null ) {
      $bdd_search = User::getObject($this->idOwner);
      if (($bdd_search !== null) && ($bdd_search instanceof User)) $this->_owner = $bdd_search;
    }
    return null;
  }

  private function getOwnerId()
  {
    if ($this->_owner !== null) return ($this->_idOwner = $this->_owner->getId());
    if ($this->_idOwner !== null) return $this->_idOwner;
    return null;
  }

  private function getOwnerName()
  {
    if ($this->_owner !== null) return $this->_owner->getName();
    if ($this->_nomOwner !== null) return $this->_nomOwner;
    return null;
  }

}

?>

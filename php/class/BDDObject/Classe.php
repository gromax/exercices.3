<?php

namespace BDDObject;

use ErrorController as EC;
use PDO;
use PDOException;

final class Classe extends Item
{
  protected static $BDDName = "classes";

  ##################################### METHODES STATIQUES #####################################

  protected static function champs()
  {
    return array(
      'nom' => array( 'def' => "", 'type'=> 'string'),         // nom de la classe
      'idOwner' => array( 'def' => 0, 'type'=> 'int'),         // id du propriétaire de la classe
      'nomOwner' => array( 'def' => "", 'type'=> 'string',
        'join'=>array('table'=>'users', 'col'=>'nom', 'strangerId'=>'idOwner')
      ), // nom du propriétaire de la classe
      'description' => array( 'def' => "", 'type'=> 'string'), // descriptif de la classe
      'pwd' => array( 'def' => "", 'type'=> 'string'),         // mot de passe pour entrer dans la classe
      'date' => array( 'def' => date('Y-m-d'), 'type'=> 'date'), // date de création
      'expiration' => array( 'def' => date('Y-m-d', strtotime('+1 year')), 'type'=> 'date'), // date d'expiration
      'ouverte' => array( 'def' => false, 'type'=> 'boolean'),   // indique si la classe est ouverte aux inscriptions
    );
  }

  protected static function children()
  {
    return array(
      'users'=> array('strangerId'=>'idClasse', 'allowDelete'=>false)
    );
  }

  public static function getClassesList($params = array())
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

  public static function checkNomClasse($nom)
  {
    return (is_string($nom) && (strlen($nom)>=NOMCLASSE_MIN_SIZE) && (strlen($nom)<=NOMCLASSE_MAX_SIZE));
  }

  public static function testMDP($id, $pwd)
  {
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("SELECT id FROM ".PREFIX_BDD."classes WHERE id = :id AND pwd = :pwd");
      $stmt->execute(array(':id' => $id, ':pwd' => $pwd));
      $bdd_result = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage(), 'Classe/testMDP');
      return null;
    }

    if ($bdd_result !== null) { // Connexion réussie
      return array("success"=>true);
    }

    EC::addError("Mot de passe invalide.");
    return array("error"=>"Mot de passe invalide.");
  }


  ##################################### METHODES #####################################

  protected function insertionValidation($params)
  {
    // vérifie si l'utilisateur peut-être inséré
    $errors = array();
    if (strlen($params['nom'])>NOMCLASSE_MAX_SIZE)
    {
      $errors["nom"] = "Nom trop long";
    }
    elseif (strlen($params['nom'])<NOMCLASSE_MIN_SIZE)
    {
      $errors["nom"] = "Nom trop court";
    }
    if (count($errors)>0)
      return $errors;
    else
      return true;
  }

  protected function updateValidation($params)
  {
    return $this->insertionValidation($params);
  }

  public function hasUser($user)
  {
    $eleves = $this->eleves();
    if (is_integer($user)) return isset($eleves[$user]);   // $idUser
    else return isset($eleves[$user->getId()]);        // objet $user
  }

  public function testPwd($pwd)
  {
    return ($this->get('pwd') == $pwd);
  }

  public function eleves()
  {
    return User::getList(array('classe' => $this->id));
  }
}

?>

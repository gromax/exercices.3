<?php

namespace BDDObject;
use PDO;
use PDOException;
use ErrorController as EC;

class User extends Item
{
  protected static $BDDName = "users";

  const  RANK_ROOT="root";
  const  RANK_ADMIN="admin";
  const  RANK_PROF="prof";
  const  RANK_ELEVE="eleve";
  const  RANK_DISCONNECTED="off";

  ##################################### METHODES STATIQUES #####################################

  protected static function champs()
  {
    return [
      'nom' => ['def' => "", 'type'=> 'string'],         // nom de la classe
      'prenom' => ['def' => "", 'type'=> 'string'],      // prénom de l'utilisateur
      'email' => ['def' => "", 'type'=> 'string'],       // email de l'utilisateur
      'rank' => ['def' => self::RANK_DISCONNECTED, 'type'=> 'string'], // rang de l'utilisateur
      'idClasse' => ['def' => 0, 'type'=> 'int'],         // id de la classe
      'pref' => ['def' => "", 'type'=> 'string'], // JSON préférences
      'date' => ['def' => date('Y-m-d'), 'type'=> 'date'], // date de création
      'nomClasse' => ['def' => "", 'type'=> 'string', 'foreign'=>'classes.nom'], // nom de la classe
      'idTeacher' => ['def' => 0, 'type'=> 'int', 'foreign'=>'classes.idOwner'], // id du professeur
    ] ;
  }

  /**
   * Définit les enfants protégés de cet objet BDD
   * ne peut supprimer que si pas d'enfants protégés
   */
  protected static function protectedChildren()
  {
    return [
      'classes'=> 'idOwner'
    ];
  }

  protected static function joinedTables()
  {
    return [
      'left' => ['classes' => 'users.idClasse = classes.id']
    ];
  }

  protected static function filterInsert($values)
  {
    $toInsert = parent::filterInsert($values);
    // Le mot de passe doit être hashé
    if (isset($values['pwd']))
    {
      $hash = password_hash($values['pwd'], PASSWORD_BCRYPT);
      $toInsert['hash'] = $hash;
    }
    return $toInsert;
  }

  protected static function filterUpdate($values)
  {
    $toUpdate = parent::filterUpdate($values);
    // Le mot de passe doit être hashé
    if (isset($values['pwd']))
    {
      $hash = password_hash($values['pwd'], PASSWORD_BCRYPT);
      $toUpdate['hash'] = $hash;
    }
    return $toUpdate;
  }


  protected static function checkPwd($pwd)
  {
    return true;
  }

  protected static function checkEMail($email)
  {
    return preg_match("#^[a-zA-Z0-9_-]+(.[a-zA-Z0-9_-]+)*@[a-zA-Z0-9._-]{2,}\.[a-z]{2,4}$#", $email);
  }

  public static function emailExists($email)
  {
    require_once BDD_CONFIG;
    try {
      // Vérification que l'email
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("SELECT id FROM ".PREFIX_BDD."users WHERE email=:email");
      $stmt->bindValue(':email', $email, PDO::PARAM_STR);
      $stmt->execute();
      $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
      if (count($results) > 0) return $results[0]["id"];
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage());
    }
    return false;
  }

  protected static function insertionValidation($params)
  {
    $errors = [];
    if (isset($params['email']))
    {
      $email_errors = [];
      if (!self::checkEMail($params['email']))
      {
        $email_errors[] = "Email invalide.";
      }
      if (self::emailExists($params['email'])!==false )
      {
        $email_errors[] = "L'identifiant (email) existe déjà.";
      }
      if (count($email_errors)>0)
      {
        $errors['email'] = $email_errors;
      }
    }

    if (isset($params['pwd']))
    {
      if (!self::checkPwd($params['pwd']))
      {
        $errors["pwd"] = "Mot de passe invalide.";
      }
    }
    if (count($errors)>0)
    {
      return $errors;
    }
    return true;
  }

  ##################################### METHODES #####################################

  protected function __construct($options = array())
  {
    parent::__construct($options);
    if (isset($options['pwd']))
    {
      $this->values['pwd'] = $options['pwd'];
    }
  }

  protected function updateValidation($params)
  {
    $errors = [];
    if (isset($params['rank']))
    {
      $errors['rank'] = "Le rang ne peut pas être modifié.";
    }

    if (isset($params['email']) && $params['email'] != $this->get('email'))
    {
      $email_errors = [];
      if (!self::checkEMail($params['email']))
      {
        $email_errors[] = "Email invalide.";
      }
      if (self::emailExists($params['email'])!==false )
      {
        $email_errors[] = "L'identifiant (email) existe déjà.";
      }
      if (count($email_errors)>0)
      {
        $errors['email'] = $email_errors;
      }
    }

    if (isset($params['pwd']))
    {
      if (!self::checkPwd($params['pwd']))
      {
        $errors["pwd"] = "Mot de passe invalide.";
      }
    }
    if (count($errors)>0)
    {
      return $errors;
    }
    return true;
  }

  public function identifiant()
  {
    return $this->get('email');
  }

  public function getName()
  {
    return $this->get('nom');
  }

  public function isRoot ()
  {
    return ( $this->get('rank') == self::RANK_ROOT );
  }

  public function isAdmin ()
  {
    return (( $this->get('rank') == self::RANK_ROOT ) || ( $this->get('rank') == self::RANK_ADMIN ));
  }

  public function isProf ($orBetter = false)
  {
    return ( ($this->get('rank') == self::RANK_PROF ) || ($orBetter && ( ($this->get('rank') == self::RANK_ROOT ) || ($this->get('rank') == self::RANK_ADMIN ) ) ) );
  }

  public function isEleve ()
  {
    return ( $this->get('rank') == self::RANK_ELEVE );
  }

  public function isStronger(User $user)
  {
    if ($user->isRoot()) return false;
    if ($user->isAdmin()) return $this->isRoot();
    if ($user->isProf()) return $this->isAdmin();
    return $this->isProf(true);
  }

  public function okToDelete()
  {
    if ($this->isRoot()) {
      EC::add("Le compte root ne peut être supprimé.");
      return false;
    }
    return parent::okToDelete();
  }

  public function updateTime()
  {
    $this->set('date', date('Y-m-d H:i:s'));
    require_once BDD_CONFIG;
    try{
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("UPDATE ".PREFIX_BDD."users SET date=:date WHERE id=:id");
      $stmt->execute(array(
        ':date' => $this->get('date'),
        ':id' => $this->get('id')
      ));
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage(), 'User/updateTime');
    }
    return $this;
  }

  public function initKey(): string|null
  {
    $key = md5(rand());
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      // On supprime d'abord les anciennes clés
      $stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD."initKeys WHERE idUser=:idUser");
      $stmt->bindValue(':idUser', $this->getId(), PDO::PARAM_INT);
      $stmt->execute();
      $stmt = $pdo->prepare("INSERT INTO ".PREFIX_BDD."initKeys (initKey, idUser) VALUES (:initKey, :idUser)");
      $stmt->bindValue(':initKey', $key, PDO::PARAM_STR);
      $stmt->bindValue(':idUser', $this->getId(), PDO::PARAM_INT);
      $stmt->execute();
      return $key;
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage());
    }
    return null;
  }

}


?>

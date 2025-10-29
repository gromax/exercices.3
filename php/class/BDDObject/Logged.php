<?php
  // C'est la classe de l'utilisateur connecté

namespace BDDObject;
use PDO;
use PDOException;
use ErrorController as EC;
use SessionController as SC;

class Logged extends User
{
  const TIME_OUT = 5400; // durée d'inactivité avant déconnexion = 90min
  const SAVE_CONNEXION_ATTEMPTS_IN_BDD = true;

  private static $_connectedUser=null;

  private $lastTime = null;
  //private $ip = null;
  private $isConnected = null;  // Permet d'éviter de répéter la modification de bdd en vas de plusieurs check de connexion


  ##################################### METHODES STATIQUES #####################################

  public function __construct($params=array())
  {
    parent::__construct($params);
    //$this->ip = $_SERVER['REMOTE_ADDR'];
    $this->refreshTimeOut();
  }

  public static function getConnectedUser($force = false)
  {
    if ( (self::$_connectedUser === null) || ($force === true) )
    {
      $data = SC::verify_token();
      if ($data === null)
      {
        self::$_connectedUser = new Logged();
        return self::$_connectedUser;
      }
      $results = User::getList([
        'wheres' => [
          'id' => (integer) $data->id,
          'email' => $data->email,
          'rank' => $data->rank
        ]
      ]);
      if (count($results) == 0) {
        // L'utilisateur n'existe plus
        self::$_connectedUser = new Logged();
        return self::$_connectedUser;
      }
      $result = $results[array_key_first($results)];
      self::$_connectedUser = new Logged($result);
      return self::$_connectedUser;
    }
  }

  public static function tryConnexion($identifiant, $pwd)
  {
    if ($identifiant !== ''){
      if ($pwd === "") {
        EC::addError("Vous avez envoyé un mot de passe vide ! Essayez de réactualiser la page (CTRL+F5)");
        EC::set_error_code(422);
        return null;
      }

      $results = User::getList(array(
        'wheres' => array('email' => $identifiant),
        'forcecols' => ['hash']
      ));
      if (count($results) == 0)
      {
        EC::addError("Mot de passe ou identifiant invalide.");
        EC::set_error_code(422);
        return null;
      }
      $result = $results[array_key_first($results)];
      $hash = $result['hash'];
      if (($hash=="") || (password_verify($pwd, $hash)))
      {
        // Le hash correspond, connexion réussie
        //$bdd_result["pwd"] = $pwd;
        return new Logged($result);
      }
    }
    EC::addError("Mot de passe ou identifiant invalide.");
    EC::set_error_code(422);
    return null;
  }

  public static function tryConnexionOnInitMDP($key)
  {
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("SELECT id, idUser FROM ".PREFIX_BDD."initKeys WHERE initKey=:initKey");
      $stmt->bindValue(':initKey', $key, PDO::PARAM_STR);
      $stmt->execute();
      $initKeys_result = $stmt->fetch(PDO::FETCH_ASSOC);
      if ($initKeys_result !== null)
      {
        $idUser = (integer) $initKeys_result['idUser'];
        $stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD."initKeys WHERE idUser=:idUser");
        $stmt->bindValue(':idUser', $idUser, PDO::PARAM_INT);
        $stmt->execute();
        $stmt = $pdo->prepare("SELECT id, idClasse, nom, prenom, email, pref, `rank` FROM ".PREFIX_BDD."users WHERE id=:id");
        $stmt->bindValue(':id', $idUser, PDO::PARAM_INT);
        $stmt->execute();
        $bdd_result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($bdd_result !== null)
        { // Connexion réussie
          return new Logged($bdd_result);
        }
      }
    }
    catch(PDOException $e)
    {
      EC::addBDDError($e->getMessage(), 'Logged/tryInitMDP');
    }
    return null;
  }

  ##################################### METHODES #####################################

  private function refreshTimeOut()
  {
    $this->lastTime=time();
    return $this;
  }

  public function connexionOk()
  {
    if ($this->isConnected === null)
    {
      if ($this->get('rank') == self::RANK_DISCONNECTED)
      {
        $this->isConnected = false;
      }
      else
      {
        $this->isConnected = ( ((time()-$this->lastTime)<self::TIME_OUT) && ($this->id !== null));
      }
    }
    if ($this->isConnected)
    {
      $this->lastTime = time();
    }
    return ($this->isConnected === true);
  }
}

?>

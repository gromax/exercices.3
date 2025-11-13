<?php
  // C'est la classe de l'utilisateur connecté

namespace BDDObject;
use ErrorController as EC;
use SessionController as SC;

class Logged extends User
{
  const TIME_OUT = 5400; // durée d'inactivité avant déconnexion = 90min
  const SAVE_CONNEXION_ATTEMPTS_IN_BDD = true;
  protected $_isInAdminMode;

  ##################################### METHODES STATIQUES #####################################

  public static function getFromToken()
  {
    $data = SC::readToken();
    if ($data === null)
    {
      return new Logged();
    }
    return new Logged($data);
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
    $keys = InitKey::getList([
      'wheres' => ['initKey' => $key]
    ]);
    if (count($keys) === 0)
    {
      return null;
    }
    $key = new InitKey(array_key_first($keys));
    InitKey::deleteFromIdUser($key->get('idUser'));
    $users = User::getList([
      'wheres' => ['id' => $key->get('idUser')]
    ]);
    if (count($users) === 0)
    {
      return null;
    }
    return new Logged(array_key_first($users));
  }

  public static function getFullData()
  {
    $uLog = Logged::getFromToken();
    if ($uLog->isOff())
    {
      return $uLog;
    }
    $results = User::getList([
      'wheres' => [
        'id' => (integer) $uLog->getId(),
        'email' => $uLog->get('email')
      ]
    ]);
    if (count($results) == 0) {
      return new Logged();
    }
    $result = $results[array_key_first($results)];
    return new Logged($result);
  }

  ##################################### METHODES #####################################

  public function __construct($params=array())
  {
    parent::__construct($params);
    if (!isset($params['adminMode'])) {
      $params['adminMode'] = false;
    }
    $this->_isInAdminMode = $params['adminMode'];
  }

  public function dataForToken()
  {
    $data = parent::dataForToken();
    if ($this->get("rank") === User::RANK_ADMIN) {
      $data['adminMode'] = $this->_isInAdminMode;
    }
    return $data;
  }

  public function setAdminMode($mode)
  {
    if ($this->get("rank") === User::RANK_ADMIN) {
      $this->_isInAdminMode = (bool) $mode;
    }
  }

  public function isAdmin()
  {
    return ($this->get("rank") === User::RANK_ROOT) || (($this->get("rank") === User::RANK_ADMIN) && $this->_isInAdminMode);
  }

  public function isProf()
  {
    return ($this->get("rank") === User::RANK_PROF) || (($this->get("rank") === User::RANK_ADMIN) && !$this->_isInAdminMode);
  }

  /**
   * Indique si l'utilisateur peut être promu en admin
   */
  public function promotable()
  {
    return $this->get("rank") === User::RANK_ADMIN && !$this->_isInAdminMode;
  }

}

?>

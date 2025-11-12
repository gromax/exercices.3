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

  ##################################### METHODES #####################################

  public function __construct($params=array())
  {
    parent::__construct($params);
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

  public function dataForToken()
  {
    return [
      'id' => $this->getId(),
      'nom' => $this->get('nom'),
      'prenom' => $this->get('prenom'),
      'idClasse' => $this->get('idClasse'),
      'email' => $this->get('email'),
      'rank' => $this->get('rank')
    ];
  }

}

?>

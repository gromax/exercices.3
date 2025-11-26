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
    return [
      'nom' => ['def' => "", 'type'=> 'string'],         // nom de la classe
      'idOwner' => ['def' => 0, 'type'=> 'integer'],         // id du propriétaire de la classe
      'nomOwner' => ['def' => "", 'type'=> 'string', 'foreign'=>'users.nom'], // nom du propriétaire de la classe
      'description' => ['def' => "", 'type'=> 'string'], // descriptif de la classe
      'pwd' => ['def' => "", 'type'=> 'string'],         // mot de passe pour entrer dans la classe
      'date' => ['def' => date('Y-m-d'), 'type'=> 'date'], // date de création
      'expiration' => ['def' => date('Y-m-d', strtotime('+1 year')), 'type'=> 'date'], // date d'expiration
      'ouverte' => ['def' => false, 'type'=> 'boolean'],   // indique si la classe est ouverte aux inscriptions
    ] ;
  }

  protected static function joinedTables()
  {
    return [
      'inner' => ['users' => 'classes.idOwner = users.id']
    ];
  }

  /**
   * Définit les enfants protégés de cet objet BDD
   * ne peut supprimer que si pas d'enfants protégés
   */
  protected static function protectedChildren()
  {
    return [
      'users'=> 'idClasse'
    ];
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

  protected static function insertValidation($params)
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

  ##################################### METHODES #####################################

  protected function updateValidation($params)
  {
    return static::insertionValidation($params);
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

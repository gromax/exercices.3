<?php

namespace BDDObject;

use PDO;
use PDOException;
use ErrorController as EC;
use SessionController as SC;

final class Message extends Item
{
  protected static $BDDName = "messages";

  ##################################### METHODES STATIQUES #####################################

  protected static function champs()
  {
    return array(
      'idOwner' => array( 'def' => null, 'type' => 'integer'),  // id de l'auteur
      'message' => array( 'def' => "", 'type'=> 'string'),    // contenu du message
      'aUE' => array( 'def' => "", 'type' => 'integer'),  // données relatives au contexte
      'date' => array( 'def' => date('Y-m-d H:i:s'), 'type' => 'dateHeure'),  // Date-heure de création
      'lu' => array( 'def' => false, 'type'=>'boolean'),
      'idDest' => array( 'def' => null, 'type' => 'integer')
      );
  }

  public static function getListUser($idUser)
  {
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      // en tant qu'expéditeur
      $stmt = $pdo->prepare("SELECT m.id, m.idOwner, m.message, m.aUE, m.date, 'Moi' AS ownerName, m.idDest, CONCAT(u.nom,' ',u.prenom) AS destName, 1 AS lu FROM (".PREFIX_BDD."messages m JOIN ".PREFIX_BDD."users u ON u.id=m.idDest) WHERE m.idOwner=:idOwner");
      $stmt->execute(array(':idOwner' => $idUser));
      $expediteur_bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);

      // en tant que récepteur
      $stmt = $pdo->prepare("SELECT m.id, m.idOwner, m.message, m.aUE, m.date, CONCAT(u.prenom, ' ', u.nom) AS ownerName, :idDest AS idDest, 'Moi' AS destName, m.lu FROM (".PREFIX_BDD."messages m JOIN ".PREFIX_BDD."users u ON u.id = m.idOwner) WHERE m.idDest=:idDest");
      $stmt->execute(array(':idDest' => $idUser));
      $recepteur_bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage(), "Messages/getList");
      return array("error"=>true, "message"=>$e->getMessage());
    }
    $bdd_result = array_merge($expediteur_bdd_result, $recepteur_bdd_result);
    $dates = array_column($bdd_result,"date");
    array_multisort($dates,SORT_ASC,$bdd_result);
    return $bdd_result;
  }


  public static function unReadNumber($idUser)
  {
    require_once BDD_CONFIG;
    try{
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("SELECT id FROM ".PREFIX_BDD.static::$BDDName." WHERE idDest = :idDest AND lu = 0");
      $stmt->execute(array(':idDest' => $idUser));
      return $stmt->rowCount();
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage(), 'Messages/unReadNumber');
    }
    return 0;
  }


  ##################################### METHODES #####################################


  public function isOwnedBy($user)
  {
    return $this->values['idOwner'] == $user->getId();
  }

  public function isDestTo($user)
  {
    return $this->values['idDest'] == $user->getId();
  }

  public function setLu()
  {
    require_once BDD_CONFIG;
    try{
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("UPDATE ".PREFIX_BDD.static::$BDDName." SET lu = :lu WHERE id = :id");
      $stmt->execute(array(
        ':lu' => true,
        ':id' => $this->id
      ));
      $this->values['lu'] = true;
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage(), static::$BDDName."/setLu");
      return false;
    }
    EC::add(static::$BDDName."/setLu : Succès.");
    return true;
  }

  public function getDestName()
  {
    // utile pour construire la réponse lors d'une insertion de message
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("SELECT CONCAT(nom,' ',prenom) as fullname FROM ".PREFIX_BDD."users WHERE id = :id");
      $stmt->execute(array(':id' => $this->values['idDest']));
      $out = $stmt->fetch(PDO::FETCH_ASSOC);
      if ($out !== null) {
        return $out["fullname"];
      } else {
        return "?";
      }
    } catch(PDOException $e) {
      if (EC::BDD_DEBUG) return array('error'=>true, 'message'=>"#User/getList : ".$e->getMessage());
      return "?";
    }
  }
}

?>

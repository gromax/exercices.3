<?php

namespace BDDObject;
use PDO;
use PDOException;
use ErrorController as EC;

class Trial extends Item
{
  protected static $BDDName = "trials";

  ##################################### METHODES STATIQUES #####################################

  protected static function champs()
  {
    return [
      'idExoDevoir' => ['def' => 0, 'type'=> 'int'],     // id de l'exercice associé
      'idUser' => ['def' => 0, 'type'=> 'int'],     // id de l'utilisateur
      'note' => ['def' => 0, 'type'=> 'int'],        // note de l'essai
      'init' => ['def' => "", 'type'=> 'string'], // JSON des intialisations de l'exercice
      'answers' => ['def' => "", 'type'=> 'string'], // JSON des réponses de l'utilisateur
      'date' => ['def' => date('Y-m-d'), 'type'=> 'date'], // date de l'essai
      'finished' => ['def' => false, 'type'=> 'bool'] // si l'essai est terminé
    ] ;
  }

  public static function insertAllowed($idExoDevoir, $idUser)
  {
    // autorisé si :
    // user dans la classe du devoir
    // devoir ouvert
    $date = date('Y-m-d');
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("SELECT devoirs.id from ".PREFIX_BDD."devoirs  AS devoirs
        JOIN ".PREFIX_BDD."users AS users ON users.idClasse = devoirs.idClasse
        JOIN ".PREFIX_BDD."exodevoirs AS exodevoirs ON exodevoirs.idDevoir = devoirs.id
        WHERE exodevoirs.id = :idExoDevoir AND users.id = :idUser
        AND devoirs.dateDebut <= :date AND devoirs.dateFin >= :date");
      $stmt->bindValue(":idExoDevoir", $idExoDevoir, PDO::PARAM_INT);
      $stmt->bindValue(":idUser", $idUser, PDO::PARAM_INT);
      $stmt->bindValue(":date", $date, PDO::PARAM_STR);
      $stmt->execute();
      if ($stmt->rowCount() == 0) {
        return false;
      }
      return true;
    } catch(PDOException $e) {
      EC::addError($e->getMessage(), "Trial/onUpdateSuccess");
      return false;
    }
  }

  ##################################### METHODES D'INSTANCE #####################################

  protected function onUpdateSuccess()
  {
    // Actions à effectuer après une mise à jour réussie d'un essai
    // Met à jour la note de l'essai correspondant
    $idExoDevoir = $this->get('idExoDevoir');
    $idUser = $this->get('idUser');
    $note = $this->get('note');
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("UPDATE ".PREFIX_BDD."noteexos SET note = MAX(note,$note) WHERE idExoDevoir = :idExoDevoir AND idUser = :idUser");
      $stmt->bindValue(":idExoDevoir", $idExoDevoir, PDO::PARAM_INT);
      $stmt->bindValue(":idUser", $idUser, PDO::PARAM_INT);
      $stmt->execute();
      return true;
    } catch(PDOException $e) {
      EC::addError($e->getMessage(), "Trial/onUpdateSuccess");
      return false;
    }
  }

  protected function onInsertSuccess()
  {
    // Actions àeffectuer après l'insertion réussie d'un essai
    // Met à jour la note de l'essai correspondant. Le crée au besoin
    $idExoDevoir = $this->get('idExoDevoir');
    $idUser = $this->get('idUser');
    $note = $this->get('note');
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("INSERT INTO ".PREFIX_BDD."noteexos (idExoDevoir, idUser, note, trials)
        VALUES (:idExoDevoir, :idUser, :note, 1)
        ON DUPLICATE KEY UPDATE note = GREATEST(note, VALUES(note)), trials = trials + 1");
      $stmt->bindValue(":idExoDevoir", $idExoDevoir, PDO::PARAM_INT);
      $stmt->bindValue(":idUser", $idUser, PDO::PARAM_INT);
      $stmt->bindValue(":note", $note, PDO::PARAM_INT);
      $stmt->execute();
      return true;
    } catch(PDOException $e) {
      EC::addError($e->getMessage(), "Trial/onInsertSuccess");
      return false;
    }
  }

  protected function onDeleteSuccess()
  {
    // Actions à effectuer après la suppression réussie d'un essai
    $idExoDevoir = $this->get('idExoDevoir');
    $idUser = $this->get('idUser');
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

      $stmMax = $pdo->prepare("SELECT COALESCE(MAX(note), 0) FROM trials WHERE idExoDevoir = :idExoDevoir AND idUser = :idUser");
      $stmMax->bindValue(":idExoDevoir", $idExoDevoir, PDO::PARAM_INT);
      $stmMax->bindValue(":idUser", $idUser, PDO::PARAM_INT);
      $stmMax->execute();
      $maxNote = (int) $stmMax->fetchColumn();

      $stmt = $pdo->prepare("UPDATE ".PREFIX_BDD."noteexos SET note = :note, trials = trials - 1 WHERE idExoDevoir = :idExoDevoir AND idUser = :idUser");
      $stmt->bindValue(":idExoDevoir", $idExoDevoir, PDO::PARAM_INT);
      $stmt->bindValue(":idUser", $idUser, PDO::PARAM_INT);
      $stmt->bindValue(":note", $maxNote, PDO::PARAM_INT);
      $stmt->execute();
      return true;
    } catch(PDOException $e) {
      EC::addError($e->getMessage(), "Trial/onDeleteSuccess");
      return false;
    }
  }
}

?>

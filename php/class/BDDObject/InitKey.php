<?php

namespace BDDObject;
use ErrorController as EC;
use PDO;
use PDOException;

final class InitKey extends Item
{
  protected static $BDDName = "initkeys";
  ##################################### METHODES STATIQUES #####################################

  protected static function champs()
  {
    return [
      'initKey' => ['def' => "", 'type'=> 'string'],    // clé de réinitialisation
      'idUser' => ['def' => 0, 'type'=> 'integer'],         // id de l'utilisateur
    ] ;
  }

  public function delete()
  {
    if (!$this->okToDelete()) {
      EC::addError(static::$BDDName."/delete : L'objet a des enfants impossibles à supprimer.");
      return false;
    }
  }

  static public function deleteFromIdUser($idUser)
  {
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD.static::$BDDName." WHERE idUser = :id");
      $stmt->bindValue(':id', $idUser, PDO::PARAM_INT);
      $stmt->execute();
      EC::add("Keys supprimées avec succès.");
      return true;
    } catch(PDOException $e) {
      EC::addError($e->getMessage(), "initKey/deleteFromIdUser");
      return false;
    }
  }

  ##################################### METHODES #####################################


}

?>

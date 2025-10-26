<?php

namespace BDDObject;
use PDO;
use PDOException;
use ErrorController as EC;

final class AssoExoDevoir extends Item
{
  protected static $BDDName = "assoc_exo_devoir";

  ##################################### METHODES STATIQUES #####################################

  protected static function champs()
  {
    return [
      'idExo' => ['def' => 0, 'type'=> 'int'],       // id de l'exercice associé
      'idDevoir' => ['def' => 0, 'type'=> 'int'],      // id du devoir associé
      'options' => ['def' => "", 'type'=> 'string'],   // options de l'exercice, JSON
    ] ;
  }

  ##################################### METHODES #####################################
  public function canBeUpdatedBy(int $userId): bool
  {
    require_once BDD_CONFIG;
    try
    {
        $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $stmt = $pdo->prepare("SELECT idOwner FROM ".PREFIX_BDD."devoirs WHERE d.id = :idDevoir");
        $stmt->bindValue(':idDevoir', $this->get("idDevoir"), PDO::PARAM_INT);
        $stmt->execute();
        $idOwner = $stmt->fetchColumn();
        if ((int)$idOwner === $userId) return true;
    } catch(PDOException $e) {
        EC::addBDDError($e->getMessage(), static::$BDDName."/canBeUpdated");
        return false;
    }
    return false;
  }
}
?>

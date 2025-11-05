<?php

namespace BDDObject;
use PDO;
use PDOException;
use ErrorController as EC;

final class Unfinished extends Trial
{

  ##################################### METHODES STATIQUES #####################################

  protected static function champs()
  {
    return [
      'id' => ['def' =>'', 'type' => 'string', "sub" =>"CONCAT(idUser,'_',idExoDevoir)"],
      'idExoDevoir' => ['def' => 0, 'type'=> 'int'],     // id de l'exercice associé
      'idUser' => ['def' => 0, 'type'=> 'int'],     // id de l'utilisateur
      'score' => ['def' => 0, 'type'=> 'int'],        // score de l'essai
      'init' => ['def' => "", 'type'=> 'string'], // JSON des intialisations de l'exercice
      'answers' => ['def' => "", 'type'=> 'string'], // JSON des réponses de l'utilisateur
      'date' => ['def' => date('Y-m-d'), 'type'=> 'date'], // date de l'essai
      'finished' => ['def' => false, 'type'=> 'bool'], // si l'essai est terminé
      'idBDD' => ['def' => 0, 'type'=> 'int', 'foreign' => 'trials.id'] // identifiant dans la table trials
    ] ;
  }

  public static function getList($filter = [])
  {
    if (!isset($filter['wheres']))
    {
      $filter['wheres'] = [];
    }
    $filter['wheres']['finished'] = 0;
    if (isset($filter['wheres']['id']))
    {
      // id est de la forme idUser_idExoDevoir
      $id = $filter['wheres']['id'];
      if (strpos($id, "_") === false)
      {
        return ["error" => true, "message" => "getList : identifiant invalide pour unfinished."];
      }
      list($idUser, $idExoDevoir) = explode("_", $id);
      if (isset($filter['wheres']['idUser']) && ($idUser!= $filter['wheres']['idUser']))
      {
        return [];
      }
      if (isset($filter['wheres']['idExoDevoir']) && ($idExoDevoir!= $filter['wheres']['idExoDevoir']))
      {
        return [];
      }
      $filter['wheres']['idUser'] = $idUser;
      $filter['wheres']['idExoDevoir'] = $idExoDevoir;
      unset($filter['wheres']['id']);
    }   
    return parent::getList($filter);
  }

}

?>

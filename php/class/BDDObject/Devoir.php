<?php

namespace BDDObject;

use PDO;
use PDOException;
use ErrorController as EC;

final class Devoir extends Item
{
  protected static $BDDName = "devoirs";
  ##################################### METHODES STATIQUES #####################################

  protected static function champs()
  {
    return [
      'nom' => ['def' => "", 'type'=> 'string'],         // nom du devoir
      'idOwner' => ['def' => 0, 'type'=> 'int'],         // id du propriétaire du devoir
      'idClasse' => ['def' => 0, 'type'=> 'int'],        // id de la classe associée
      'nomOwner' => ['def' => "", 'type'=> 'string', 'foreign'=>'users.nom'], // nom du propriétaire du devoir
      'description' => ['def' => "", 'type'=> 'string'], // descriptif du devoir
      'dateDebut' => ['def' => date('Y-m-d'), 'type'=> 'date'], // date de début
      'dateFin' => ['def' => date('Y-m-d', strtotime('+1 month')), 'type'=> 'date'] // date de fin
    ] ;
  }

  protected static function joinedTables()
  {
    return [
      'inner' => ['idOwner' => 'users.id']
    ];
  }

  protected static function children()
  {
    return [
      'assoc_exo_devoir'=> ['strangerId'=>'idDevoir', 'allowDelete'=>false]
    ];
  }

  ##################################### METHODES #####################################
}

?>

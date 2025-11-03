<?php

namespace BDDObject;
use PDO;
use PDOException;
use ErrorController as EC;

/**
 * Classe Note représentant une note dans la base de données.
 */

final class Note extends Item
{
  protected static $BDDName = "users";
  ##################################### METHODES STATIQUES #####################################

  // Les champs ne vont pas servir pour la création du SELECT car je vais créer un
  // SELECT customisé pour ce cas.
  protected static function champs()
  {
    return [
      'id' => ['def' => 0, 'type'=> 'string', 'alias'=>"id", "sub"=>"CONCAT(users.id, '_', devoirs.id)"], // identifiant unique du devoir
      'idDevoir' => ['def' => 0, 'type'=> 'int', "foreign"=>'devoirs.id'],        // id du devoir associé
      'nom' => ['def' => "", 'type'=> 'string', "foreign"=>'devoirs.nom'],         // nom du devoir
      'description' => ['def' => "", 'type'=> 'string', "foreign"=>'devoirs.description'], // description du devoir
      'idOwner' => ['def' => 0, 'type'=> 'int', "foreign"=>'devoirs.idOwner'],         // id du propriétaire du devoir
      'nomOwner' => ['def' => "", 'type'=> 'string', 'foreign'=>'owners.nom'], // nom du propriétaire du devoir
      'idClasse' => ['def' => 0, 'type'=> 'int'],        // id de la classe associée
      'nomClasse' => ['def' => "", 'type'=> 'string', 'foreign'=>'classes.nom'], // nom de la classe associée
      'nomUser' => ['def' => "", 'type'=> 'string', 'foreign'=>'users.nom'], // nom de l'élève
      'prenomUser' => ['def' => "", 'type'=> 'string', 'foreign'=>'users.prenom'], // prénom de l'élève
      'dateDebut' => ['def' => date('Y-m-d'), 'type'=> 'date', "foreign"=>'devoirs.dateDebut'], // date de début
      'dateFin' => ['def' => date('Y-m-d', strtotime('+1 month')), 'type'=> 'date', "foreign"=>'devoirs.dateFin'], // date de fin
      'note' => ['def' => 0, 'type'=> 'int', 'foreign'=>'noteexos.note', 'agregation'=>'AVG']        // note obtenue pour ce devoir
    ] ;
  }

  protected static function joinedTables()
  {
    return [
      'inner' => [
        'devoirs' => 'devoirs.idClasse = users.idClasse',
        'classes' => 'users.idClasse = classes.id',
        'users:owners' => 'devoirs.idOwner = owners.id',
        'exodevoirs' => 'devoirs.id = exodevoirs.idDevoir',
      ],
      'left' => [
        'noteexos' => 'exodevoirs.id = noteexos.idExoDevoir AND noteexos.idUser = users.id'
      ]
    ];
  }

  protected static function groupBy()
  {
    return ["devoirs.id", "users.id"];
  }


  protected static function insertValidation($params)
  {
    return false;
  }

  ##################################### METHODES #####################################

  protected function updateValidation($params)
  {
    return false;
  }

  protected function okToDelete()
  {
    EC::addError("Une note ne peut pas être supprimée directement.");
    return false;
  }
}

?>

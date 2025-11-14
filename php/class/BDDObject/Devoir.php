<?php

namespace BDDObject;

final class Devoir extends Item
{
  protected static $BDDName = "devoirs";
  ##################################### METHODES STATIQUES #####################################

  protected static function champs()
  {
    return [
      'nom' => ['def' => "", 'type'=> 'string'],         // nom du devoir
      'idOwner' => ['def' => 0, 'type'=> 'integer'],         // id du propriétaire du devoir
      'idClasse' => ['def' => 0, 'type'=> 'integer'],        // id de la classe associée
      'nomClasse' => ['def' => "", 'type'=> 'string', 'foreign'=>'classes.nom'], // nom de la classe associée
      'nomOwner' => ['def' => "", 'type'=> 'string', 'foreign'=>'users.nom'], // nom du propriétaire du devoir
      'description' => ['def' => "", 'type'=> 'string'], // descriptif du devoir
      'dateDebut' => ['def' => date('Y-m-d'), 'type'=> 'date'], // date de début
      'dateFin' => ['def' => date('Y-m-d', strtotime('+1 month')), 'type'=> 'date'] // date de fin
    ] ;
  }

  protected static function joinedTables()
  {
    return [
      'inner' => [
        'users' => 'devoirs.idOwner = users.id',
        'classes' => 'devoirs.idClasse = classes.id'
      ]
    ];
  }

  ##################################### METHODES #####################################
  public function clone()
  {
    $newDevoir = new Devoir([
      "nom" => $this->get("nom"),
      "idOwner" => $this->get("idOwner"),
      "idClasse" => $this->get("idClasse"),
      "description" => $this->get("description"),
      "dateDebut" => $this->get("dateDebut"),
      "dateFin" => $this->get("dateFin")
    ]);
    return $newDevoir;
  }
}

?>

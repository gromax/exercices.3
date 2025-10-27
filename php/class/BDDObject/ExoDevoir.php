<?php

namespace BDDObject;

final class ExoDevoir extends Item
{
  protected static $BDDName = "exodevoirs";

  ##################################### METHODES STATIQUES #####################################

  protected static function champs()
  {
    return [
      'idExo' => ['def' => 0, 'type'=> 'int'],       // id de l'exercice associé
      'title' => ['def' => "", 'type'=> 'string', 'foreign'=>'exercices.title'],    // titre de l'exercice
      'idDevoir' => ['def' => 0, 'type'=> 'int'],      // id du devoir associé
      'options' => ['def' => "", 'type'=> 'string'],   // options de l'exercice, JSON
      'idOwner' => ['def' => 0, 'type'=> 'int', 'foreign'=>'devoirs.idOwner'],    // id du propriétaire (professeur)
      'idClasse' => ['def' => 0, 'type'=> 'int', 'foreign'=>'devoirs.idClasse'],    // id de la classe à laquelle l'exercice a été assigné
    ] ;
  }

  protected static function joinedTables()
  {
    return [
      'inner' => ['idDevoir' => 'devoirs.id', 'idExo' => 'exercices.id'],
    ];
  }

  ##################################### METHODES #####################################

}
?>

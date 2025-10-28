<?php

namespace BDDObject;

final class Trial extends Item
{
  protected static $BDDName = "trials";

  ##################################### METHODES STATIQUES #####################################

  protected static function champs()
  {
    return [
      'idExoDevoir' => ['def' => 0, 'type'=> 'int'],     // id de l'exercice associé
      'idUser' => ['def' => 0, 'type'=> 'int'],     // id de l'utilisateur
      'note' => ['def' => 0, 'type'=> 'int'],        // note de l'essai
      'inputs' => ['def' => "", 'type'=> 'string'], // JSON des inputs intialisant l'exercice
      'answers' => ['def' => "", 'type'=> 'string'], // JSON des réponses de l'utilisateur
      'date' => ['def' => date('Y-m-d'), 'type'=> 'date'], // date de l'essai
      'finished' => ['def' => false, 'type'=> 'bool'] // si l'essai est terminé
    ] ;
  }
}

?>

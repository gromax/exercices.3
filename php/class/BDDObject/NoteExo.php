<?php
namespace BDDObject;
use ErrorController as EC;

/**
 * Classe Note représentant une note obtenue par un élève pour un exercice dans un devoir
 * Ne correspond pas à une table de la BDD
 * Donc en lecture seule
 */
final class NoteExo extends Item
{
  protected static $BDDName = "users";


  ##################################### METHODES STATIQUES #####################################

  protected static function champs()
  {
    return [
      'nom' => ['def' => "", 'type'=> 'string', 'alias' => 'nomUser'], // nom de l'utilisateur
      'prenom' => ['def' => "", 'type'=> 'string', 'alias' => 'prenomUser'], // prénom de l'utilisateur
      'idClasse' => ['def' => 0, 'type'=> 'int', 'foreign'=>'classes.id'],    // id de la classe à laquelle l'exercice a été assigné
      'idOwner' => ['def' => 0, 'type'=> 'int', 'foreign'=>'classes.idOwner'],    // id du propriétaire (professeur)
      'nomClasse' => ['def' => "", 'type'=> 'string', 'foreign'=>'classes.nom'], // nom de la classe
      'idDevoir' => ['def' => 0, 'type'=> 'int', 'foreign'=>'devoirs.id'],      // id du devoir associé
      'idExo' => ['def' => 0, 'type'=> 'int', 'foreign'=>'exercices.id'],       // id de l'exercice associé
      'idExoDevoir' => ['def' => 0, 'type'=> 'int', 'foreign'=>'exodevoirs.id'], // id de l'exercice dans le devoir
      'title' => ['def' => "", 'type'=> 'string', 'foreign'=>'exercices.title'],    // titre de l'exercice
      'description' => ['def' => "", 'type'=> 'string', 'foreign'=>'exercices.description'], // description de l'exercice
      'options' => ['def' => "", 'type'=> 'string', 'foreign'=>'exodevoirs.options'],   // options de l'exercice, JSON
      'num' => ['def' => 0, 'type'=> 'int', 'foreign'=>'exodevoirs.num'],        // numéro d'ordre dans le devoir
      'note' => ['def' => 0, 'type'=> 'int', 'foreign'=>'trials.note', 'agregation'=>'MAX'],        // note obtenue pour cet exercice
      'trialsNumber' => ['def' => 0, 'type'=> 'int', 'foreign'=>'trials.id', 'agregation'=>'COUNT'] // nombre d'essais
    ] ;
  }

  protected static function joinedTables()
  {
    return [
      'inner' => [
        'classes' => 'users.idClasse = classes.id',
        'devoirs' => 'devoirs.idClasse = classes.id',
        'exodevoirs' => 'devoirs.id = exodevoirs.idDevoir',
        'exercices' => 'exodevoirs.idExo = exercices.id',
      ],
      'left' => [
        'trials' => 'exodevoirs.id = trials.idExoDevoir AND trials.idUser = users.id'
      ]
    ];
  }

  protected static function groupby()
  {
    return [
      'exodevoirs.id',
      'users.id'
    ];
  }

  protected static function insertValidation($params)
  {
    return false;
  }

  ##################################### METHODES ###############################

  protected function updateValidation($params)
  {
    return false;
  }


  protected function okToDelete()
  {
    EC::addError("Une note ne peut pas être supprimée directement.");
    return false;
  }



  ##################################### METHODES PUBLIQUES ###############################


}

?>

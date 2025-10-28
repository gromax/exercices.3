<?php
namespace BDDObject;
use ErrorController as EC;

/**
 * Classe Note représentant une note obtenue par un élève pour un exercice dans un devoir
 * Ne correspond pas à une table de la BDD
 * Donc en lecture seule
 */
final class Note extends Item
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
      'num' => ['def' => 0, 'type'=> 'int'],        // numéro d'ordre dans le devoir
      'idUser' => ['def' => 0, 'type'=> 'int', 'foreign'=>'trials.idUser'],     // id de l'utilisateur
      'nomUser' => ['def' => "", 'type'=> 'string', 'foreign'=>'users.nom'], // nom de l'utilisateur
      'prenomUser' => ['def' => "", 'type'=> 'string', 'foreign'=>'users.prenom'], // prénom de l'utilisateur
      'note' => ['def' => 0, 'type'=> 'int', 'foreign'=>'trials.note', 'agregation'=>'MAX'],        // note obtenue pour cet exercice
      'trialNumber' => ['def' => 0, 'type'=> 'int', 'foreign'=>'trials.id', 'agregation'=>'COUNT'] // nombre d'essais
    ] ;
  }

  // note ça va être plus compliqué par ce qu'il va falloir un group by

  protected static function joinedTables()
  {
    return [
      'inner' => [
        'devoirs' => 'exodevoirs.idDevoir = devoirs.id',
        'exercices' => 'exodevoirs.idExo = exercices.id',
        'classes' => 'devoirs.idClasse = classes.id',
        'users' => 'users.idClasse = classes.id'
      ],
      'left' => [
        'trials' => 'exodevoirs.id = trials.idExoDevoir AND trials.idUser = users.id'
      ]
    ];
  }

  protected static function groupby()
  {
    return [
      'trials.idExoDevoir',
      'trials.idUser'
    ];
  }

  ##################################### METHODES ###############################

  protected function okToDelete()
  {
    EC::addError("Une note ne peut pas être supprimée directement.");
    return false;
  }

  protected function insertValidation($params)
  {
    return false;
  }

  protected function updateValidation($params)
  {
    return false;
  }

  ##################################### METHODES PUBLIQUES ###############################


}

?>

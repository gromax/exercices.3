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

    /**
     * Retourne les attributs identifiant de la note exercice
     * @return array<string> Tableau des attributs identifiant de la note exercice
     */
    protected static function idAttribute()
    {
        return ['users.id','exodevoirs.id'];
    }

    /**
     * Retourne les champs de la note exercice
     * @return array Tableau des champs de la note exercice
     */
    protected static function champs()
    {
        return [
            'id' => ['def' => "", 'type'=> 'string', 'alias'=>"id", "sub" => "CONCAT(users.id,'_',exodevoirs.id)"], // identifiant unique de la note exercice
            'idUser' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'users.id'],            // id de l'utilisateur (élève)
            'nom' => ['def' => "", 'type'=> 'string', 'alias' => 'nomUser'], // nom de l'utilisateur
            'prenom' => ['def' => "", 'type'=> 'string', 'alias' => 'prenomUser'], // prénom de l'utilisateur
            'idClasse' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'classes.id'],        // id de la classe à laquelle l'exercice a été assigné
            'idOwner' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'classes.idOwner'],        // id du propriétaire (professeur)
            'idDevoir' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'devoirs.id'],            // id du devoir associé
            'idExo' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'exercices.id'],             // id de l'exercice associé
            'idExoDevoir' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'exodevoirs.id'], // id de l'exercice dans le devoir
            'title' => ['def' => "", 'type'=> 'string', 'foreign'=>'exercices.title'],        // titre de l'exercice
            'description' => ['def' => "", 'type'=> 'string', 'foreign'=>'exercices.description'], // description de l'exercice
            'options' => ['def' => "", 'type'=> 'json', 'foreign'=>'exodevoirs.options'], // options spécifiques pour cet exercice dans le devoir
            'num' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'exodevoirs.num'],                // numéro d'ordre dans le devoir
            'note' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'noteexos.note'],                // note obtenue pour cet exercice
            'trials' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'noteexos.trials'] // nombre d'essais
        ] ;
    }

    /**
     * Retourne les tables jointes pour la note exercice
     * @return array Tableau des tables jointes
     */
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
                'noteexos' => 'exodevoirs.id = noteexos.idExoDevoir AND noteexos.idUser = users.id'
            ]
        ];
    }

    /**
     * Valide les valeurs avant l'insertion dans la base de données
     * @param array<string, mixed> $params Valeurs à insérer
     * @return bool|array true si les valeurs sont valides, tableau d'erreurs sinon
     */
    protected static function insertValidation($params)
    {
        return false;
    }

    ##################################### METHODES ###############################

    /**
     * Valide les valeurs avant la mise à jour dans la base de données
     * @param array<string, mixed> $params Valeurs à mettre à jour
     * @return bool|array true si les valeurs sont valides, tableau d'erreurs sinon
     */
    protected function updateValidation($params)
    {
        return false;
    }


    /**
     * Vérifie si la note peut être supprimée
     * @return bool false car une note ne peut pas être supprimée directement
     */
    protected function okToDelete()
    {
        EC::addError("Une note ne peut pas être supprimée directement.");
        return false;
    }

    ##################################### METHODES PUBLIQUES ###############################

}

?>

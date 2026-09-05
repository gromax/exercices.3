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

    /**
     * Retourne les champs de la note
     * @return array Tableau des champs de la note
     */
    protected static function champs()
    {
        return [
            'id' => ['def' => 0, 'type'=> 'string', 'alias'=>"id", "sub"=>"CONCAT(users.id, '_', devoirs.id)"], // identifiant unique du devoir
            'idUser' => ['def' => 0, 'type'=> 'integer', "foreign"=>'users.id'],                // id de l'élève
            'idDevoir' => ['def' => 0, 'type'=> 'integer', "foreign"=>'devoirs.id'],                // id du devoir associé
            'nom' => ['def' => "", 'type'=> 'string', "foreign"=>'devoirs.nom'],                 // nom du devoir
            'description' => ['def' => "", 'type'=> 'string', "foreign"=>'devoirs.description'], // description du devoir
            'idOwner' => ['def' => 0, 'type'=> 'integer', "foreign"=>'devoirs.idOwner'],                 // id du propriétaire du devoir
            'nomOwner' => ['def' => "", 'type'=> 'string', 'foreign'=>'owners.nom'], // nom du propriétaire du devoir
            'idClasse' => ['def' => 0, 'type'=> 'integer'],                // id de la classe associée
            'nomClasse' => ['def' => "", 'type'=> 'string', 'foreign'=>'classes.nom'], // nom de la classe associée
            'nomUser' => ['def' => "", 'type'=> 'string', 'foreign'=>'users.nom'], // nom de l'élève
            'prenomUser' => ['def' => "", 'type'=> 'string', 'foreign'=>'users.prenom'], // prénom de l'élève
            'dateDebut' => ['def' => date('Y-m-d'), 'type'=> 'date', "foreign"=>'devoirs.dateDebut'], // date de début
            'dateFin' => ['def' => date('Y-m-d', strtotime('+1 month')), 'type'=> 'date', "foreign"=>'devoirs.dateFin'], // date de fin
            'note' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'noteexos.note', 'sub'=>'CEIL(AVG(COALESCE(noteexos.note,0)))'],                // note obtenue pour ce devoir
            'exosCount' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'exodevoirs.id', 'agregation'=>'COUNT'] // nombre d'exercices liés
        ] ;
    }

    /**
     * Retourne l'attribut identifiant de la note
     * @return array<string> Tableau des attributs identifiants
     */
    protected static function idAttribute()
    {
        return ['users.id','devoirs.id'];
    }

    /**
     * Retourne les tables jointes pour la note
     * @return array Tableau des tables jointes
     */
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

    /**
     * Retourne les attributs de regroupement pour la note
     * @return array<string> Tableau des attributs de regroupement
     */
    protected static function groupBy()
    {
        return ["devoirs.id", "users.id"];
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

    /**
     * Retourne la note moyenne d'un utilisateur pour un exercice donné
     * @param int $idExoDevoir Identifiant de l'exercice dans le devoir
     * @param int $idUser Identifiant de l'utilisateur
     * @return int Note moyenne
     */
    public static function getNote($idExoDevoir, $idUser)
    {
        require_once BDD_CONFIG;
        try{
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $prefix = PREFIX_BDD;
            $stmt = $pdo->prepare(<<<SQL
                SELECT CEIL(AVG(COALESCE(ne.note, 0)))
                FROM {$prefix}exodevoirs AS ed
                LEFT JOIN {$prefix}noteexos AS ne
                ON ne.idExoDevoir = ed.id AND ne.idUser = :idUser
                WHERE ed.idDevoir = (
                    SELECT idDevoir FROM {$prefix}exodevoirs WHERE id = :idExoDevoir
                )
            SQL
            );
            $stmt->execute(array(
                ':idExoDevoir' => $idExoDevoir,
                ':idUser' => $idUser
            ));
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage(), 'Note/getNote');
        }
        return (int) $stmt->fetchColumn();
    }

    ##################################### METHODES #####################################

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
}

?>

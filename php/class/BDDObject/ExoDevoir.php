<?php

namespace BDDObject;
use PDO;
use PDOException;
use ErrorController as EC;

final class ExoDevoir extends Item
{
    protected static $BDDName = "exodevoirs";

    ##################################### METHODES STATIQUES #####################################

    /**
     * Retourne les champs de la table exodevoirs
     * @return array Tableau des champs avec leurs définitions et types
     */
    protected static function champs()
    {
        return [
            'idExo' => ['def' => 0, 'type'=> 'integer'],             // id de l'exercice associé
            'title' => ['def' => "", 'type'=> 'string', 'foreign'=>'exercices.title'],        // titre de l'exercice
            'description' => ['def' => "", 'type'=> 'string', 'foreign'=>'exercices.description'],        // description de l'exercice
            'idDevoir' => ['def' => 0, 'type'=> 'integer'],            // id du devoir associé
            'options' => ['def' => "", 'type'=> 'string'],     // options de l'exercice, JSON
            'idOwner' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'devoirs.idOwner'],        // id du propriétaire (professeur)
            'idClasse' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'devoirs.idClasse'],        // id de la classe à laquelle l'exercice a été assigné
            'num' => ['def' => 0, 'type'=> 'integer'],                // numéro d'ordre dans le devoir
        ] ;
    }

    /**
     * Retourne les tables jointes pour la table exodevoirs
     * @return array Tableau des tables jointes
     */
    protected static function joinedTables()
    {
        return [
            'inner' => [
                'devoirs' => 'exodevoirs.idDevoir = devoirs.id',
                'exercices' => 'exodevoirs.idExo = exercices.id'
            ],
        ];
    }

    ##################################### METHODES #####################################

    /**
     * Réordonne les exercices dans le devoir
     * @param int $prevNum Numéro précédent de l'exercice
     * @param int $nextNum Nouveau numéro de l'exercice
     * @return bool true si le réordonnancement a réussi, false sinon
     */

    public function reorder($prevNum, $nextNum)
    {
        if ($nextNum > $prevNum)
        {
            return $this->lowerExos($prevNum, $nextNum);
        }
        else if ($nextNum < $prevNum)
        {
            return $this->raiseExos($prevNum, $nextNum);
        }
        return true;
    }

    /**
     * Abaisse le numéro des exercices entre $prevNum et $nextNum
     * @param int $prevNum Numéro précédent de l'exercice
     * @param int $nextNum Nouveau numéro de l'exercice
     * @return bool true si l'opération a réussi, false sinon
     */
    protected function lowerExos($prevNum, $nextNum)
    {
        $idDevoir = $this->get("idDevoir");
        require_once BDD_CONFIG;
        try {
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $stmt = $pdo->prepare("UPDATE ".PREFIX_BDD.self::$BDDName." SET num = num - 1 WHERE idDevoir = :idDevoir AND num > :prevNum AND num <= :nextNum and id <> :idCurrent");
            $stmt->bindValue(':idDevoir', $idDevoir, PDO::PARAM_INT);
            $stmt->bindValue(':prevNum', $prevNum, PDO::PARAM_INT);
            $stmt->bindValue(':nextNum', $nextNum, PDO::PARAM_INT);
            $stmt->bindValue(':idCurrent', $this->getId(), PDO::PARAM_INT);
            $stmt->execute();
            return true;
        } catch (PDOException $e) {
            EC::addError("Erreur lors du réordonnancement des exercices : ".$e->getMessage());
            EC::set_error_code(501);
            return false;
        }
    }

    /**
     * Augmente le numéro des exercices entre $prevNum et $nextNum
     * @param int $prevNum Numéro précédent de l'exercice
     * @param int $nextNum Nouveau numéro de l'exercice
     * @return bool true si l'opération a réussi, false sinon
     */
    protected function raiseExos($prevNum, $nextNum)
    {
        $idDevoir = $this->get("idDevoir");
        require_once BDD_CONFIG;
        try {
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $prefixTableName = PREFIX_BDD.self::$BDDName;
            $stmt = $pdo->prepare(<<<SQL
                UPDATE {$prefixTableName} SET num = num + 1
                WHERE idDevoir = :idDevoir AND num >= :nextNum AND num < :prevNum AND id <> :idCurrent
            SQL
            );
            $stmt->bindValue(':idDevoir', $idDevoir, PDO::PARAM_INT);
            $stmt->bindValue(':prevNum', $prevNum, PDO::PARAM_INT);
            $stmt->bindValue(':nextNum', $nextNum, PDO::PARAM_INT);
            $stmt->bindValue(':idCurrent', $this->getId(), PDO::PARAM_INT);
            $stmt->execute();
            return true;
        } catch (PDOException $e) {
            EC::addError("Erreur lors du réordonnancement des exercices : ".$e->getMessage());
            EC::set_error_code(501);
            return false;
        }
    }

    /**
     * Réordonne les exercices après la suppression d'un exercice
     * @return bool true si l'opération a réussi, false sinon
     */
    protected function onDeleteSuccess() {
        $num = $this->get("num");
        $idDevoir = $this->get("idDevoir");
        require_once BDD_CONFIG;
        try {
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $prefixTableName = PREFIX_BDD.self::$BDDName;
            $stmt = $pdo->prepare(<<<SQL
                UPDATE {$prefixTableName} SET num = num - 1
                WHERE idDevoir = :idDevoir AND num > :num
            SQL
            );
            $stmt->bindValue(':idDevoir', $idDevoir, PDO::PARAM_INT);
            $stmt->bindValue(':num', $num, PDO::PARAM_INT);
            $stmt->execute();
            return true;
        } catch (PDOException $e) {
            EC::addError("Erreur lors du réordonnancement des exercices : ".$e->getMessage());
            EC::set_error_code(501);
            return false;
        }
    }
}
?>

<?php

namespace BDDObject;

use PDO;
use PDOException;
use ErrorController as EC;
use SessionController as SC;

final class Exercice extends Item
{
    protected static $BDDName = "exercices";

    ##################################### METHODES STATIQUES #####################################

    protected static function champs()
    {
        return array(
            'title' => array( 'def' => "", 'type'=> 'string'),        // nom de l'exercice
            'keywords' => array( 'def' => "", 'type'=> 'string'),   // mots-clés de l'exercice
            'description' => array( 'def' => "", 'type'=> 'string'), // descriptif de l'exercice
            'options' => array( 'def' => "", 'type'=> 'string'),   // options de l'exercice (json)
            'code' => array( 'def' => "", 'type'=> 'string'),      // code de l'exercice (json)
            );
    }

    public static function getList()
    {
        require_once BDD_CONFIG;
        try {
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $stmt = $pdo->prepare("SELECT id, title, `description`, keywords, options, code FROM ".PREFIX_BDD."exercices");
            $stmt->execute();
            $bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage(), "Exercices/getList");
            return array("error"=>true, "message"=>$e->getMessage());
        }
        return $bdd_result;
    }

    ##################################### METHODES #####################################
}

?>

<?php

namespace BDDObject;

use PDO;
use PDOException;
use ErrorController as EC;

final class Message extends Item
{
    protected static $BDDName = "messages";

    ##################################### METHODES STATIQUES #####################################

    /**
     * Définit les champs de la table des messages
     * @return array Les champs de la table des messages
     */
    protected static function champs()
    {
        return array(
            'idOwner' => array( 'def' => null, 'type' => 'integer'),    // id de l'auteur
            'message' => array( 'def' => "", 'type'=> 'string'),        // contenu du message
            'aUE' => array( 'def' => "", 'type' => 'integer'),    // données relatives au contexte
            'date' => array( 'def' => date('Y-m-d H:i:s'), 'type' => 'datetime'),    // Date-heure de création
            'lu' => array( 'def' => false, 'type'=>'boolean'),
            'idDest' => array( 'def' => null, 'type' => 'integer')
            );
    }

    /**
     * Récupère la liste des messages pour un utilisateur donné
     * @param int $idUser L'identifiant de l'utilisateur
     * @return array La liste des messages
     */
    public static function getListUser($idUser)
    {
        require_once BDD_CONFIG;
        try {
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // en tant qu'expéditeur
            $prefix = PREFIX_BDD;
            $stmt = $pdo->prepare(<<<SQL
                SELECT m.id, m.idOwner, m.message, m.aUE, m.date, 'Moi' AS ownerName,
                    m.idDest, CONCAT(u.nom,' ',u.prenom) AS destName, 1 AS lu
                FROM ({$prefix}messages m JOIN {$prefix}users u ON u.id=m.idDest)
                WHERE m.idOwner=:idOwner
            SQL
            );
            $stmt->execute(array(':idOwner' => $idUser));
            $expediteur_bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // en tant que récepteur
            $stmt = $pdo->prepare(<<<SQL
                SELECT m.id, m.idOwner, m.message, m.aUE, m.date,
                    CONCAT(u.prenom, ' ', u.nom) AS ownerName,
                    :idDest AS idDest, 'Moi' AS destName, m.lu 
                FROM ({$prefix}messages m JOIN {$prefix}users u ON u.id = m.idOwner) 
                WHERE m.idDest=:idDest
            SQL
            );
            $stmt->execute(array(':idDest' => $idUser));
            $recepteur_bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage(), "Messages/getList");
            return array("error"=>true, "message"=>$e->getMessage());
        }
        $bdd_result = array_merge($expediteur_bdd_result, $recepteur_bdd_result);
        $dates = array_column($bdd_result,"date");
        array_multisort($dates,SORT_ASC,$bdd_result);
        return $bdd_result;
    }

    /**
     * Récupère le nombre de messages non lus pour un utilisateur donné
     * @param int $idUser L'identifiant de l'utilisateur
     * @return int Le nombre de messages non lus
     */
    public static function unReadNumber($idUser)
    {
        if ($idUser === null) {
            return 0;
        }
        require_once BDD_CONFIG;
        try{
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $prefixTableName = PREFIX_BDD.static::$BDDName;
            $stmt = $pdo->prepare(<<<SQL
                SELECT id FROM {$prefixTableName} WHERE idDest = :idDest AND lu = 0
            SQL
            );
            $stmt->execute(array(':idDest' => $idUser));
            return $stmt->rowCount();
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage(), 'Messages/unReadNumber');
        }
        return 0;
    }


    ##################################### METHODES #####################################

    /**
     * Vérifie si le message appartient à un utilisateur donné
     * @param User $user L'utilisateur à vérifier
     * @return bool true si le message appartient à l'utilisateur, false sinon
     */
    public function isOwnedBy($user)
    {
        return $this->values['idOwner'] == $user->getId();
    }

    /**
     * Vérifie si le message est destiné à un utilisateur donné
     * @param User $user L'utilisateur à vérifier
     * @return bool true si le message est destiné à l'utilisateur, false sinon
     */
    public function isDestTo($user)
    {
        return $this->values['idDest'] == $user->getId();
    }

    /**
     * Marque le message comme lu
     * @return bool true si l'opération réussit, false sinon
     */
    public function setLu()
    {
        require_once BDD_CONFIG;
        try{
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $prefixTableName = PREFIX_BDD.static::$BDDName;
            $stmt = $pdo->prepare(<<<SQL
                UPDATE {$prefixTableName} SET lu = :lu WHERE id = :id
            SQL
            );
            $stmt->execute(array(
                ':lu' => true,
                ':id' => $this->id
            ));
            $this->values['lu'] = true;
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage(), static::$BDDName."/setLu");
            return false;
        }
        EC::add(static::$BDDName."/setLu : Succès.");
        return true;
    }

    /**
     * Récupère le nom complet de l'utilisateur destinataire du message
     * @return string Le nom complet de l'utilisateur destinataire, ou "?" si non trouvé
     */
    public function getDestName()
    {
        // utile pour construire la réponse lors d'une insertion de message
        require_once BDD_CONFIG;
        try {
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $prefix = PREFIX_BDD;
            $stmt = $pdo->prepare(<<<SQL
                SELECT CONCAT(nom,' ',prenom) as fullname
                FROM {$prefix}users WHERE id = :id
            SQL
            );
            $stmt->execute(array(':id' => $this->values['idDest']));
            $out = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($out !== null) {
                return $out["fullname"];
            } else {
                return "?";
            }
        } catch(PDOException $e) {
            if (EC::BDD_DEBUG) return array(
                'error'=>true,
                'message'=>"#User/getList : ".$e->getMessage()
            );
            return "?";
        }
    }
}

?>

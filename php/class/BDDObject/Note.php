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
  protected static $BDDName = "devoirs";
  ##################################### METHODES STATIQUES #####################################

  // Les champs ne vont pas servir pour la création du SELECT car je vais créer un
  // SELECT customisé pour ce cas.
  protected static function champs()
  {
    return [
      'nom' => ['def' => "", 'type'=> 'string'],         // nom du devoir
      'idOwner' => ['def' => 0, 'type'=> 'int'],         // id du propriétaire du devoir
      'nomOwner' => ['def' => "", 'type'=> 'string', 'foreign'=>'owners.nom'], // nom du propriétaire du devoir
      'idClasse' => ['def' => 0, 'type'=> 'int'],        // id de la classe associée
      'nomClasse' => ['def' => "", 'type'=> 'string', 'foreign'=>'classes.nom'], // nom de la classe associée
      'nomUser' => ['def' => "", 'type'=> 'string', 'foreign'=>'users.nom'], // nom de l'élève
      'prenomUser' => ['def' => "", 'type'=> 'string', 'foreign'=>'users.prenom'], // prénom de l'élève
      'dateDebut' => ['def' => date('Y-m-d'), 'type'=> 'date'], // date de début
      'dateFin' => ['def' => date('Y-m-d', strtotime('+1 month')), 'type'=> 'date'], // date de fin
      'note' => ['def' => 0, 'type'=> 'int', 'foreign'=>'noteexo.note', 'agregation'=>'AVG']        // note obtenue pour ce devoir
    ] ;
  }


  public static function getList($filter = [])
  {
    $args = ["wheres", "wheres_trials"];
    foreach ($filter as $key => $value) {
      if (!$key) {
        EC::addError("getList : clé vide dans le filtre.");
        return array("error"=>true, "message"=>"getList : clé vide dans le filtre");
      }
      if (!in_array($key, $args)) {
        EC::addError("getList : argument de filtre inconnu : $key.");
        return array("error"=>true, "message"=>"getList : argument de filtre inconnu : $key");
      }
    }

// requête à reprendre :
/*
SELECT users.id AS idUser, COALESCE(MAX(trials.note),0) AS note, exodevoirs.id AS idExoDevoir
  FROM exo_users AS users
  INNER JOIN exo_classes AS classes ON users.idClasse = classes.id
  INNER JOIN exo_devoirs AS devoirs ON devoirs.idClasse = classes.id
  INNER JOIN exo_exodevoirs AS exodevoirs ON exodevoirs.idDevoir = devoirs.id
  LEFT JOIN exo_trials AS trials ON trials.idExoDevoir = exodevoirs.id AND trials.idUser = users.id
  GROUP BY users.id, exodevoirs.id
  ;
*/



    
    $request = "WITH mtrials AS (
      SELECT users.id AS idUser, COALESCE(MAX(trials.note),0) AS note, exodevoirs.id AS idExoDevoir, devoirs.id AS idDevoir
      FROM ".PREFIX_BDD."users AS users
      INNER JOIN ".PREFIX_BDD."classes AS classes ON users.idClasse = classes.id
      INNER JOIN ".PREFIX_BDD."devoirs AS devoirs ON devoirs.idClasse = classes.id
      INNER JOIN ".PREFIX_BDD."exodevoirs AS exodevoirs ON exodevoirs.idDevoir = devoirs.id
      LEFT JOIN ".PREFIX_BDD."trials AS trials ON trials.idExoDevoir = exodevoirs.id AND trials.idUser = users.id
      __where_trials_clause__
      GROUP BY users.id, exodevoirs.id
    )
    SELECT devoirs.id AS idDevoir, devoirs.nom,
           devoirs.idClasse, classes.nom AS nomClasse,
           owners.nom AS nomOwner, devoirs.idOwner AS idOwner,
           users.nom AS nomUser, users.prenom AS prenomUser, users.id AS idUser,
           devoirs.dateDebut, devoirs.dateFin,
           CEIL(COALESCE(AVG(mtrials.note), 0)) AS note
    FROM ".PREFIX_BDD."devoirs AS devoirs
    INNER JOIN ".PREFIX_BDD."users AS owners ON owners.id = devoirs.idOwner
    INNER JOIN ".PREFIX_BDD."classes AS classes ON classes.id = devoirs.idClasse
    INNER JOIN ".PREFIX_BDD."users AS users ON users.idClasse = classes.id
    LEFT JOIN mtrials ON mtrials.idDevoir = devoirs.id AND mtrials.idUser = users.id
    __where_clause__
    GROUP BY devoirs.id, users.id";
    if (isset($filter['wheres'])) $wheres = $filter['wheres']; else $wheres = array();
    if (isset($filter['wheres_trials'])) $wheres_trials = $filter['wheres_trials']; else $wheres_trials = array();
    $request = str_replace("__where_trials_clause__", static::sqlGetWhere($wheres_trials), $request);
    $request = str_replace("__where_clause__", static::sqlGetWhere($wheres), $request);
    $wheres_globals = array_merge($wheres, $wheres_trials);
    require_once BDD_CONFIG;
    try
    {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare($request);
      foreach ($wheres_globals as $k => $v) {
        $stmt->bindValue(
          ":".str_replace(".", "_", $k),
          (string) $v
        );
      }
      $stmt->execute();
      $bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    catch(PDOException $e)
    {
      EC::addBDDError($e->getMessage(), static::$BDDName."/getList");
      EC::addBDDError($stmt->queryString, static::$BDDName."/getList");
      return array("error"=>true, "message"=>$e->getMessage());
    }
    return $bdd_result;
  }

  protected static function insertValidation($params)
  {
    return false;
  }

  ##################################### METHODES #####################################

  protected function updateValidation($params)
  {
    return false;
  }

  protected function okToDelete()
  {
    EC::addError("Une note ne peut pas être supprimée directement.");
    return false;
  }
}

?>

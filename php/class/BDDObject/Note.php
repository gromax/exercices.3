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
    $args = ["wheres"];
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

    $request = "WITH mtrials AS (
      SELECT exodevoirs.idDevoir as idDevoir, trials.idExoDevoir, idUser,
      MAX(trials.note) AS max_note_exo_devoir
      FROM ".PREFIX_BDD."trials AS trials
      INNER JOIN ".PREFIX_BDD."exodevoirs AS exodevoirs ON exodevoirs.id = trials.idExoDevoir
      INNER JOIN ".PREFIX_BDD."devoirs AS devoirs ON devoirs.id = exodevoirs.idDevoir
      __where_trials_clause__ GROUP BY idExoDevoir, idUser
    )
    SELECT devoirs.nom, devoirs.idOwner, devoirs.idClasse, classes.nom AS nomClasse,
           owners.nom AS nomOwner, users.nom AS nomUser, users.prenom AS prenomUser,
           devoirs.dateDebut, devoirs.dateFin,
           AVG(mtrials.max_note_exo_devoir) AS note
    FROM ".PREFIX_BDD."devoirs AS devoirs
    INNER JOIN ".PREFIX_BDD."users AS owners ON owners.id = devoirs.idOwner
    INNER JOIN ".PREFIX_BDD."classes AS classes ON classes.id = devoirs.idClasse
    INNER JOIN ".PREFIX_BDD."users AS users ON users.idClasse = classes.id
    LEFT JOIN max_trial ON max_trial.idDevoir = devoirs.id AND max_trial.idUser = users.id
    __where_clause__
    GROUP BY devoirs.id";
    if (isset($filter['wheres'])) $wheres = $filter['wheres']; else $wheres = array();
    $where1 = array_intersect_key($wheres, array_flip(['trials.idUser', 'devoirs.idClasse', 'devoirs.id']));
    $where2 = array_intersect_key($wheres, array_flip(['devoirs.id', 'users.id', 'classes.id', 'devoirs.idOwner']));
    $request = str_replace("__where_trials_clause__", static::sqlGetWhere($where1), $request);
    $request = str_replace("__where_clause__", static::sqlGetWhere($where2), $request);
    require_once BDD_CONFIG;
    try
    {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare($request);
      foreach ($wheres as $k => $v) {
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

  ##################################### METHODES #####################################

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


}

?>

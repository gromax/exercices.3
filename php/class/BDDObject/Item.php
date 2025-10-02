<?php

namespace BDDObject;
use PDO;
use PDOException;
use ErrorController as EC;

abstract class Item
{
  protected $id = null;
  protected $values = null;
  protected static $BDDName = "Item";
  protected static $TYPES = array(
    'integer' => PDO::PARAM_INT,
    'string' => PDO::PARAM_STR,
    'boolean' => PDO::PARAM_BOOL,
    'dateHeure' => PDO::PARAM_STR,
    'date' => PDO::PARAM_STR
  );

  ##################################### METHODES STATIQUES #####################################

  protected static function keys()
  {
    $arr = array_keys(static::champs());
    array_unshift($arr,"id");
    return $arr;
  }

  protected static function champs()
  {
    /*
      items de la forme
      'key' => array(
        'def' => "",       // valeur par défaut
        'type'=> 'string', // type de donnée (string, integer, boolean, dateHeure, date)
        'join'=> array(    // optionnel, si jointure
            'table'=>'users',       // table jointe
            'col'=>'nom',           // colonne à récupérer
            'strangerId'=>'idOwner' // colonne de la table courante qui référence l'id de la table jointe
        )
      )
    */
    return array();
  }

  protected static function children()
  {
    /*
      Renvoie les classes des objets enfants (pour la suppression en cascade)
      "table" => array(
        "strangerId" => "colonne de référence de l'objet dans la table enfant",
        "allowDelete" => true // si false, empêche la suppression de l'objet s'il a des enfants
      )
    */
    return array();
  }

  protected static function sqlGetSELECT($hideCols = array())
  {
    $champs = static::champs();
    $joinedTables = array();
    $joined = "";
    $keys = array();
    foreach ($champs as $key => $val) {
      if (in_array($key,$hideCols)) continue;
      if (isset($val['join'])) {
        extract($val['join']);
        // fournit : $table, $col, $strangerId
        if (!in_array($table,$joinedTables)) {
          $joinedTables[$table] = chr(98 + count($joinedTables)); // b, c, d, ...
        }
        $prefix = $joinedTables[$table];
        $joined = $joined." JOIN ".PREFIX_BDD.$table." AS $prefix ON $prefix.id=a.$strangerId";
        $keys[] = "$prefix.`$col` AS `$key`";
      } else {
        $keys[] = "a.`$key`";
      }
    }
    return "SELECT a.id, ".implode(", ",$keys)." FROM (".PREFIX_BDD.static::$BDDName." AS a $joined)";
  }

  public static function getList($filter = [])
  {
    $args = ["wheres", "hideCols"];
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
    if (isset($filter['wheres'])) $wheres = $filter['wheres']; else $wheres = array();
    if (isset($filter['hideCols'])) $hideCols = $filter['hideCols']; else $hideCols = array();
    $whereStrings = array_map(
      function($key) {
        return "a.`".$key."`=:".$key;
      }, array_keys($wheres)
    );
    if (count($wheres) > 0) {
      $where = " WHERE ".implode(" AND ",$whereStrings);
    } else {
      $where = "";
    }
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $select = static::sqlGetSELECT($hideCols);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare($select.$where);
      foreach ($wheres as $k => $v) {
        $stmt->bindValue(":$k", $v, static::$TYPES[static::champs()[$k]['type']] ?? PDO::PARAM_STR);
      }
      $stmt->execute();
      $bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
      } catch(PDOException $e) {
          EC::addBDDError($e->getMessage(), static::$BDDName."/getList");
          return array("error"=>true, "message"=>$e->getMessage());
      }
      return $bdd_result;
  }


  public function __construct($options=array())
  {
    $this->values = $this->parse($options);
    $arr = static::champs();
    foreach ($arr as $key => $val) {
      if (!array_key_exists($key,$this->values)) {
        $this->values[$key] = $val["def"];
      }
    }
    if (isset($options["id"])) {
      $this->id = (integer) $options["id"];
      $this->values["id"] = $this->id;
    }
  }

  public static function getObject($idInput)
  {
    if (!is_numeric($idInput)) {
      return null;
    }
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $select = static::sqlGetSELECT();
      $stmt = $pdo->prepare("$select WHERE a.id = :id");
      $stmt->bindValue(':id', $idInput, PDO::PARAM_INT);

      $stmt->execute();
      $bdd_result = $stmt->fetch(PDO::FETCH_ASSOC);
      if ($bdd_result === null) return null;
      $item = new static($bdd_result);
      return $item;
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage(),static::$BDDName."/getObject");
    }
    return null;
  }
  
  ##################################### METHODES #####################################

  public function parse($params=array())
  {
    $values = array();
    foreach ( $params as $key => $value) {
      $type = static::champs()[$key]['type'] ?? "";
      switch ($type)
      {
      case "integer":
        $values[$key] = (integer) $value;
        break;
      case "string":
        $values[$key] = (string) $value;
        break;
      case "boolean":
        $values[$key] = (boolean) $value;
        break;
      case "dateHeure":
        $values[$key] = $value;
        break;
      case "date":
        $values[$key] = $value;
        break;
      default:
        $values[$key] = $value;
      }
    }
    return $values;
  }

  public function __toString()
  {
    if ($this->id!==null) {
      return static::$BDDName."@".$this->id;
    } else {
      return static::$BDDName."@?";
    }
  }

  protected function okToDelete()
  {
    // Vérifie si l'objet peut être supprimé (enfants, etc.)
    $children = static::children();
    foreach ($children as $table => $child) {
      $strangerId = $child['strangerId'];
      $allowDelete = $child['allowDelete'] ?? true;
      require_once BDD_CONFIG;
      try {
        $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $stmt = $pdo->prepare("SELECT id FROM ".PREFIX_BDD.$table." WHERE $strangerId = :id");
        $stmt->bindValue(':id', $this->id, PDO::PARAM_INT);
        $stmt->execute();
        if (($stmt->rowCount() > 0) && !$allowDelete) {
          EC::addError(static::$BDDName."/delete : Impossible de supprimer l'objet car il a des enfants dans la table $table.");
          return false;
        }
      } catch(PDOException $e) {
        EC::addBDDError($e->getMessage(), static::$BDDName."/okToDelete");
        return false;
      }
    }
    return true;
  }

  protected function customDelete() {
      // Méthode vide, à surcharger dans les enfants si besoin
  }

  protected function deleteChildren()
  {
    $children = static::children();
    foreach ($children as $table => $child) {
      $strangerId = $child['strangerId'];
      require_once BDD_CONFIG;
      try {
        $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD.$table." WHERE $strangerId = :id");
        $stmt->bindValue(':id', $this->id, PDO::PARAM_INT);
        $stmt->execute();
      } catch(PDOException $e) {
        EC::addError($e->getMessage(), static::$BDDName."/deleteChildren");
        return false;
      }
    }
    return true;
  }

  public function delete()
  {
    if (!$this->okToDelete()) {
      EC::addError(static::$BDDName."/delete : L'objet a des enfants impossibles à supprimer.");
      return false;
    }

    if (!$this->deleteChildren()) {
      EC::addError(static::$BDDName."/delete : Impossible de supprimer les enfants.");
      return false;
    }

    require_once BDD_CONFIG;
    $this->customDelete();
    try {
      // Suppression des assoc liées
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD.static::$BDDName." WHERE id = :id");
      $stmt->execute(array(':id' => $this->id));
      EC::add("Item supprimé avec succès.");
      return true;
    } catch(PDOException $e) {
      EC::addError($e->getMessage(), static::$BDDName."/delete");
      return false;
    }
  }

  protected function filterInsert()
  {
    $champs = static::champs();
    $toInsert = array_intersect_key($this->values, $champs);
    unset($toInsert['id']);
    foreach ($champs as $key => $value) {
      if ($value['join'] ?? false) {
        // champ de jointure, on ne l'insère pas
        unset($toInsert[$key]);
      }
    }
    return $toInsert;
  }

  protected function insertValidation($params)
  {
    return true;
  }

  public function insert()
  {
    $toInsert = $this->filterInsert();

    $valid = $this->insertValidation($toInsert);
    if ($valid !== true) {
      return array("errors" => $valid);
    }

    if (count($toInsert) === 0) {
      EC::add(static::$BDDName."/insert : Aucune donnée à insérer.");
      return false;
    }

    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $champs = implode(", ", array_keys($toInsert));
      $tokens_values = implode(", ", array_map(function($k){ return ":$k"; }, array_keys($toInsert)));
      $stmt = $pdo->prepare("INSERT INTO ".PREFIX_BDD.static::$BDDName." ( $champs ) VALUES ( $tokens_values )");
      foreach ($toInsert as $k => $v) {
        $stmt->bindValue(":$k", $v, static::$TYPES[static::champs()[$k]['type']] ?? PDO::PARAM_STR);
      }
      $stmt->execute();
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage(), static::$BDDName."/insert");
      return null;
    }
    $this->id=$pdo->lastInsertId();
    $this->values["id"] = $this->id;
    EC::add($this." créé avec succès.");
    return $this->id;
  }

  protected function updateValidation($params)
  {
    return true;
  }

  protected function filterUpdate($params)
  {

    $toUpdate = array_intersect_key($params, static::champs());
    unset($toUpdate['id']);
    $champs = static::champs();
    foreach ($champs as $key => $value) {
      if ($value['join'] ?? false) {
        // champ de jointure, on ne l'insère pas
        unset($toUpdate[$key]);
      }
    }
    return $toUpdate;
  }

  public function update($params=array(),$updateBDD=true)
  {
    if ($this->id===null) {
      EC::addDebugError(static::$BDDName."/update : Id manquant.");
      return false;
    }

    $params = $this->parse($params);

    // vérifie que les valeurs proposées sont valides
    $valid = $this->updateValidation($params);
    if ($valid !== true) {
      return array("errors" => $valid);
    }

    // filtre les modifications
    $params = $this->filterUpdate($params);
    if (count($params) === 0) {
      EC::add(static::$BDDName."/update : Aucune modification.");
      return false;
    }
    // applique les modifications à l'objet
    $this->values = array_merge($this->values, $params);
    if (!$updateBDD) {
      EC::add(static::$BDDName."/update : Succès.");
      return true;
    }
    require_once BDD_CONFIG;
    try{
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $modifications = implode(", ", array_map(function($k){ return "$k=:$k"; }, array_keys($params)));
      $stmt = $pdo->prepare("UPDATE ".PREFIX_BDD.static::$BDDName." SET $modifications WHERE id = :id");
      foreach ($params as $k => $v) {
        $stmt->bindValue(":$k", $v, static::$TYPES[static::champs()[$k]['type']] ?? PDO::PARAM_STR);
      }
      $stmt->bindValue(':id', $this->id, PDO::PARAM_INT);
      $stmt->execute();
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage(), static::$BDDName."/update");
      return false;
    }
    EC::add(static::$BDDName."/update : Succès.");
    return true;
  }

  public function getId()
  {
    return $this->id;
  }

  public function get($key)
  {
    return $this->values[$key] ?? null;
  }

  public function getValues()
  {
    return $this->values;
  }

  public function toArray()
  {
    return $this->values;
  }
}
?>

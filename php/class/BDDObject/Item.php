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
        'foreign'=> 'table.key' // clé étrangère (optionnel)
        )
      )
    */
    return array();
  }

  protected static function joinedTables()
  {
    /*
      Permet aux classes enfants de définir des tables jointes.
      [
        "inner" => [         // pour les inner join
          "table à joindre" => "condition"
        ],
        "left" => [          // pour les left join
          "table à joindre" => "condition"
      ]
    */
    return array();
  }

  protected static function groupby()
  {
    /*
      Permet aux classes enfants de définir des colonnes pour le group by
      [
        "table1.key1",
        "table2.key2"
      ]
    */
    return array();
  }

  protected static function protectedChildren()
  {
    /*
      Renvoie les classes des objets enfants protégés (pour la suppression en cascade)
      ne permet la suppresssion que si pas d'enfants protégés
      "table" => "strangerId" // colonne de référence de l'objet dans la table enfant
    */
    return array();
  }

  protected static function sqlGetFieldsNames($hideCols, $forcecols)
  {
    $champs = static::champs();
    $bddName = static::$BDDName;
    $keys = array();
    if (!isset($champs["id"]) && !in_array("id",$hideCols)) {
      $keys[] = "$bddName.`id`";
    }
    foreach ($champs as $key => $val) {
      if (in_array($key,$hideCols)) continue;
      if (isset($val['alias'])) {
        $alias = $val['alias'];
      } else {
        $alias = $key;
      }
      if (isset($val['sub'])) {
        $keys[] = $val['sub'] ." AS `$alias`";
      } else if (isset($val['foreign'])) {
        [$table, $col] = explode(".",$val['foreign']);
        if (isset($val['agregation'])) {
          $def = isset($val['def']) ? $val['def'] : 0;
          $keys[] = "COALESCE(".$val['agregation']."($table.`$col`), $def) AS `$alias`";
        } else {
          $keys[] = "$table.`$col` AS `$alias`";
        }
      } else {
        if ($alias !== $key) {
          $keys[] = "$bddName.`$key` AS `$alias`";
        } else {
          $keys[] = "$bddName.`$key`";
        }
      }
    }
    foreach ($forcecols as $key) {
      $keys[] = static::$BDDName.".`$key`";
    }
    return implode(", ",$keys);
  }

  /**
   * Génère la clause JOIN SQL à partir des tables jointes
   * définies dans joinedTables
   * $type : inner | left
   * @return string
   */
  protected static function sqlGetJoin($type)
  {
    // type = inner | left
    if ($type !== "inner" && $type !== "left")
    {
      EC::addError("sqlGetJoin : type de jointure inconnu : $type");
      return "";
    }
    $join = "";
    $joined = static::joinedTables();
    if (!isset($joined[$type])) {
      return "";
    }
    foreach ($joined[$type] as $table => $condition)
    {
      if (strpos($table,":")!==false)
      {
        list($table, $alias) = explode(":",$table);
      }
      else
      {
        $alias = $table;
      }
      $join .= strtoupper($type)." JOIN ".PREFIX_BDD.$table." AS $alias ON $condition ";
    }
    return $join;
  }

  /**
   * Génère la clause WHERE SQL à partir d'un tableau de conditions
   * $wheres : tableau associatif key => value ou key est de la forme table.col ou col
   */
  protected static function sqlGetWhere($wheres)
  {
    $champs = static::champs();
    $whereItems = [];
    foreach ($wheres as $key => $value)
    {
      $operator = is_array($value) ? $value[0] : "=";
      if (strpos($key,".")!==false)
      {
        [$t1, $c1] = explode(".",$key);
        $whereItems[] = "$t1.`$c1` $operator :".str_replace(".","_",$key);
        continue;
      }
      if (isset($champs[$key]) && isset($champs[$key]['foreign']))
      {
        // clé étrangère avec un alias
        EC::addError("Ne pas créer de WHERE sur une clé étrangère avec alias : $key");
        continue;
      }
      $whereItems[] = static::$BDDName.".`$key` $operator :$key";
    }
    if (count($whereItems) > 0)
    {
      return "WHERE ".implode(" AND ",$whereItems);
    }
    else
    {
      return "";
    }
  }

  /**
   * Complète le nom d'un champ avec le nom de la table si nécessaire
   */
  protected static function completeFieldName($col)
  {
    if (strpos($col,".")===false) {
      return static::$BDDName.".`$col`";
    } else {
      return $col;
    }
  }

  protected static function sqlGetSELECT($hideCols, $forcecols)
  {
    $bddName = static::$BDDName;
    $prefixedBddName = PREFIX_BDD.static::$BDDName;
    $fields = static::sqlGetFieldsNames($hideCols, $forcecols);
    $innerJoined = static::sqlGetJoin("inner");
    $leftJoined = static::sqlGetJoin("left");
    return "SELECT $fields FROM ($prefixedBddName AS $bddName $innerJoined $leftJoined)";
  }

  protected static function sqlGetGROUPBY()
  {
    $groupby = static::groupby();
    if (count($groupby) === 0) {
      return "";
    }
    $cols = array_map(function($col){
      return static::completeFieldName($col);
    }, $groupby);
    return " GROUP BY ".implode(", ", $cols);
  }

  public static function getList($filter = [])
  {
    $args = ["wheres", "hideCols", "forcecols", "orderby"];
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
    if (isset($filter['forcecols'])) $forcecols = $filter['forcecols']; else $forcecols = array();
    if (isset($filter['orderby'])) $orderby = "ORDER BY ".$filter['orderby']; else $orderby = "";
    $where = static::sqlGetWhere($wheres);
    $groupby = static::sqlGetGROUPBY();
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $select = static::sqlGetSELECT($hideCols, $forcecols);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("$select $where $groupby $orderby");
      foreach ($wheres as $k => $v) {
        $val = is_array($v) ? $v[1] : $v;
        $stmt->bindValue(
          ":".str_replace(".", "_", $k),
          (string) $val
        );
      }
      $stmt->execute();
      //EC::add($stmt->queryString, static::$BDDName."/getList");
      $bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
      } catch(PDOException $e) {
          EC::addBDDError($e->getMessage(), static::$BDDName."/getList");
          EC::addBDDError($stmt->queryString, static::$BDDName."/getList");
          return array("error"=>true, "message"=>$e->getMessage());
      }
      return $bdd_result;
  }

  public static function getObject($idInput)
  {
    if (!is_numeric($idInput)) {
      return null;
    }
    require_once BDD_CONFIG;
    try {
      $bddName = static::$BDDName;
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $select = static::sqlGetSELECT([], []);
      $stmt = $pdo->prepare("$select WHERE $bddName.id = :id");
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

  protected static function filterInsert($values)
  {
    $champs = static::champs();
    $toInsert = array_intersect_key($values, $champs);
    unset($toInsert['id']);
    foreach ($champs as $key => $value) {
      if ($value['foreign'] ?? false) {
        // champ de jointure, on ne l'insère pas
        unset($toInsert[$key]);
      }
    }
    return $toInsert;
  }
  
  protected static function filterUpdate($params)
  {
    $toUpdate = array_intersect_key($params, static::champs());
    unset($toUpdate['id']);
    $champs = static::champs();
    foreach ($champs as $key => $value) {
      if ($value['foreign'] ?? false) {
        // champ de jointure, on ne l'insère pas
        unset($toUpdate[$key]);
      }
    }
    return $toUpdate;
  }

  protected static function insertValidation($params)
  {
    return true;
  }

  ##################################### METHODES #####################################

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

  protected function onUpdateSuccess() {
    // Méthode appelée après une mise à jour réussie
    return true;
  }

  protected function onInsertSuccess() {
    // Méthode appelée après une insertion réussie
    return true;
  }

  protected function onDeleteSuccess() {
    // Méthode appelée après une suppression réussie
    return true;
  }

  protected function okToDelete()
  {
    // Vérifie si l'objet peut être supprimé (enfants, etc.)
    $children = static::protectedChildren();
    foreach ($children as $table => $strangerId) {
      require_once BDD_CONFIG;
      try {
        $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $stmt = $pdo->prepare("SELECT id FROM ".PREFIX_BDD.$table." WHERE $strangerId = :id");
        $stmt->bindValue(':id', $this->id, PDO::PARAM_INT);
        $stmt->execute();
        if ($stmt->rowCount() > 0) {
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

  public function delete()
  {
    if (!$this->okToDelete()) {
      EC::addError(static::$BDDName."/delete : L'objet a des enfants impossibles à supprimer.");
      return false;
    }

    /*
    if (!$this->deleteChildren()) {
      EC::addError(static::$BDDName."/delete : Impossible de supprimer les enfants.");
      return false;
    }
    */

    require_once BDD_CONFIG;
    /*
    $this->customDelete();
    */
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD.static::$BDDName." WHERE id = :id");
      $stmt->execute(array(':id' => $this->id));
      EC::add("Item supprimé avec succès.");
      $this->onDeleteSuccess();
      return true;
    } catch(PDOException $e) {
      EC::addError($e->getMessage(), static::$BDDName."/delete");
      return false;
    }
  }

  public function insert()
  {
    $values = $this->values;
    $valid = static::insertValidation($values);
    if ($valid !== true) {
      return array("errors" => $valid);
    }
    $toInsert = static::filterInsert($values);

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
        $champs = static::champs();
        if (isset($champs[$k]) && isset($champs[$k]['type']))
        {
          $type = static::$TYPES[$champs[$k]['type']] ?? PDO::PARAM_STR;
        } else {
          $type = PDO::PARAM_STR;
        }
        $stmt->bindValue(":$k", $v, $type);
      }
      $stmt->execute();
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage(), static::$BDDName."/insert");
      return null;
    }
    $this->id=$pdo->lastInsertId();
    $this->values["id"] = $this->id;
    EC::add($this." créé avec succès.");
    $this->onInsertSuccess();
    return $this->id;
  }

  protected function updateValidation($params)
  {
    return true;
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
    $params = static::filterUpdate($params);
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
    $this->onUpdateSuccess();
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

  public function set($key, $value)
  {
    $this->values[$key] = $value;
    return $this;
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

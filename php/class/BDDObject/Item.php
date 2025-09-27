<?php

namespace BDDObject;
use PDO;
use PDOException;
use ErrorController as EC;
use SessionController as SC;

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
    return array();
  }

  public function __construct($options=array())
  {
    $values = $this->parse($options);
    $arr = static::champs();
    $this->values = array_combine($values, array_column($arr,"def"));
    if (isset($options["id"])) {
      $this->id = (integer) $options["id"];
      $this->values["id"] = $this->id;
    }
    if (method_exists($this,"reformat")) $this->reformat();
  }

  public static function getObject($idInput)
  {
    if (is_numeric($idInput)) {
      $id = (integer) $idInput;
    } else return null;

    // Pas trouvé dans la session, il faut chercher en bdd
    require_once BDD_CONFIG;
    try {
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $stmt = $pdo->prepare("SELECT ".join(self::keys(),",")." FROM ".PREFIX_BDD.static::$BDDName." WHERE id = :id");
      $stmt->execute(array(':id' => $id));
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

  public function delete()
  {
    if ((method_exists($this, "okToDelete"))&&(!$this->okToDelete())) {
      return false;
    }

    require_once BDD_CONFIG;
    if (method_exists($this, "customDelete")) {
      $this->customDelete();
    }
    try {
      // Suppression des assoc liées
      $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
      $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      $message = $this." supprimé avec succès.";
      if (method_exists(get_called_class(),"getAssocs")) {
        $arr = static::getAssocs();
        foreach ($arr as $table => $col) {
          $stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD.$table." WHERE ".$col." = :id");
          $stmt->execute(array(':id' => $this->id));
        }
      }
      $stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD.static::$BDDName." WHERE id = :id");
      $stmt->execute(array(':id' => $this->id));
      EC::add($message);
      return true;
    } catch(PDOException $e) {
      EC::addBDDError($e->getMessage(), static::$BDDName."/delete");
    }
    return false;
  }

  public function insert()
  {
    if (method_exists($this, "filterInsert")) {
      $toInsert = $this->filterInsert();
    } else {
      $toInsert = $this->values;
      unset($toInsert['id']);
    }

    if (method_exists($this,"insert_validation")) {
      $valid = $this->insert_validation($toInsert);
      if ($valid !== true) {
        return array("errors" => $valid);
      }
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

  public function update($params=array(),$updateBDD=true)
  {
    if ($this->id===null) {
      EC::addDebugError(static::$BDDName."/update : Id manquant.");
      return false;
    }

    $params = $this->parse($params);

    // vérifie que les valeurs proposées sont valides
    if (method_exists($this,"update_validation")) {
      $valid = $this->update_validation($params);
      if ($valid !== true) {
        return array("errors" => $valid);
      }
    }

    // filtre les modifications
    if (method_exists($this,"filterUpdate")) {
      $params = $this->filterUpdate($params);
    } else {
      $params = array_intersect_key($params, static::champs());
    }
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
      $stmt = $pdo->prepare("UPDATE ".PREFIX_BDD.static::$BDDName." SET ".join("=?,", array_keys($this->toArray()))."=? WHERE id=?");
      $stmt->execute(array_values($this->toArray()));
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

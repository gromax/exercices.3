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
		$arr = static::champs();
		$arr_types = array_combine(array_keys($arr), array_column($arr,"type"));
		$this->values = array_combine(array_keys($arr), array_column($arr,"def"));
		if (isset($options["id"])) {
			$this->id = (integer) $options["id"];
			$this->values["id"] = $this->id;
		}
		foreach ( $arr as $key => $value) {
			if(isset($options[$key])) {
				switch ($value) {
					case "integer":
						$this->values[$key] = (integer) $options[$key];
						break;
					case "string":
						$this->values[$key] = (string) $options[$key];
						break;
					case "boolean":
						$this->values[$key] = (boolean) $options[$key];
						break;
					case "dateHeure":
						$this->values[$key] = $options[$key];
						break;
					case "date":
						$this->values[$key] = $options[$key];
						break;
					default:
						$this->values[$key] = $options[$key];
				}
			}
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

	public function insertion()
	{
		// $force permet de passer les tests
		if (method_exists($this, "parseBeforeInsert")) {
			$toInsert = $this->parseBeforeInsert();
		} else {
			$toInsert = $this->values;
		}

		if ($toInsert === false) {
			return null;
		}

		require_once BDD_CONFIG;
		try {
			$pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("INSERT INTO ".PREFIX_BDD.static::$BDDName." (".join(",", array_keys($toInsert)).") VALUES (".join(",", array_fill(0, count($toInsert), "?")).")");
			$stmt->execute(array_values($toInsert));
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), static::$BDDName."/insertion");
			return null;
		}
		$this->id=$pdo->lastInsertId();
		$this->values["id"] = $this->id;
		EC::add($this." créé avec succès.");
		return $this->id;
	}

	public function update($params=array(),$updateBDD=true)
	{
		if ($this->id===false) {
			EC::addDebugError(static::$BDDName."/update : Id manquant.");
			return false;
		}
		$bddModif=(method_exists($this,"okToUpdate") && ($this->okToUpdate($params)));

		if (!$bddModif) {
			EC::add(static::$BDDName."/update : Aucune modification.");
			return false;
		}
		if (!$updateBDD) {
			EC::add(static::$BDDName."/update : Succès.");
			return true;
		}
		require_once BDD_CONFIG;
		try{
			$pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("UPDATE ".PREFIX_BDD.static::$BDDName." SET ".join("=?,", array_keys($this->toArray()))."=? WHERE id=?");
			$stmt->execute(array_values($this->toArray()));
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), static::$BDDName."/update");
			return false;
		}
		EC::add(static::$BDDName."/update : Succès.");
		return true;
	}

	public function isSameAs($id)
	{
		return ($this->id ===$id);
	}

	public function getId()
	{
		return $this->id;
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

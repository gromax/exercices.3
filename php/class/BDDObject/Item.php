<?php

namespace BDDObject;
use DB;
use ErrorController as EC;
use SessionController as SC;
use MeekroDBException;

abstract class Item
{
	const	SAVE_IN_SESSION = true;
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
		if (self::SAVE_IN_SESSION) {
			$item = SC::get()->getParamInCollection(static::$BDDName, $id, null);
			if ($item !== null){
				return $item;
			}
		}

		// Pas trouvé dans la session, il faut chercher en bdd
		require_once BDD_CONFIG;
		try {
			$bdd_result=DB::queryFirstRow("SELECT ".join(self::keys(),",")." FROM ".PREFIX_BDD.static::$BDDName." WHERE id=%i", $id);
			if ($bdd_result === null) return null;

			$item = new static($bdd_result);
			if (self::SAVE_IN_SESSION) {
				SC::get()->setParamInCollection(static::$BDDName, $item->id, $item);
			}
			return $item;
		} catch(MeekroDBException $e) {
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
			$message = $this." supprimé avec succès.";
			if (method_exists(get_called_class(),"getAssocs")) {
				$arr = static::getAssocs();
				foreach ($arr as $table => $col) {
					DB::delete(PREFIX_BDD.$table, $col.'= %i', $this->id);
					if (static::SAVE_IN_SESSION) $session=SC::get()->unsetParam($table);
				}
			}
			DB::delete(PREFIX_BDD.static::$BDDName, 'id=%i', $this->id);
			EC::add($message);
			if (static::SAVE_IN_SESSION) $session=SC::get()->unsetParamInCollection(static::$BDDName, $this->id);
			return true;
		} catch(MeekroDBException $e) {
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
			DB::insert(PREFIX_BDD.static::$BDDName, $toInsert);
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), static::$BDDName."/insertion");
			return null;
		}
		$this->id=DB::insertId();
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
			DB::update(PREFIX_BDD.static::$BDDName, $this->toArray(),"id=%i",$this->id);
		} catch(MeekroDBException $e) {
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

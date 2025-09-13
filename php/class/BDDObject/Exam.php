<?php

namespace BDDObject;

use DB;
use ErrorController as EC;
use SessionController as SC;
use MeekroDBException;

final class Exam
{
	const SAVE_IN_SESSION = true;

	private $id=null;					// id en BDD
	private $idFiche=null;				// id de la fiche parente
	private $date=null;					// Date de création
	private $data = "";					// Données de la série
	private $nom = "";					// Nom de l'exam
	private $locked = false;			// Exam vérouillé

	##################################### METHODES STATIQUES #####################################

	public function __construct($params=array())
	{
		if(isset($params['id'])) $this->id = (integer)$params['id'];
		if(isset($params['idFiche'])) $this->idFiche = (integer)$params['idFiche'];
		if(isset($params['nom'])) $this->nom = (string)$params['nom'];
		if(isset($params['date'])) $this->date=$params['date'];
		else $this->date=date('Y-m-d');
		if(isset($params['data'])) $this->data = $params['data'];
		if(isset($options['locked'])) $this->locked = (boolean)$options['locked'];
	}

	public static function getList($params= array())
	{
		require_once BDD_CONFIG;
		try {
			if (isset($params["idFiche"])) {
				$bdd_result=DB::query("SELECT id, idFiche, nom, date, data, locked FROM ".PREFIX_BDD."exams WHERE idFiche=%i ORDER BY date",$params["idFiche"]);
			} elseif (isset($params['idOwner'])) {
				$idOwner = (integer) $params['idOwner'];
				$bdd_result=DB::query("SELECT e.id, e.idFiche, e.nom, e.date, e.data, e.locked FROM (".PREFIX_BDD."exams e JOIN ".PREFIX_BDD."fiches f ON e.idFiche = f.id) WHERE f.idOwner = %i ORDER BY date", $idOwner);
			} else {
				$bdd_result=DB::query("SELECT id, idFiche, nom, date, data, locked FROM ".PREFIX_BDD."exams ORDER BY date");
			}
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), "Exam/getList");
			return array();
		}
		return $bdd_result;
	}

	public static function get($id,$returnObject=false)
	{
		if ($id === null) return null;

		if (self::SAVE_IN_SESSION) {
			// On essaie de récupérer la fiche en session
			$exam = SC::get()->getParamInCollection('exams', $id, null);
			if ($exam !== null){
				if ($returnObject) return $exam;
				else return $exam->toArray();
			}
		}

		require_once BDD_CONFIG;
		try {
			$bdd_result=DB::queryFirstRow("SELECT id, idFiche, nom, date, data, locked FROM ".PREFIX_BDD."exams WHERE id=%i", $id);
			if ($bdd_result === null) {
				EC::addError("Exam introuvable.");
				return null;
			}
			if ($returnObject || self::SAVE_IN_SESSION) {
				$examObject = new Exam($bdd_result);
				if (self::SAVE_IN_SESSION) SC::get()->setParamInCollection('exams', $examObject->getId(), $examObject);
				if ($returnObject) return $examObject;
				else return $examObject->toArray();
			}
			return $bdd_result;
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'Exam/get');
			return null;
		}
	}

	public static function getObject($id)
	{
		return self::get($id,true);
	}

	##################################### METHODES #####################################

	public function __toString()
	{
		return 'Exam[#'.$this->id.'] : '.$this->nom;
	}

	public function getFiche()
	{
		return Fiche::getObject($this->idFiche);
	}

	public function insertion()
	{
		require_once BDD_CONFIG;
		try {
			DB::insert(PREFIX_BDD.'exams', $this->toArray());
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'Exam/insertion');
			return null;
		}

		$this->id = DB::insertId();

		EC::add("Exam créé avec succès");
		return $this->id;
	}

	public function delete()
	{
		require_once BDD_CONFIG;
		try {
			// Suppression de la fiche
			DB::delete(PREFIX_BDD.'exams', 'id=%i', $this->id);
			EC::add("L'exam a bien été supprimé.");
			if (self::SAVE_IN_SESSION) $session=SC::get()->unsetParamInCollection('exams', $this->id);
			return true;
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), "Exam/Suppression");
		}
		return false;
	}

	public function update($params=array(),$updateBDD=true)
	{
		$bddModif=false;

		if(isset($params['data'])) { $this->data = $params['data']; $bddModif=true; }
		if(isset($params['locked'])) { $this->locked = (boolean) $params['locked']; $bddModif=true; }
		if(isset($params['nom'])) { $this->nom = (string) $params['nom']; $bddModif=true; }

		if (!$bddModif) {
			EC::add("Aucune modification.");
			return true;
		}

		if (!$updateBDD) return true;

		if ($this->id === null) {
			EC::addError("Le fiche n'existe pas en BDD.");
			return false;
		}

		require_once BDD_CONFIG;
		try{
			DB::update(PREFIX_BDD.'exams', $this->toArray(),"id=%s",$this->id);
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'Exam/update');
			return false;
		}
		EC::add("La modification a bien été effectuée.");
		return true;
	}

	public function toArray()
	{
		$answer=array("data"=>$this->data,"nom"=>$this->nom, "date"=>$this->date, "idFiche"=>$this->idFiche, "locked"=>$this->locked);
		if ($this->id!=null) $answer['id']=$this->id;
		return $answer;
	}

	public function getId()
	{
		return $this->id;
	}

	public function getFicheId()
	{
		return $this->idFiche;
	}
}

?>

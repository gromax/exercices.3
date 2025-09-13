<?php

namespace BDDObject;

use DB;
use SessionController as SC;
use ErrorController as EC;
use MeekroDBException;


final class ExoFiche
{
	const SAVE_IN_SESSION = true;

	private static $_liste = null;

	// Pour un exercice associé à une fiche
	private $id = null;			// id de l'assoc dans la bdd
	private $idE = null;	// id de l'exercice (nom à 4 lettres)
	private $idFiche = null;	// id de la fiche
	private $coeff = null;
	private $num = null;
	private $options = '';			// Choix de l'option de l'exercice s'il y a lieu

	##################################### METHODES STATIQUES #####################################

	public function __construct($params=array())
	{
		if(isset($params['id'])) $this->id = (integer) $params['id'];
		if(isset($params['idFiche'])) $this->idFiche = (integer) $params['idFiche'];
		if(isset($params['idE'])) $this->idE = $params['idE'];
		if(isset($params['coeff'])) $this->coeff = (integer) $params['coeff'];
		if(isset($params['num'])) $this->num = (integer) $params['num'];
		if(isset($params['options'])) $this->options = (string) $params['options'];
	}

	public static function get($id,$returnObject=false)
	{
		if ($id === null) return null;

		if (self::SAVE_IN_SESSION) {
			// On essaie de récupérer l'assoc en session
			$exofiche = SC::get()->getParamInCollection('exosfiche', $id, null);
			if ($exofiche !== null){
				if ($returnObject) return $exofiche;
				else return $exofiche->toArray();
			}
		}

		require_once BDD_CONFIG;
		try {
			$bdd_result=DB::queryFirstRow("SELECT id, idE, idFiche, num, coeff, options FROM ".PREFIX_BDD."assocEF WHERE id=%s", $id);
			if ($bdd_result === null) {
				EC::addError("Association Exercice-Fiche introuvable.");
				return null;
			}
			if ($returnObject || self::SAVE_IN_SESSION) {
				$exoFicheObject = new ExoFiche($bdd_result);
				if (self::SAVE_IN_SESSION) SC::get()->setParamInCollection('exosfiche', $exoFicheObject->getId(), $exoFicheObject);
				if ($returnObject) return $exoFicheObject;
				else return $exoFicheObject->toArray();
			}
			return $bdd_result;
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'ExoFiche/get');
			return null;
		}
	}

	public static function getObject($id)
	{
		return self::get($id,true);
	}

	public static function getList($params = array())
	{
		// Charge en une seule fois l'ensemble des informations sur les fiches
		require_once BDD_CONFIG;
		try{
			if (isset($params['idFiche'])) {
				$idFiche = (integer) $params['idFiche'];
				return DB::query("SELECT id, idE, num, coeff, options FROM ".PREFIX_BDD."assocEF WHERE idFiche=%i",$idFiche);
			} elseif (isset($params['idUser'])) {
				$idUser = (integer) $params['idUser'];
				return DB::query("SELECT DISTINCT f.id, f.idE, f.num, f.coeff, f.options, f.idFiche FROM ".PREFIX_BDD."assocEF f INNER JOIN ".PREFIX_BDD."assocUF u ON f.idFiche = u.idFiche WHERE u.idUser=%i",$idUser);
				// Cherche dans les noeuds liant l'utilisateur à une fiche. En admettant qu'il y ait plusieurs lien d'un même utilisateur à une fiche, on ne doit renvoyer ici qu'une mention (ou pas ?)
			} elseif (isset($params['idOwner'])) {
				$idOwner = (integer) $params['idOwner'];
				return DB::query("SELECT f.id, f.idE, f.num, f.coeff, f.options, f.idFiche FROM ".PREFIX_BDD."assocEF f INNER JOIN ".PREFIX_BDD."fiches u ON f.idFiche = u.id WHERE u.idOwner=%i",$idOwner);
			} elseif (isset($params['idClasse'])) {
				$Classe = (integer) $params['iClasse'];
				return DB::query("SELECT f.id, f.idE, f.num, f.coeff, f.options, f.idFiche, f.idUser FROM ".PREFIX_BDD."assocEF f INNER JOIN ".PREFIX_BDD."users u ON f.idUser = u.id WHERE u.idClasse=%i",$idClasse);
			} else {
				return DB::query("SELECT id, idE, num, coeff, options, idFiche FROM ".PREFIX_BDD."assocEF");
			}
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'ExoFiche/getList');
		}
		return array();
	}

	##################################### METHODES #####################################

	public function getId()
	{
		return $this->id;
	}

	public function getFiche()
	{
		return Fiche::getObject($this->idFiche);
	}

	public function insertion()
	{
		require_once BDD_CONFIG;
		try {
			DB::insert(PREFIX_BDD.'assocEF', $this->toArray());
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'ExoFiche/insertion');
			return null;
		}

		$this->id = DB::insertId();

		EC::add("Association Exercice-Fiche créée avec succès");

		return $this->id;
	}

	public function delete()
	{
		require_once BDD_CONFIG;
		try {
			// Suppression des notes liées à l'exercice
			DB::delete(PREFIX_BDD.'assocUE', 'aEF=%i', $this->id);
			// Suppression de l'exercice
			DB::delete(PREFIX_BDD.'assocEF', 'id=%i', $this->id);
			EC::add("L'exercice a bien été supprimé.");
			if (self::SAVE_IN_SESSION) $session=SC::get()->unsetParamInCollection('exosfiche', $this->id);
			return true;
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), "ExoFiche/Suppression");
		}
		return false;
	}

	public function update($params=array(),$updateBDD=true)
	{
		$bddModif=false;

		if(isset($params['num'])) { $this->num = (integer) $params['num']; $bddModif=true; }
		if(isset($params['coeff'])) { $this->coeff = (integer) $params['coeff']; $bddModif=true; }
		if(isset($params['options'])) { $this->options = $params['options']; $bddModif=true; }

		if (!$bddModif) {
			EC::add("Aucune modification.");
			return true;
		}

		if (!$updateBDD) return true;

		if ($this->id === null) {
			EC::addError("L'association Exercice-Fiche n'existe pas en BDD.");
			return false;
		}

		require_once BDD_CONFIG;
		try{
			DB::update(PREFIX_BDD.'assocEF', $this->toArray(),"id=%i",$this->id);
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'ExoFiche/update');
			return false;
		}
		EC::add("La modification a bien été effectuée.");
		return true;
	}

	public function toArray()
	{
		return array(
			'id'=>$this->id,
			'idE'=>$this->idE,
			'idFiche'=>$this->idFiche,
			'num'=>$this->num,
			'coeff'=>$this->coeff,
			'options'=>$this->options
			);
	}

}

?>

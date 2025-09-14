<?php

namespace BDDObject;

use PDO;
use ErrorController as EC;
use SessionController as SC;
use PDOException;

final class Exam
{
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
			// Filtrage des paramètres
			$pdo = new PDO(BDD_DSN, BDD_USER, BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			if (isset($params["idFiche"])) {
				$stmt = $pdo->prepare("SELECT id, idFiche, nom, date, data, locked FROM ".PREFIX_BDD."exams WHERE idFiche = :idFiche ORDER BY date");
				$stmt->execute(array(':idFiche' => $params["idFiche"]));
				$bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
			} elseif (isset($params['idOwner'])) {
				$idOwner = (integer) $params['idOwner'];
				$stmt = $pdo->prepare("SELECT e.id, e.idFiche, e.nom, e.date, e.data, e.locked FROM (".PREFIX_BDD."exams e JOIN ".PREFIX_BDD."fiches f ON e.idFiche = f.id) WHERE f.idOwner = :idOwner ORDER BY date");
				$stmt->execute(array(':idOwner' => $idOwner));
				$bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
			} else {
				$stmt = $pdo->prepare("SELECT id, idFiche, nom, date, data, locked FROM ".PREFIX_BDD."exams ORDER BY date");
				$stmt->execute();
				$bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
			}
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), "Exam/getList");
			return array();
		}
		return $bdd_result;
	}

	public static function get($id,$returnObject=false)
	{
		if ($id === null) return null;
		require_once BDD_CONFIG;
		try {
			$pdo = new PDO(BDD_DSN, BDD_USER, BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("SELECT id, idFiche, nom, date, data, locked FROM ".PREFIX_BDD."exams WHERE id = :id");
			$stmt->execute(array(':id' => $id));
			$bdd_result = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($bdd_result === null) {
				EC::addError("Exam introuvable.");
				return null;
			}
			if ($returnObject) {
				return new Exam($bdd_result);
			}
			return $bdd_result;
		} catch(PDOException $e) {
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
			$pdo = new PDO(BDD_DSN, BDD_USER, BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("INSERT INTO ".PREFIX_BDD."exams (".join(",", array_keys($this->toArray())).") VALUES (".join(",", array_fill(0, count($this->toArray()), "?")).")");
			$stmt->execute(array_values($this->toArray()));
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), 'Exam/insertion');
			return null;
		}

		$this->id = $pdo->lastInsertId();

		EC::add("Exam créé avec succès");
		return $this->id;
	}

	public function delete()
	{
		require_once BDD_CONFIG;
		try {
			// Suppression de la fiche
			$pdo = new PDO(BDD_DSN, BDD_USER, BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD."exams WHERE id = :id");
			$stmt->execute(array(':id' => $this->id));
			EC::add("L'exam a bien été supprimé.");
			return true;
		} catch(PDOException $e) {
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
			$pdo = new PDO(BDD_DSN, BDD_USER, BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("UPDATE ".PREFIX_BDD."exams SET ".join(",", array_map(function($key){ return "$key = ?"; }, array_keys($this->toArray()))) ." WHERE id = ?");
			$stmt->execute(array_merge(array_values($this->toArray()), array($this->id)));
		} catch(PDOException $e) {
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

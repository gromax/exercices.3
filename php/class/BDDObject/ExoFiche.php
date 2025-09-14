<?php

namespace BDDObject;

use PDO;
use SessionController as SC;
use ErrorController as EC;
use PDOException;


final class ExoFiche
{

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
		require_once BDD_CONFIG;
		try {
			$pdo = new PDO(BDD_DSN, BDD_USER, BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("SELECT id, idE, idFiche, num, coeff, options FROM ".PREFIX_BDD."assocEF WHERE id = :id");
			$stmt->execute(array(':id' => $id));
			$bdd_result = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($bdd_result === null) {
				EC::addError("Association Exercice-Fiche introuvable.");
				return null;
			}
			if ($returnObject) {
				return new ExoFiche($bdd_result);
			}
				else return $exoFicheObject->toArray();
			}
			return $bdd_result;
		} catch(PDOException $e) {
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
			// Filtrage des paramètres
			$pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			if (isset($params['idFiche'])) {
				$idFiche = (integer) $params['idFiche'];
				$stmt = $pdo->prepare("SELECT id, idE, num, coeff, options FROM ".PREFIX_BDD."assocEF WHERE idFiche = :idFiche");
				$stmt->execute(array(':idFiche' => $idFiche));
				return $stmt->fetchAll(PDO::FETCH_ASSOC);
			} elseif (isset($params['idUser'])) {
				$idUser = (integer) $params['idUser'];
				$stmt = $pdo->prepare("SELECT DISTINCT f.id, f.idE, f.num, f.coeff, f.options, f.idFiche FROM ".PREFIX_BDD."assocEF f INNER JOIN ".PREFIX_BDD."assocUF u ON f.idFiche = u.idFiche WHERE u.idUser = :idUser");
				$stmt->execute(array(':idUser' => $idUser));
				return $stmt->fetchAll(PDO::FETCH_ASSOC);
				// Cherche dans les noeuds liant l'utilisateur à une fiche. En admettant qu'il y ait plusieurs lien d'un même utilisateur à une fiche, on ne doit renvoyer ici qu'une mention (ou pas ?)
			} elseif (isset($params['idOwner'])) {
				$idOwner = (integer) $params['idOwner'];
				$stmt = $pdo->prepare("SELECT f.id, f.idE, f.num, f.coeff, f.options, f.idFiche FROM ".PREFIX_BDD."assocEF f INNER JOIN ".PREFIX_BDD."fiches u ON f.idFiche = u.id WHERE u.idOwner = :idOwner");
				$stmt->execute(array(':idOwner' => $idOwner));
				return $stmt->fetchAll(PDO::FETCH_ASSOC);
			} elseif (isset($params['idClasse'])) {
				$idClasse = (integer) $params['idClasse'];
				$stmt = $pdo->prepare("SELECT f.id, f.idE, f.num, f.coeff, f.options, f.idFiche, f.idUser FROM ".PREFIX_BDD."assocEF f INNER JOIN ".PREFIX_BDD."users u ON f.idUser = u.id WHERE u.idClasse = :idClasse");
				$stmt->execute(array(':idClasse' => $idClasse));
				return $stmt->fetchAll(PDO::FETCH_ASSOC);
			} else {
				$stmt = $pdo->prepare("SELECT id, idE, num, coeff, options, idFiche FROM ".PREFIX_BDD."assocEF");
				$stmt->execute();
				return $stmt->fetchAll(PDO::FETCH_ASSOC);
			}
		} catch(PDOException $e) {
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
			$pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("INSERT INTO ".PREFIX_BDD."assocEF (".join(",", array_keys($this->toArray())).") VALUES (".join(",", array_fill(0, count($this->toArray()), "?")).")");
			$stmt->execute(array_values($this->toArray()));
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), 'ExoFiche/insertion');
			return null;
		}

		$this->id = $pdo->lastInsertId();

		EC::add("Association Exercice-Fiche créée avec succès");

		return $this->id;
	}

	public function delete()
	{
		require_once BDD_CONFIG;
		try {
			// Suppression des notes liées à l'exercice
			$pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD."assocUE WHERE aEF = :id");
			$stmt->execute(array(':id' => $this->id));
			// Suppression de l'exercice
			$stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD."assocEF WHERE id = :id");
			$stmt->execute(array(':id' => $this->id));
			EC::add("L'exercice a bien été supprimé.");
			return true;
		} catch(PDOException $e) {
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
			$pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("UPDATE ".PREFIX_BDD."assocEF SET ".join("=?,", array_keys($this->toArray()))."=? WHERE id=?");
			$stmt->execute(array_merge(array_values($this->toArray()), array($this->id)));
		} catch(PDOException $e) {
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

<?php

namespace BDDObject;

use PDO;
use PDOException;
use SessionController as SC;
use ErrorController as EC;

final class AssoUF
{
	private static $_liste = null;

	// Pour un exercice associé à une fiche
	private $id = null;			// id de l'assoc dans la bdd
	private $idFiche = null;	// id de la fiche
	private $idUser = null;		// id de l'utilisateur
	private $actif = true;		// actif par défaut
	private $date = null;		// date de création

	##################################### METHODES STATIQUES #####################################

	public function __construct($params=array())
	{
		if(isset($params['id'])) $this->id = (integer) $params['id'];
		if(isset($params['idFiche'])) $this->idFiche = (integer) $params['idFiche'];
		if(isset($params['idUser'])) $this->idUser = (integer) $params['idUser'];
		if(isset($params['actif'])) $this->actif = (boolean) $params['actif'];
		if(isset($params['date'])) $this->date=$params['date'];
		else $this->date=date('Y-m-d');	}

	public static function get($id,$returnObject=false)
	{
		if ($id === null) return null;
		require_once BDD_CONFIG;
		try {
			$pdo = new PDO(BDD_DSN, BDD_USER, BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("SELECT id, idUser, idFiche, actif, date FROM ".PREFIX_BDD."assocUF WHERE id = :id");
			$stmt->execute(array(':id' => $id));
			$bdd_result = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($bdd_result === null) {
				EC::addError("Association Utilisateur-Fiche introuvable.");
				return null;
			}
			if ($returnObject) {
				return new AssoUF($bdd_result);
			}
			return $bdd_result;
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), 'assoUF/get');
			return null;
		}
	}

	public static function getList($params = array())
	{
		if (isset($params["idUser"])) $idUser = (integer) $params["idUser"]; # Sert à récupérer les associations visibles d'un élèves
		else $idUser = null;
		if (isset($params["idFiche"])) $idFiche = (integer) $params["idFiche"];
		else $idFiche = null;
		if (isset($params["idOwner"])) $idOwner = (integer) $params["idOwner"];
		else $idOwner = null;
		require_once BDD_CONFIG;
		try {
			// Filtrage des paramètres
			$pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			// pour un élève qui ne charge pas la fiche parente, je joint au chargement la valeur de notation permettant de calculer la note
			if ($idUser!==null) {
				$stmt = $pdo->prepare("SELECT a.id, a,User, a.idFiche, a.actif, f.actif as ficheActive, f.nom as nomFiche, f.description, f.notation, a.date FROM (".PREFIX_BDD."assocUF a JOIN ".PREFIX_BDD."fiches f ON f.id = a.idFiche ) WHERE a.idUser=:idUser AND f.visible=1 ORDER BY date");
				$stmt->bindParam(':idUser', $idUser);
				$stmt->execute();
				$bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
			} elseif ($idOwner!==null){
				$stmt = $pdo->prepare("SELECT a.id, a.idUser, u.nom as nomUser, u.prenom as prenomUser,  a.idFiche, a.actif, a.date FROM ((".PREFIX_BDD."assocUF a JOIN ".PREFIX_BDD."users u ON u.id = a.idUser) JOIN ".PREFIX_BDD."fiches f ON f.id = a.idFiche) WHERE f.idOwner=:idOwner ORDER BY date");
				$stmt->bindParam(':idOwner', $idOwner);
				$stmt->execute();
				$bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
			} elseif ($idFiche!==null) {
				$stmt = $pdo->prepare("SELECT a.id, a.idUser, u.nom as nomUser, u.prenom as prenomUser,  a.idFiche, a.actif, a.date FROM (".PREFIX_BDD."assocUF a JOIN ".PREFIX_BDD."users u ON u.id = a.idUser) WHERE idFiche=:idFiche ORDER BY date");
				$stmt->bindParam(':idFiche', $idFiche);
				$stmt->execute();
				$bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
			} else {
				$stmt = $pdo->prepare("SELECT a.id, a.idUser, u.nom as nomUser, u.prenom as prenomUser, a.idFiche, a.actif, a.date FROM (".PREFIX_BDD."assocUF a JOIN ".PREFIX_BDD."users u ON u.id = a.idUser) ORDER BY date");
				$stmt->execute();
				$bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
			}
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), "AssoUF/getList");
			return array();
		}
		return $bdd_result;
	}

	public static function getObject($id)
	{
		return self::get($id,true);
	}

	##################################### METHODES #####################################

	public function getId()
	{
		return $this->id;
	}

	public function getIdFiche()
	{
		return $this->idFiche;
	}

	public function getIdUser()
	{
		return $this->idUser;
	}

	public function getUser()
	{
		return User::getObject($this->idUser);
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
			$stmt = $pdo->prepare("INSERT INTO ".PREFIX_BDD."assocUF (idUser, idFiche, actif, date) VALUES (:idUser, :idFiche, :actif, :date)");
			$stmt->bindParam(':idUser', $this->idUser);
			$stmt->bindParam(':idFiche', $this->idFiche);
			$stmt->bindParam(':actif', $this->actif);
			$stmt->bindParam(':date', $this->date);
			$stmt->execute();
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), 'AssoUF/insertion');
			return null;
		}

		$this->id = $pdo->lastInsertId();

		EC::add("Association Utilisateur-Fiche créée avec succès");

		return $this->id;
	}

	public function delete()
	{
		require_once BDD_CONFIG;
		try {
			$pdo = new PDO(BDD_DSN, BDD_USER, BDD_PASSWORD);
			// Suppression des notes liées à l'association
			$stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD."assocUE WHERE aUF=:id");
			$stmt->bindParam(':id', $this->id);
			$stmt->execute();
			// Suppression de l'association
			$stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD."assocUF WHERE id=:id");
			$stmt->bindParam(':id', $this->id);
			$stmt->execute();
			EC::add("L'exercice a bien été supprimé.");
			return true;
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), "AssoUF/Suppression");
		}
		return false;
	}

	public function update($params=array(),$updateBDD=true)
	{
		$modifs = array();

		if(isset($params['actif'])) {
			$this->actif = (boolean) $params['actif'];
			$modifs['actif']=$this->actif;
		}

		if (count($modifs)===0) {
			EC::add("Aucune modification.");
			return true;
		}

		if (!$updateBDD) return true;

		if ($this->id === null) {
			EC::addError("L'association Utilisateur-Fiche n'existe pas en BDD.");
			return false;
		}

		require_once BDD_CONFIG;
		try{
			$pdo = new PDO(BDD_DSN, BDD_USER, BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("UPDATE ".PREFIX_BDD."assocUF SET ".implode(", ", array_map(function($k){ return "$k=:$k"; }, array_keys($modifs)))." WHERE id=:id");
			foreach ($modifs as $k => $v) {
				$stmt->bindValue(":$k", $v);
			}
			$stmt->bindValue(":id", $this->id);
			$stmt->execute();
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), 'AssoUF/update');
			return false;
		}
		EC::add("La modification a bien été effectuée.");
		return true;
	}

	public function toArray()
	{
		return array(
			'id'=>$this->id,
			'idUser'=>$this->idUser,
			'idFiche'=>$this->idFiche,
			'actif'=>$this->actif,
			'date'=>$this->date
			);
	}

	public function isOwnedBy($user)
	{
		$fiche = Fiche::getObject($this->idFiche);
		if ($fiche===null) return false;
		return $fiche->isOwnedBy($user);
	}

	public function isMyTeacher($user)
	{
		$assoUser = User::getObject($this->idUser);
		if ($assoUser===null) return false;
		return $assoUser->isMyTeacher($user);
	}

}

?>

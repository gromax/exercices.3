<?php

namespace BDDObject;

use PDO;
use PDOException;
use ErrorController as EC;
use SessionController as SC;

final class Fiche
{
	private $id=null;					// id en BDD
	private $idOwner=null;				// id du créateur de la fiche
	private $nom = 'Nouvelle série';	// nom de la série d'exercices
	private $date=null;					// Date de création
	private $description = "";			// Description
	private $visible = false;			// visible
	private $actif = false;				// actif
	private $notation = 0;				// type de notation


	##################################### METHODES STATIQUES #####################################

	public function __construct($params=array())
	{
		if(isset($params['id'])) $this->id = (integer)$params['id'];
		if(isset($params['idOwner'])) $this->idOwner = (integer)$params['idOwner'];
		else $this->idOwner = Logged::getConnectedUser().getId();
		if(isset($params['nom'])) $this->nom = $params['nom'];
		if(isset($params['date'])) $this->date=$params['date'];
		else $this->date=date('Y-m-d');
		if(isset($params['description'])) $this->description = $params['description'];
		if(isset($params['visible'])) $this->visible = (boolean) $params['visible'];
		if(isset($params['actif'])) $this->actif = (boolean) $params['actif'];
		if(isset($params['notation'])) $this->notation = (integer) $params['notation'];
	}

	public static function getList($params= array())
	{
		require_once BDD_CONFIG;
		try {
			if (isset($params["owner"])) {
				$bdd_result=DB::query("SELECT id, idOwner, nom, date, description, visible, actif, notation FROM ".PREFIX_BDD."fiches WHERE idOwner=%s ORDER BY date",$params["owner"]);
			} elseif (isset($params["eleve"])) {
				$bdd_result=DB::query("SELECT DISTINCT f.id, f.idOwner, f.nom, f.date, f.description, f.visible, f.actif, f.notation FROM ".PREFIX_BDD."fiches f JOIN ".PREFIX_BDD."assocUF a ON f.id = a.idFiche WHERE a.idUser=%i AND f.visible=1 ORDER BY date",$params["eleve"]);
				// Un même élève pourrait être attaché plusieurs fois à une même fiche
			} else {
				$bdd_result=DB::query("SELECT f.id, f.idOwner, u.nom nomOwner, f.nom, f.date, f.description, f.visible, f.actif, f.notation FROM (".PREFIX_BDD."fiches f JOIN ".PREFIX_BDD."users u ON f.idOwner = u.id) ORDER BY f.date");
			}
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), "Fiche/getList");
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
			$stmt = $pdo->prepare("SELECT id, idOwner, nom, date, description, visible, actif FROM ".PREFIX_BDD."fiches WHERE id = :id");
			$stmt->execute(array(':id' => $id));
			$bdd_result = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($bdd_result === null) {
				EC::addError("Fiche introuvable.");
				return null;
			}
			if ($returnObject) {
				return new Fiche($bdd_result);
			}
			return $bdd_result;
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), 'Fiche/get');
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
		return '[#'.$this->id.'] '.$this->nom;
	}

	public function insertion()
	{
		require_once BDD_CONFIG;
		try {
			$pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("INSERT INTO ".PREFIX_BDD."fiches (".join(",", array_keys($this->toArray())).") VALUES (".join(",", array_fill(0, count($this->toArray()), "?")).")");
			$stmt->execute(array_values($this->toArray()));
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), 'Fiche/insertion');
			return null;
		}

		$this->id = $pdo->lastInsertId();

		EC::add("Fiche créée avec succès");
		return $this->id;
	}

	public function delete()
	{
		require_once BDD_CONFIG;
		try {
			$pdo = new PDO(BDD_DSN, BDD_USER, BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

			// Suppression des exams liés à la fiche
			$stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD."exams WHERE idFiche = :idFiche");
			$stmt->execute(array(':idFiche' => $this->id));
			// Suppression des messages liés à des exercices de la fiche
			$stmt = $pdo->prepare("DELETE ".PREFIX_BDD."messages FROM ((".PREFIX_BDD."messages JOIN ".PREFIX_BDD."assocUE ON ".PREFIX_BDD."assocUE.id = ".PREFIX_BDD."messages.aUE) JOIN ".PREFIX_BDD."assocEF ON ".PREFIX_BDD."assocEF.id=".PREFIX_BDD."assocUE.aEF) WHERE ".PREFIX_BDD."assocEF.idFiche = :idFiche");
			$stmt->execute(array(':idFiche' => $this->id));
			// Suppression des notes liées aux exercices contenues dans la fiche
			$stmt = $pdo->prepare("DELETE ".PREFIX_BDD."assocUE FROM ".PREFIX_BDD."assocUE INNER JOIN ".PREFIX_BDD."assocEF ON (".PREFIX_BDD."assocUE.aEF = ".PREFIX_BDD."assocEF.id) WHERE ".PREFIX_BDD."assocEF.idFiche = :idFiche");
			$stmt->execute(array(':idFiche' => $this->id));
			// Suppression des exercices de la fiche
			$stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD."assocEF WHERE idFiche = :idFiche");
			$stmt->execute(array(':idFiche' => $this->id));
			// Suppression de la fiche
			$stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD."fiches WHERE id = :id");
			$stmt->execute(array(':id' => $this->id));
			EC::add("La fiche a bien été supprimée.");
			return true;
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), "Fiche/Suppression");
		}
		return false;
	}

	public function update($params=array(),$updateBDD=true)
	{
		$bddModif=false;

		if(isset($params['nom'])) { $this->nom = $params['nom']; $bddModif=true; }
		if(isset($params['description'])) { $this->description = $params['description']; $bddModif=true; }
		if(isset($params['visible'])) { $this->visible = (boolean) $params['visible']; $bddModif=true; }
		if(isset($params['actif'])) { $this->actif = (boolean) $params['actif']; $bddModif=true; }
		if(isset($params['notation'])) { $this->notation = (integer) $params['notation']; $bddModif=true; }

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
			DB::update(PREFIX_BDD.'fiches', $this->toArray(),"id=%s",$this->id);
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'Fiche/update');
			return false;
		}
		EC::add("La modification a bien été effectuée.");
		return true;
	}

	public function toArray()
	{
		$answer=array("nom"=>$this->nom, "description"=>$this->description, "date"=>$this->date, "visible"=>$this->visible, "actif"=>$this->actif, "notation"=>$this->notation);
		if ($this->id!=null) $answer['id']=$this->id;
		if ($this->idOwner!=null) $answer['idOwner']=$this->idOwner;
		return $answer;
	}

	public function getId()
	{
		return $this->id;
	}

	public function getOwnerId()
	{
		return $this->idOwner;
	}

	public function getOwner()
	{
		return User::getObject($this->idOwner);
	}

	public function isOwnedBy($user)
	{
		if ( is_integer($user) ) return ($user === $this->idOwner);
		if ( $user instanceof User ) return ($user->getId() === $this->idOwner);
		return false;
	}
}

?>

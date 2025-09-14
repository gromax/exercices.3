<?php
namespace BDDObject;

use ErrorController as EC;
use SessionController as SC;
use PDO;
use PDOException;

final class Note
{
	private static $_liste = null;

	private $idUser = null;
	private $aEF = null;
	private $aUF = null;
	private $note = null;
	private $inputs = "";
	private $answers = "";

	##################################### METHODES STATIQUES #####################################

	public function __construct($params=array())
	{
		if(isset($params['id'])) $this->id = (integer) $params['id'];
		if(isset($params['idUser'])) $this->idUser = (integer) $params['idUser'];
		if(isset($params['aEF'])) $this->aEF = $params['aEF'];
		if(isset($params['aUF'])) $this->aUF = $params['aUF'];
		if(isset($params['finished'])) $this->finished = (integer) $params['finished'];
		if(isset($params['note'])) {
			$this->note = (integer) $params['note'];
			if ($this->note>100) {
				$this->note = 100;
			}
		}
		if(isset($params['inputs'])) $this->inputs = (string) $params['inputs'];
		if(isset($params['answers'])) $this->answers = (string) $params['answers'];
		if(isset($params['date'])) $this->date=$params['date'];
		else $this->date=date('Y-m-d H:i:s');
	}

	public static function getList($params=array())
	{
		//renvoie les assoc entre un user et un exercice dans une fiche
		require_once BDD_CONFIG;
		try {
			$pdo = new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			if (isset($params['idFiche'])) {
				// Toutes les assocs dans une fiche
				$idFiche = (integer) $params['idFiche'];
				if (isset($params['idUser'])) {
					$idUser = (integer) $params['idUser'];
					$stmt = $pdo->prepare("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id WHERE uf.idFiche=:idFiche AND uf.idUser=:idUser ORDER BY ue.date");
					$stmt->execute(array(':idFiche' => $idFiche, ':idUser' => $idUser));
					return $stmt->fetchAll(PDO::FETCH_ASSOC);
				} else {
					$stmt = $pdo->prepare("SELECT ue.aUF, ue.aEF, ue.note FROM ".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id WHERE uf.idFiche=:idFiche ORDER BY ue.aUF, ue.aEF, ue.date");
					$stmt->execute(array(':idFiche' => $idFiche));
					return $stmt->fetchAll(PDO::FETCH_ASSOC);
				}
			} elseif (isset($params['idUser'])) {
				$idUser = (integer) $params['idUser'];
				$stmt = $pdo->prepare("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id WHERE uf.idUser=:idUser ORDER BY ue.date");
				$stmt->execute(array(':idUser' => $idUser));
				return $stmt->fetchAll(PDO::FETCH_ASSOC);
			} elseif (isset($params['usersList'])) {
				$stmt = $pdo->prepare("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id WHERE uf.idUser IN (:usersList) ORDER BY ue.date");
				$stmt->execute(array(':usersList' => $params['usersList']));
				return $stmt->fetchAll(PDO::FETCH_ASSOC);
			} elseif (isset($params['idOwner'])) {
				$idOwner = (integer) $params['idOwner'];
				$stmt = $pdo->prepare("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ((".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id) INNER JOIN ".PREFIX_BDD."fiches f ON f.id = uf.idFiche) WHERE f.idOwner=:idOwner ORDER BY ue.date");
				$stmt->execute(array(':idOwner' => $idOwner));
				return $stmt->fetchAll(PDO::FETCH_ASSOC);
			} elseif (isset($params['idClasse'])) {
				$idClasse = (integer) $params['idClasse'];
				$stmt = $pdo->prepare("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ((".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id) INNER JOIN ".PREFIX_BDD."users u ON u.id = uf.idUser) WHERE u.idClasse=:idClasse ORDER BY ue.date");
				$stmt->execute(array(':idClasse' => $idClasse));
				return $stmt->fetchAll(PDO::FETCH_ASSOC);
			} else {
				$stmt = $pdo->prepare("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ".PREFIX_BDD."assocUE ue ORDER BY ue.date");
				$stmt->execute();
				return $stmt->fetchAll(PDO::FETCH_ASSOC);
			}
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'Note/getList');
		}
		return array();
	}

	public static function get($id,$returnObject=false)
	{
		if ($id === null) return null;

		require_once BDD_CONFIG;
		try {
			$pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("SELECT ue.id, uf.idUser, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id WHERE ue.id=:id");
			$stmt->execute(array(':id' => $id));
			$bdd_result = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($bdd_result === null) {
				EC::addError("Note introuvable.");
				return null;
			}
			if ($returnObject) {
				return new Note($bdd_result);
			}
			return $bdd_result;
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), 'Note/get');
			return null;
		}
	}

	public static function getObject($id)
	{
		return self::get($id,true);
	}

	##################################### METHODES PROTÉGÉES ###############################


	##################################### METHODES PUBLIQUES ###############################

	public function getId()
	{
		return $this->id;
	}

	public function idOwner()
	{
		return $this->idUser;
	}

	public function getExoFiche()
	{
		return ExoFiche::getObject($this->aEF);
	}

	public function getFiche()
	{
		$exoFiche = $this->getExoFiche();
		if ($exoFiche!==null) return $exoFiche->getFiche();
		else return null;
	}

	public function writeAllowed($user)
	{
		if ($user->isAdmin()) return true;
		if ($user->isEleve()) return ($user->getId() === $this->idUser);
		if ($user->isProf()) {
			$fiche = $this->getFiche();
			return (($fiche!==null) && $fiche->isOwnedBy($user));
		}
		return false;
	}

	public function insertion()
	{
		require_once BDD_CONFIG;
		try {
			// Ajout de la note
			$pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("INSERT INTO ".PREFIX_BDD."assocUE (note, inputs, answers, finished, aEF, aUF, date) VALUES (:note, :inputs, :answers, :finished, :aEF, :aUF, :date)");
			$stmt->execute(array(
				':note' => $this->note,
				':inputs' => $this->inputs,
				':answers' => $this->answers,
				':finished' => $this->finished,
				':aEF' => $this->aEF,
				':aUF' => $this->aUF,
				':date' => $this->date
				));
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(),'Note/insertion');
			return null;
		}
		$this->id=$pdo->lastInsertId();
		EC::add("La note a bien été ajoutée.");
		return $this->id;
	}

	public function update($params=array(), $updateBDD=true)
	{
		$bddModif=false;
		if(isset($params['finished'])) { $this->finished = (boolean) $params['finished']; $bddModif=true; }
		if(isset($params['inputs'])) { $this->inputs = $params['inputs']; $bddModif=true; }
		if(isset($params['answers'])) { $this->answers = $params['answers']; $bddModif=true; }
		if(isset($params['note'])) {
			$this->note = (integer)$params['note'];
			if ($this->note>100) {
				$this->note = 100;
			}
			$bddModif=true;
		}

		if (!$bddModif) {
			EC::add("Aucune modification.");
			return true;
		}

		$this->date=date('Y-m-d H:i:s');

		if (!$updateBDD) {
			EC::add("La note a bien été modifiée.");
			return true;
		}

		require_once BDD_CONFIG;
		try{
			$pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("UPDATE ".PREFIX_BDD."assocUE SET note = :note, finished = :finished, answers = :answers, inputs = :inputs, date = :date WHERE id = :id");
			$stmt->execute(array(
				':note' => $this->note,
				':finished' => $this->finished,
				':answers' => $this->answers,
				':inputs' => $this->inputs,
				':date' => $this->date,
				':id' => $this->id
			));
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), 'Note/update');
			return false;
		}

		EC::add("La note a bien été modifiée.");
		return true;
	}

	public function delete()
	{
		require_once BDD_CONFIG;
		try {
			$pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			$stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD."assocUE WHERE id = :id");
			$stmt->execute(array(':id' => $this->id));
			EC::add("La note a bien été supprimée.");
			// Il faut supprimer tous les commentaires liés
			$stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD."messages WHERE aUE = :aUE");
			$stmt->execute(array(':aUE' => $this->id));
			return true;
		} catch(PDOException $e) {
			EC::addBDDError($e->getMessage(), "Note/Suppression");
		}
		return false;
	}

	public function toArray()
	{
		return array(
			'id'=>$this->id,
			'aEF'=>$this->aEF,
			'aUF'=>$this->aUF,
			'note'=>$this->note,
			'inputs'=>$this->inputs,
			'answers'=>$this->answers,
			'date'=>$this->date,
			'finished'=>$this->finished
			);
	}

}

?>

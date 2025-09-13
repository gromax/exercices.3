<?php
namespace BDDObject;

use ErrorController as EC;
use SessionController as SC;
use DB;
use MeekroDBException;

final class Note
{
	const SAVE_IN_SESSION = true;
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
			if (isset($params['idFiche'])) {
				// Toutes les assocs dans une fiche
				$idFiche = (integer) $params['idFiche'];
				if (isset($params['idUser'])) {
					$idUser = (integer) $params['idUser'];
					return DB::query("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id WHERE uf.idFiche=%i AND uf.idUser=%i ORDER BY ue.date",$idFiche,$idUser);
				} else return DB::query("SELECT ue.aUF, ue.aEF, ue.note FROM ".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id WHERE uf.idFiche=%i ORDER BY ue.aUF, ue.aEF, ue.date",$idFiche);
				//return DB::query("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id WHERE uf.idFiche=%i ORDER BY uf.idUser, ue.date",$idFiche);
			} elseif (isset($params['idUser'])) {
				$idUser = (integer) $params['idUser'];
				return DB::query("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id WHERE uf.idUser=%i ORDER BY ue.date",$idUser);
			} elseif (isset($params['usersList'])) {
				return DB::query("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id WHERE uf.idUser IN %li ORDER BY ue.date",$params['usersList']);
			} elseif (isset($params['idOwner'])) {
				$idOwner = (integer) $params['idOwner'];
				return DB::query("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ((".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id) INNER JOIN ".PREFIX_BDD."fiches f ON f.id = uf.idFiche) WHERE f.idOwner=%i ORDER BY ue.date",$idOwner);
			} elseif (isset($params['idClasse'])) {
				$idClasse = (integer) $params['idClasse'];
				return DB::query("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ((".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id) INNER JOIN ".PREFIX_BDD."users u ON u.id = uf.idUser) WHERE u.idClasse=%i ORDER BY ue.date",$idClasse);
			} else {
				return DB::query("SELECT ue.id, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ".PREFIX_BDD."assocUE ue ORDER BY ue.date");
			}
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'Note/getList');
		}
		return array();
	}

	public static function get($id,$returnObject=false)
	{
		if ($id === null) return null;

		if (self::SAVE_IN_SESSION) {
			// On essaie de récupérer l'assoc en session
			$note = SC::get()->getParamInCollection('notes', $id, null);
			if ($note !== null){
				if ($returnObject) return $note;
				else return $note->toArray();
			}
		}

		require_once BDD_CONFIG;
		try {
			$bdd_result=DB::queryFirstRow("SELECT ue.id, uf.idUser, ue.aUF, ue.date, ue.note, ue.inputs, ue.answers, ue.finished, ue.aEF FROM ".PREFIX_BDD."assocUE ue INNER JOIN ".PREFIX_BDD."assocUF uf ON ue.aUF = uf.id WHERE ue.id=%i",$id);
			if ($bdd_result === null) {
				EC::addError("Note introuvable.");
				return null;
			}
			if ($returnObject || self::SAVE_IN_SESSION) {
				$note = new Note($bdd_result);
				if (self::SAVE_IN_SESSION) SC::get()->setParamInCollection('notes', $note->getId(), $note);
				if ($returnObject) return $note;
				else return $note->toArray();
			}
			return $bdd_result;
		} catch(MeekroDBException $e) {
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
			DB::insert(PREFIX_BDD.'assocUE', array(
				'note' => $this->note,
				'inputs' => $this->inputs,
				'answers'=>$this->answers,
				'finished' => $this->finished,
				'aEF' => $this->aEF,
				'aUF' => $this->aUF,
				'date' => $this->date
				));
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(),'Note/insertion');
			return null;
		}
		$this->id=DB::insertId();
		// sauvegarde d'une copie de la note en session
		if (self::SAVE_IN_SESSION) $session=SC::get()->setParamInCollection('notes', $this->id, $this);

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
			DB::update(PREFIX_BDD.'assocUE', array('note'=>$this->note, 'finished'=>$this->finished, 'answers'=>$this->answers, 'inputs'=>$this->inputs, 'date'=>$this->date),"id=%i",$this->id);
		} catch(MeekroDBException $e) {
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
			DB::delete(PREFIX_BDD.'assocUE', 'id=%i', $this->id);
			EC::add("La note a bien été supprimée.");
			if (self::SAVE_IN_SESSION) {
				SC::get()->unsetParamInCollection('notes', $this->id);
				SC::get()->unsetParam("messages");
			}
			// Il faut supprimer tous les commentaires liés
			DB::delete(PREFIX_BDD."messages","aUE=%i", $this->id);
			return true;
		} catch(MeekroDBException $e) {
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

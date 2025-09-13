<?php

namespace BDDObject;
use DB;
use MeekroDBException;
use ErrorController as EC;
use SessionController as SC;

class User
{
	const	RANK_ROOT="Root";
	const	RANK_ADMIN="Admin";
	const	RANK_PROF="Prof";
	const	RANK_ELEVE="Élève";
	const	RANK_DISCONNECTED="Off";

	const	SAVE_IN_SESSION = true;

	protected $id=null;
	protected $idClasse = null; // 0 est équivalent à pas de classe
	protected $classe = null;
	protected $rank = self::RANK_DISCONNECTED;
	protected $nom = 'Disconnected';
	protected $prenom ='';
	protected $email ='';
	protected $pref = '';
	protected $cas = '';
	protected $date = null;
	protected $bcryptHash = null;

	protected $_notes = null;			// Liste des notes, tableau trié par idClasse

	##################################### METHODES STATIQUES #####################################

	public function __construct($options=array())
	{
		if(isset($options['id'])) $this->id = (integer) $options['id'];
		if(isset($options['idClasse'])) $this->idClasse = (integer) $options['idClasse'];
		if(isset($options['nom'])) $this->nom = $options['nom'];
		if(isset($options['prenom'])) $this->prenom = $options['prenom'];
		if(isset($options['email'])) $this->email = $options['email'];
		if(isset($options['date'])) $this->date = $options['date'];
		else $this->date = date('Y-m-d H:i:s');
		if(isset($options['rank'])) $this->rank = $options['rank'];
		if(isset($options['pwd'])) $this->updatePwd($options['pwd']);
		if(isset($options['pref'])) $this->pref=$options['pref'];
		if(isset($options['cas'])) $this->cas=$options['cas'];
	}

	public static function getList($params=array())
	{
		// $params['classe'] permet de préciser l'id d'une classe dont on veut les élèves
		// $params['classes'] permet de préciser une liste d'id de classe dont on veut les élèves
		// $params['ranks'] indique les rangs à garder sous forme d'un tableau
		require_once BDD_CONFIG;
		try {
			// on n'utilise pas le champ pseudo
			if (isset($params['ranks'])) return DB::query("SELECT u.id, idClasse, c.nom AS nomClasse, u.nom, prenom, email, rank, pref, u.date, u.cas FROM (".PREFIX_BDD."users u LEFT JOIN ".PREFIX_BDD."classes c ON u.idClasse = c.id) WHERE rank IN %ls ORDER BY u.date DESC",$params['ranks']);
			elseif (isset($params['classe'])) return DB::query("SELECT u.id, c.nom AS nomClasse, idClasse, u.nom, prenom, email, rank, pref, u.date, u.cas FROM (".PREFIX_BDD."users u LEFT JOIN ".PREFIX_BDD."classes c ON u.idClasse = c.id) WHERE idClasse=%i",$params['classe']);
			elseif (isset($params['classes'])) {
				if (count($params['classes'])>0) {
					return DB::query("SELECT u.id, c.nom AS nomClasse, idClasse, u.nom, prenom, email, rank, pref, u.date, u.cas FROM (".PREFIX_BDD."users u LEFT JOIN ".PREFIX_BDD."classes c ON u.idClasse = c.id) WHERE idClasse IN %ls",$params['classes']);
				} else {
					return array();
				}
			}
			else return DB::query("SELECT u.id, c.nom AS nomClasse, idClasse, u.nom, prenom, email, rank, pref, u.date, u.cas FROM (".PREFIX_BDD."users u LEFT JOIN ".PREFIX_BDD."classes c ON u.idClasse = c.id)");
		} catch(MeekroDBException $e) {
			if (BDD_DEBUG_ON) return array('error'=>true, 'message'=>"#User/getList : ".$e->getMessage());
			return array('error'=>true, 'message'=>'Erreur BDD');
		}
	}

	public static function search($id,$returnObject=false)
	{
		if (is_numeric($id)) {
			$idUser = (integer) $id;
		} else return null;

		if (self::SAVE_IN_SESSION) {
			$user = SC::get()->getParamInCollection('users', $idUser, null);
			if ($user !== null){
				if ($returnObject) return $user;
				else return $user->toArray();
			}
		}

		// Pas trouvé dans la session, il faut chercher en bdd
		require_once BDD_CONFIG;
		try {
			$bdd_result=DB::queryFirstRow("SELECT id, idClasse, nom, prenom, email, rank, date, cas FROM ".PREFIX_BDD."users WHERE id=%s", $idUser);
			if ($bdd_result === null) return null;

			if ($returnObject || self::SAVE_IN_SESSION) {
				$user = new User($bdd_result);
				if (self::SAVE_IN_SESSION) {
					SC::get()->setParamInCollection('users', $user->getId(), $user);
				}
				if ($returnObject) return $user;
			}

			return $bdd_result;
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(),"User/Search");
		}
		return null;
	}

	public static function getObject($id)
	{
		// alias pour search avec retour sous forme d'objet
		return self::search($id, true);
	}

	public static function checkPwd($pwd)
	{
		return true;
	}

	public static function checkEMail($email)
	{
		return preg_match("#^[a-zA-Z0-9_-]+(.[a-zA-Z0-9_-]+)*@[a-zA-Z0-9._-]{2,}\.[a-z]{2,4}$#", $email);
	}


	public static function emailExists($email)
	{
		require_once BDD_CONFIG;
		try {
			// Vérification que l'email
			$results = DB::query("SELECT id FROM ".PREFIX_BDD."users WHERE email=%s",$email);
			if (DB::count()>0) return $results[0]["id"];
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage());
		}
		return false;
	}

	public static function casExists($cas)
	{
		if ($cas!='') {
			require_once BDD_CONFIG;
			try {
				// Vérification que l'id cas n'existe pas déjà
				$results = DB::query("SELECT id FROM ".PREFIX_BDD."users WHERE cas=%s",$cas);
				if (DB::count()>0) return $results[0]["id"];
			} catch(MeekroDBException $e) {
				EC::addBDDError($e->getMessage());
			}
		}
		return false;
	}

	##################################### METHODES #####################################

	public function __toString()
	{
		return $this->nom;
	}

	public function casToEmail($force=false)
	{
		// si cas est défini, écrase email
		// si email vide, ou si force
		if (($this->cas!="") && ( $force || ($this->email=="")  ))
		{
			$this->email = $this->cas."@".CAS_MAIL_DOMAIN;
		}
	}

	public function identifiant()
	{
		return $this->email;
	}

	public function getName()
	{
		return $this->nom;
	}

	public function isRoot ()
	{
		return ( $this->rank == self::RANK_ROOT );
	}

	public function isAdmin ()
	{
		return (( $this->rank == self::RANK_ROOT ) || ( $this->rank == self::RANK_ADMIN ));
	}

	public function isProf ($orBetter = false)
	{
		return ( ($this->rank == self::RANK_PROF ) || ($orBetter && ( ($this->rank == self::RANK_ROOT ) || ($this->rank == self::RANK_ADMIN ) ) ) );
	}

	public function isEleve ()
	{
		return ( $this->rank == self::RANK_ELEVE );
	}

	public function isStronger(User $user)
	{
		if ($user->isRoot()) return false;
		if ($user->isAdmin()) return $this->isRoot();
		if ($user->isProf()) return $this->isAdmin();
		return $this->isProf(true);
	}

	public function delete()
	{
		if ($this->isRoot()) {
			EC::add("Le compte root ne peut être supprimé.");
			return false;
		}
		if ($this->isProf(true)) {
			// Le compte ne doit pas posséder de classe
			$liste = Classe::getList(array("ownerIs"=>$this->id));
			if (count($liste)>0) {
				EC::addError("Vous devez d'abord supprimer toutes les classes de cet utilisateur.", "Classe/Suppression");
				return false;
			}
		}

		require_once BDD_CONFIG;
		if (self::SAVE_IN_SESSION) {
			$session=SC::get()->unsetParamInCollection('users', $this->id);
			$session=SC::get()->unsetParam('notes');
			$session=SC::get()->unsetParam('messages');
		}
		if ($this->isEleve()) {
			try {
				// Suppression de toutes les notes liées
				DB::query("DELETE ".PREFIX_BDD."assocUE FROM ".PREFIX_BDD."assocUE LEFT JOIN ".PREFIX_BDD."assocUF ON (".PREFIX_BDD."assocUF.id = ".PREFIX_BDD."assocUE.aUF) WHERE ".PREFIX_BDD."assocUF.idUser = %i", $this->id);
				// Suppression de tous les devoirs liés
				DB::delete(PREFIX_BDD.'assocUF', 'idUser=%i', $this->id);
			} catch(MeekroDBException $e) {
				EC::addBDDError($e->getMessage(), "User/Suppression");
			}
		}
		try {
			DB::delete(PREFIX_BDD.'users', 'id=%i', $this->id);
			// Suppression de tous les messages
			DB::query("DELETE FROM ".PREFIX_BDD."messages WHERE idOwner = %i OR idDest = %i", $this->id, $this->id);
			EC::add("L'utilisateur a bien été supprimée.");

			return true;
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), "User/Suppression");
		}
		return false;
	}

	public function insertion_validation()
	{
		// vérifie si l'utilisateur peut-être inséré
		$errors = array();
		$email_errors = array();
		if (!self::checkEMail($this->email))
			$email_errors[] = "Email invalide.";
		if (self::emailExists($this->email)!==false )
			$email_errors[] = "L'identifiant (email) existe déjà.";
		if (count($email_errors)>0)
			$errors['email'] = $email_errors;
		if (self::casExists($this->cas))
			$errors['cas'] = "L'identifiant CAS existe déjà";
		if (count($errors)>0)
			return $errors;
		else
			return true;
	}


	public function insertion()
	{
		require_once BDD_CONFIG;
		try {
			DB::insert(PREFIX_BDD.'users', $this->toBDDArray());
			$this->id=DB::insertId();
			return $this->id;
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage());
		}
		return null;
	}

	public function update_validation($params=array())
	{
		$errors = array();

		if (isset($params['email'])&&($params['email']!==$this->email))
		{
			$email_errors = array();
			if (!self::checkEMail($params['email']))
			{
				$email_errors[] = "Email invalide.";
			}
			if ( self::emailExists($params['email'])!==false )
			{
				$email_errors[] = "L'EMail existe déjà.";
			}
			if ($this->isRoot()) {
				$email_errors[] = "L'email du root ne peut être changé.";
			}
			if (count($email_errors)>0)
				$errors['email'] = $email_errors;
		}
		if (isset($params['rank']) && ($params['rank']!=$this->rank))
		{
			$errors['rank'] = array("Le rang ne peut pas être modifié.");
		}
		if (isset($params['cas']) && ($params['cas']!==$this->cas))
		{
			if (self::casExists($params['cas']))
			{
				$errors['cas'] = "L'identifiant CAS existe déjà.";
			}
		}
		if (count($errors)>0)
			return $errors;
		else
			return true;
	}


	public function update($params=array(),$updateBDD=true)
	{
		$bddModif=false;
		if ($this->id===null) {
			EC::addDebugError('Id manquant.');
			return false;
		}

		if(isset($params['nom']))
		{
			$this->nom = $params['nom'];
			$bddModif=true;
		}
		if(isset($params['prenom']))
		{
			$this->prenom = $params['prenom'];
			$bddModif=true;
		}
		if(isset($params['rank']))
		{
			$this->rank = $params['rank'];
			$bddModif=true;
		}
		if(isset($params['email']))
		{
			$this->email = $params['email'];
			$bddModif=true;
		}
		if(isset($params['pwd']))
		{
			$this->updatePwd($params['pwd']);
			$bddModif=true;
		}
		if(isset($params['pref']))
		{
			$this->pref = $params['pref'];
			$bddModif=true;
		}

		if(isset($params['cas']))
		{
			$this->cas = $params['cas'];
			$bddModif=true;
		}

		if (!$bddModif)
		{
			EC::add("Aucune modification.");
			return true;
		}

		// La mise à jour est utile quand on accède à l'utilisateur
		// via le uLog, ce qui laisse inchangé la copie de l'utilisateur
		// dans la liste des user
		if (self::SAVE_IN_SESSION)
		{
			SC::get()->setParamInCollection('users', $this->getId(), $this);
		}

		if (!$updateBDD) {
			EC::add("La modification a bien été effectuée.");
			return true;
		}

		require_once BDD_CONFIG;
		try{
			DB::update(PREFIX_BDD.'users', $this->toBDDArray() ,"id=%i",$this->id);
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'User/update');
			return false;
		}
		EC::add("La modification a bien été effectuée.");
		return true;
	}

	public function updatePwd($pwd)
	{
		if (function_exists("password_hash")) {
			$this->bcryptHash = password_hash($pwd,PASSWORD_DEFAULT);
		}
	}

	public function updateTime()
	{
		$this->date = date('Y-m-d H:i:s');
		require_once BDD_CONFIG;
		try{
			DB::update(PREFIX_BDD.'users', array("date"=>$this->date),"id=%i",$this->id);
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'User/updateTime');
		}
		return $this;
	}

	public function isSameAs($key)
	{
		return ( ($this->id ===$key) || ($this->email === $key) );
	}

	public function toArray()
	{
		$answer = array(
			'nom'=>$this->nom,
			'prenom'=>$this->prenom,
			'email'=>$this->email,
			'rank'=>$this->rank,
			'date'=>$this->date,
			'pref'=>$this->pref,
			'cas' =>$this->cas
		);
		if ($this->id !== null) $answer['id']=$this->id;
		if ($this->idClasse !== null) $answer['idClasse'] = $this->idClasse;
		$classe = $this->getClasse();
		if ($classe !== null) $answer['nomClasse'] = $classe->getNom();
		return $answer;
	}

	private function toBDDArray()
	{
		$answer=array(
			'nom'=>$this->nom,
			'prenom'=>$this->prenom,
			'email'=>$this->email,
			'rank'=>$this->rank,
			'date'=>$this->date,
			'pref'=>$this->pref,
			'cas' =>$this->cas
		);

		if ($this->id !== null) $answer['id']=$this->id;
		if ($this->idClasse !== null) $answer['idClasse'] = $this->idClasse;
		// La seule façon pour que les paramètres de hash soient non null
		// C'est qu'on ait fait un updatePwd($pwd)
		// soit lors d'un update, soit lors du constructeur
		if ($this->bcryptHash !== null)
		{
			$answer["hash"] = $this->bcryptHash;
		}
		return $answer;
	}

	public function fichesAssoc()
	{
		if ($this->isEleve()) {
			require_once BDD_CONFIG;
			try{
				return DB::query("SELECT a.id,a.idFiche, a.actif, a.date FROM (".PREFIX_BDD."assocUF a JOIN ".PREFIX_BDD."fiches f ON f.id = a.idFiche) WHERE idUser=%i AND f.visible=1 ORDER BY idFiche",$this->id);
			} catch(MeekroDBException $e) {
				EC::addBDDError($e->getMessage(), "User/assocUF");
				return array();
			}
		}
		return array();
	}

	public function getId()
	{
		return $this->id;
	}

	public function getClasseId()
	{
		return $this->idClasse;
	}

	public function getClasse()
	{
		// alias de classe
		if ($this->isEleve()) return Classe::getObject($this->idClasse);
		else return null;
	}

	public function isMyTeacher(User $account)
	{
		if (!$this->isEleve()) return false; // Pas réussi à mettre les deux tests en un seul
		if (!$account->isProf()) return false;
		$classe = $this->getClasse();
		if (($classe !== null) && $classe->isOwnedBy($account)) return true;
		return false;
	}

	public function getMyTeacher()
	{
		if ($this->isEleve()) {
			$classe = $this->getClasse();
			if ($classe !== null) {
				return $classe.getOwner();
			}
		}
		return null;
	}


	public function classe()
	{
		if ($this->isEleve()) return Classe::getObject($this->idClasse);
		else return null;
	}

	public function notes()
	{
		return UserNotes::getObject($this);
	}

	public function insertNote($params)
	{
		if (($notes = $this->notes()) !== null) $notes->insertion($params);
	}

	public function updateNote($params)
	{
		if (($notes = $this->notes()) !== null) $notes->update($params);
	}

	public function isMemberOf($idClasse){
		if (is_numeric($idClasse)) $idClasse = (integer) $idClasse;
		// test si l'utilisateur est membre d'une classe
		return ($idClasse === $this->idClasse);
	}

	public function initKey()
	{
		$key = md5(rand());
		require_once BDD_CONFIG;
		try {
			DB::insert(PREFIX_BDD.'initKeys', array("initKey"=>$key, "idUser"=>$this->id));
			return $key;
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage());
		}
		return null;
	}

}


?>

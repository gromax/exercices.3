<?php

namespace BDDObject;

use DB;
use ErrorController as EC;
use SessionController as SC;
use MeekroDBException;

final class Message extends Item
{
	protected static $BDDName = "messages";

	##################################### METHODES STATIQUES #####################################

	protected static function champs()
	{
		return array(
			'idOwner' => array( 'def' => null, 'type' => 'integer'),	// id de l'auteur
			'message' => array( 'def' => "", 'type'=> 'string'),		// contenu du message
			'aUE' => array( 'def' => "", 'type' => 'integer'),	// données relatives au contexte
			'date' => array( 'def' => date('Y-m-d H:i:s'), 'type' => 'dateHeure'),	// Date-heure de création
			'lu' => array( 'def' => false, 'type'=>'boolean'),
			'idDest' => array( 'def' => null, 'type' => 'integer')
			);
	}

	public static function getList($idUser)
	{
		require_once BDD_CONFIG;
		try {
			// en tant qu'expéditeur
			$expediteur_bdd_result = DB::query("SELECT m.id, m.idOwner, m.message, m.aUE, m.date, 'Moi' AS ownerName, m.idDest, CONCAT(u.nom,' ',u.prenom) AS destName, 1 AS lu FROM (".PREFIX_BDD."messages m JOIN ".PREFIX_BDD."users u ON u.id=m.idDest) WHERE m.idOwner=%i", $idUser);
			// en tant que récepteur
			$recepteur_bdd_result=DB::query("SELECT m.id, m.idOwner, m.message, m.aUE, m.date, CONCAT(u.prenom, ' ', u.nom) AS ownerName, '".$idUser."' AS idDest, 'Moi' AS destName, m.lu FROM (".PREFIX_BDD."messages m JOIN ".PREFIX_BDD."users u ON u.id = m.idOwner) WHERE m.idDest=%i", $idUser);
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), "Messages/getList");
			return array("error"=>true, "message"=>$e->getMessage());
		}
		$bdd_result = array_merge($expediteur_bdd_result, $recepteur_bdd_result);
		$dates = array_column($bdd_result,"date");
		array_multisort($dates,SORT_ASC,$bdd_result);
		return $bdd_result;
	}


	public static function unReadNumber($idUser)
	{
		require_once BDD_CONFIG;
		try{
			DB::query("SELECT id FROM ".PREFIX_BDD.static::$BDDName." WHERE idDest = %i AND lu = 0", $idUser);
			return DB::count();
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), 'Messages/unReadNumber');
		}
		return 0;
	}


	##################################### METHODES #####################################


	public function isOwnedBy($user)
	{
		return $this->values['idOwner'] == $user->getId();
	}

	public function isDestTo($user)
	{
		return $this->values['idDest'] == $user->getId();
	}

	public function setLu()
	{
		require_once BDD_CONFIG;
		try{
			DB::update(PREFIX_BDD.static::$BDDName, array("lu" => true), "id=%i", $this->id);
			$this->values['lu'] = true;
		} catch(MeekroDBException $e) {
			EC::addBDDError($e->getMessage(), static::$BDDName."/setLu");
			return false;
		}
		EC::add(static::$BDDName."/setLu : Succès.");
		return true;
	}

	public function getDestName()
	{
		// utile pour construire la réponse lors d'une insertion de message
		require_once BDD_CONFIG;
		try {
			$out = DB::queryFirstRow("SELECT CONCAT(nom,' ',prenom) as fullname FROM ".PREFIX_BDD."users WHERE id = %i",$this->values['idDest']);
			if ($out !== null) {
				return $out["fullname"];
			} else {
				return "?";
			}
		} catch(MeekroDBException $e) {
			if (BDD_DEBUG_ON) return array('error'=>true, 'message'=>"#User/getList : ".$e->getMessage());
			return "?";
		}
	}
}

?>

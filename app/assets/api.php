<?php
use ErrorController as EC;

// Pour le dev
// Afficher les erreurs à l'écran
ini_set('display_errors', 1);
// Enregistrer les erreurs dans un fichier de log
ini_set('log_errors', 1);
// Nom du fichier qui enregistre les logs (attention aux droits à l'écriture)
ini_set('error_log', dirname(__file__) . '/log_error_php.txt');
// Afficher les erreurs et les avertissements
error_reporting(E_ALL);

require_once "../php/constantes.php";
require_once "../php/classAutoLoad.php";
require_once "../php/routes.php";
define("DEV_MODE", true);

$response = $router->load();
EC::header(); // Doit être en premier !
if ($response === false) {
	echo json_encode(array("ajaxMessages"=>EC::messages()));
} else {
	if (isset($response["errors"]) && (count($response["errors"])==0)) {
		unset($response["errors"]);
	}/* else {
		$messages = EC::messages();
		if (count($messages)>0) {
			$response["errors"] = $messages;
		}
	}*/
	echo json_encode($response);
}

?>

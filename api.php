<?php
use ErrorController as EC;
use SessionController as SC;

require_once "./php/constantes.php";

// Pour le dev
if (DEV_MODE) ini_set('display_errors', 1); // afficher erreurs à l'écran
ini_set('log_errors', 1); // enregistrer erreurs dans un fichier de log
ini_set('error_log', dirname(__file__) . '/log_error_php.txt');
if (DEV_MODE) error_reporting(E_ALL); // Afficher les erreurs et les avertissements

require_once './vendor/autoload.php';

require_once "./php/classAutoLoad.php";
require_once "./php/routes.php";

$response = $router->load();
EC::header(); // Doit être en premier !
if ($response === false) {
    echo json_encode(array("ajaxMessages"=>EC::messages()));
} else {
    if (isset($response["errors"]) && (count($response["errors"])==0)) {
        unset($response["errors"]);
    } else {
        var_dump("ici");
        $messages = EC::messages();
        if (count($messages)>0) {
            $response["errors"] = $messages;
        }
    }
    if (!isset($response['token'])) {
        $token = SC::renewToken();
        if ($token !== null) {
            $response['token'] = $token;
        }
    }
    echo json_encode($response);
}

?>

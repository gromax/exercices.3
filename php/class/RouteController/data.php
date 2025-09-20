<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Logged;
use BDDObject\AssoUF;
use BDDObject\ExoFiche;
use BDDObject\Note;
use BDDObject\Fiche;
use BDDObject\User;
use BDDObject\Message;
use BDDObject\Classe;
use BDDObject\Exercice;

class data
{
    /**
     * paramères de la requète
     * @array
     */
    private $params;
    /**
     * Constructeur
     */
    public function __construct($params)
    {
        $this->params = $params;
    }
    /**
     * renvoie les infos sur l'objet d'identifiant id
     * @return array
     */

    public function eleveFetch()
    {
        // Renvoie l'ensemble des données pour un élève
        $uLog =Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }

        if ($uLog->isEleve())
        {
            return array(
                "aEFs" => ExoFiche::getList(array("idUser"=>$uLog->getId())),
                "devoirs" => AssoUF::getList(array("idUser"=> $uLog->getId() )),
                "aUEs" => Note::getList(array("idUser"=>$uLog->getId())),
                "messages" => Message::getList($uLog->getId()),
            );
        } else {
            EC::set_error_code(403);
            return false;
        }

        EC::set_error_code(501);
        return false;
    }

    public function fetchMe()
    {
        // Renvoie les données de l'utilisateur connecté
        $uLog =Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::addError("Déconnecté !");
            EC::set_error_code(401);
            return false;
        }
        return $uLog->toArray();
    }

    public function customFetch()
    {
        // Renvoie les données demandées

        $uLog =Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::addError("Déconnecté !");
            EC::set_error_code(401);
            return false;
        }
        $asks = explode("&",$this->params['asks']);
        $output = array();

        // Les exercices sont publics et accessibles à tous les rangs
        if (in_array("exercices", $asks)){
            $answer =  Exercice::getList();
            if (isset($answer["error"]) && $answer["error"]) {
                EC::addError($answer["message"]);
                EC::set_error_code(501);
                return false;
            } else {
                $output["exercices"] = $answer;
            }
        }

        if ($uLog->isEleve())
        {
            if (in_array("exofiches", $asks)){
                $answer = ExoFiche::getList(array("idUser"=>$uLog->getId()));
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["exofiches"] = $answer;
                }
            }

            if (in_array("devoirs", $asks)){
                $answer = AssoUF::getList(array("idUser"=> $uLog->getId() ));
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["devoirs"] = $answer;
                }
            }

            if (in_array("faits", $asks)){
                $answer =  Note::getList(array("idUser"=>$uLog->getId()));
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["faits"] = $answer;
                }
            }

            if (in_array("messages", $asks)){
                $answer =  Message::getList($uLog->getId());

                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    // On filtre les noms de sorte que quand dest ou owner n'est pas l'utilisateur, on écrit prof

                    $filtreNomProf = function ($item)
                    {
                        // Pour masquer le nom prof
                        if ($item["ownerName"] == "Moi") { $item["destName"] = "Prof"; }
                        elseif ($item["destName"] == "Moi") { $item["ownerName"] = "Prof"; }
                        return $item;
                    };

                    $filteredAnswer = array_map($filtreNomProf, $answer);
                    $output["messages"] = $filteredAnswer;
                }
            }

            if (in_array("classes", $asks)){
                $answer =  Classe::getList(array('forEleve'=> $uLog->getId() ));
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["classes"] = $answer;
                }
            }
            return $output;
        }

        if ($uLog->isProf())
        {
            if (in_array("fiches", $asks)){
                $answer = Fiche::getList(array("owner"=> $uLog->getId() ));
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["fiches"] = Fiche::getList(array("owner"=> $uLog->getId() ));
                }
            }

            if (in_array("devoirs", $asks)){
                $output["devoirs"] = AssoUF::getList(array("idOwner"=> $uLog->getId() ));
            }

            if (in_array("exofiches", $asks)){
                $answer = ExoFiche::getList(array("idOwner"=>$uLog->getId()));
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["exofiches"] = $answer;
                }
            }

            if (in_array("faits", $asks)){
                $answer = Note::getList(array("idOwner"=>$uLog->getId()));
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["faits"] = $answer;
                }

            }

            if (in_array("users", $asks)){
                $answer = User::getList(array('classes'=>array_keys( $uLog->ownerOf() )));
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["users"] = $answer;
                }
            }

            if (in_array("messages", $asks)){
                $answer = Message::getList($uLog->getId());
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["messages"] = $answer;
                }
            }

            if (in_array("classes", $asks)){
                $answer = Classe::getList(array('ownerIs'=> $uLog->getId() ));
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["classes"] = $answer;
                }
            }

            return $output;

        }

        if ($uLog->isAdmin()) {
            if (in_array("fiches", $asks)){
                $answer = Fiche::getList();
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["fiches"] = $answer;
                }
            }

            if (in_array("devoirs", $asks)){
                $answer = AssoUF::getList();
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["devoirs"] = $answer;
                }
            }

            if (in_array("exofiches", $asks)){
                $answer = ExoFiche::getList();
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["exofiches"] = $answer;
                }
            }

            if (in_array("faits", $asks)){
                $answer = Note::getList();
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["faits"] = $answer;
                }
            }

            if (in_array("users", $asks)){
                if ($uLog->isRoot()) $answer = User::getList(array('ranks'=>array(User::RANK_ADMIN, User::RANK_ELEVE, User::RANK_PROF)));
                else $answer = User::getList(array('ranks'=>array(User::RANK_ELEVE, User::RANK_PROF)));

                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["users"] = $answer;
                }
            }

            if (in_array("messages", $asks)){
                $answer = Message::getList($uLog->getId());
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["messages"] = $answer;
                }
            }

            if (in_array("classes", $asks)){
                $answer = Classe::getList();
                if (isset($answer["error"]) && $answer["error"]) {
                    EC::addError($answer["message"]);
                    EC::set_error_code(501);
                    return false;
                } else {
                    $output["classes"] = $answer;
                }
            }

            return $output;

        }

        EC::set_error_code(403);
        return false;
    }



}
?>

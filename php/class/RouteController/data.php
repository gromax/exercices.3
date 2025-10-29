<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Logged;
use BDDObject\ExoDevoir;
use BDDObject\Devoir;
use BDDObject\User;
use BDDObject\Message;
use BDDObject\Classe;
use BDDObject\Exercice;
use BDDObject\NoteExo;

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

        // Les exercices sont publics et accessibles à tous les rangs


        if ($uLog->isEleve())
        {
            return $this->eleveCustomFetch($asks, $uLog);
        }

        if ($uLog->isProf())
        {
            return $this->profCustomFetch($asks, $uLog);
        }

        if ($uLog->isAdmin()) {
            return $this->adminCustomFetch($asks, $uLog);
        }

        EC::set_error_code(403);
        return false;
    }

    protected function customFetchHelper($toLoad, $asks)
    {
        $objects = [
            'sujetsexercices' => Exercice::class,
            'messages' => Message::class,
            'classes' => Classe::class,
            'devoirs' => Devoir::class,
            'users' => User::class,
            'exodevoirs' => ExoDevoir::class,
            'notesexos' => NoteExo::class
        ];

        $output = [];
        foreach ($toLoad as $key => $params)
        {
            if (!in_array($key, $asks)) continue;
            $class = $objects[$key] ?? null;
            if ($class === null) continue;
            $answer = $class::getList($params);
            if (isset($answer["error"]) && $answer["error"])
            {
                EC::addError($answer["message"]);
                EC::set_error_code(501);
                return false;
            }
            else
            {
                $output[$key] = $answer;
            }
        }

        return $output;
    }

    protected function eleveCustomFetch($asks, Logged $uLog)
    {
        $toLoad = [
            "sujetsexercices"=>[],
            "exodevoirs" => [
                'wheres' => ['devoirs.idClasse' => $uLog->get('idClasse') ],
            ],
            "classes" => [
                'wheres' => ['id'=> $uLog->get('idClasse') ]
            ],
            "notesexos" => [
                'wheres' => ['users.idUser'=> $uLog->get('id') ]
            ]
        ];
        $output = $this->customFetchHelper($toLoad, $asks);
        if ($output === false) return false;

        if (in_array("messages", $asks))
        {
            $answer =  Message::getListUser($uLog->getId());
            if (isset($answer["error"]) && $answer["error"])
            {
                EC::addError($answer["message"]);
                EC::set_error_code(501);
                return false;
            }
            else
            {
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

        return $output;
    }

    protected function profCustomFetch($asks, Logged $uLog)
    {
        $toLoad = [
            "sujetsexercices"=>[],
            "devoirs" => [
                'wheres' => ['idOwner'=> $uLog->get('id') ]
            ],
            "exodevoirs" => [
                'wheres' => ['devoirs.idOwner'=> $uLog->get('id') ],
            ],
            "users" => [
                'wheres' => ['classes.idOwner'=> $uLog->getId()]
            ],
            "classes" => [
                'wheres' => ['idOwner'=> $uLog->get('id') ]
            ],
            "notesexos" => [
                'wheres' => ['devoirs.idOwner'=> $uLog->get('id') ]
            ]
        ];
        $output = $this->customFetchHelper($toLoad, $asks);
        if ($output === false) return false;

        if (in_array("messages", $asks))
        {
            $answer = Message::getListUser($uLog->getId());
            if (isset($answer["error"]) && $answer["error"])
            {
                EC::addError($answer["message"]);
                EC::set_error_code(501);
                return false;
            }
            else
            {
                $output["messages"] = $answer;
            }
        }


        return $output;
    }

    protected function adminCustomFetch($asks, Logged $uLog)
    {
        // Renvoie les données demandées pour un admin
        $ranks = array(User::RANK_ELEVE, User::RANK_PROF);
        if ($uLog->isRoot()) {
            $ranks[] = User::RANK_ADMIN;
        }
        
        $toLoad = [
            "sujetsexercices"=>[],
            "devoirs"=>[],
            "exodevoirs"=>[],
            "users"=>array("ranks"=>$ranks),
            "classes"=>[],
            "notesexos"=>[]
        ];
        $output = $this->customFetchHelper($toLoad, $asks);
        if ($output === false) return false;

        if (in_array("messages", $asks))
        {
            $answer = Message::getListUser($uLog->getId());
            if (isset($answer["error"]) && $answer["error"]) {
                EC::addError($answer["message"]);
                EC::set_error_code(501);
                return false;
            }
            else
            {
                $output["messages"] = $answer;
            }
        }
        return $output;
    }   


}
?>

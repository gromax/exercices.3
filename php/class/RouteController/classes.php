<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\Classe;
use BDDObject\User;
use BDDObject\Logged;

class classes
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
    public function fetch()
    {
        $uLog =Logged::getConnectedUser();
        if (isset($this->params['id']))
        {
            $id = (integer) $this->params['id'];
            // Dans ce cas la connexion est impérative
            if (!$uLog->connexionOk())
            {
                EC::set_error_code(401);
                return false;
            }
            else
            {
                $classe = Classe::getObject($id);
                if ($classe===null)
                {
                    EC::set_error_code(404);
                    return false;
                }
                elseif ( $uLog->isAdmin() || $classe->isOwnedBy($uLog) )
                {
                    return $classe->toArray();
                }
                else
                {
                    EC::set_error_code(403);
                    return false;
                }
            }
        }
        else
        {
            // Dans ce cas, en l'absence de connexion,
            // il faut renvoyer les classes à rejoindre
            if ($uLog->connexionOk())
            {
                if ($uLog->isAdmin()) return Classe::getList();
                if ($uLog->isProf()) return Classe::getList(array('ownerIs'=> $uLog->getId() ));
                if ($uLog->isEleve()) return Classe::getList(array('forEleve'=> $uLog->getId() ));
            }
            // Liste des classes à rejoindre
            return Classe::getList(array('forJoin'=> true ));
        }
    }

    public function delete()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        elseif ($uLog->isEleve())
        {
            EC::set_error_code(403);
            return false;
        }
        else
        {
            $id = (integer) $this->params['id'];
            $classe=Classe::getObject($id);
            if ($classe === null)
            {
                EC::set_error_code(404);
                return false;
            }
            elseif($uLog->isAdmin() || $classe->isOwnedBy($uLog))
            {
                if ($classe->delete())
                    return array( "message" => "Model successfully destroyed!");
            }
            else
            {
                EC::set_error_code(403);
                return false;
            }
        }
        EC::set_error_code(501);
        return false;
    }

    public function insert()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve()) {
            // interdit pour élève
            EC::set_error_code(403);
            return false;
        }
        $data = json_decode(file_get_contents("php://input"),true);
        if ($uLog->isAdmin() && isset($data["idOwner"]))
        {
            // Dans ce cas, l'utilisateur a la possibilité de créer une classe pour un autre
            $idOwner = $data["idOwner"];
            $owner =User::getObject($idOwner);
            if (($owner == null) || !$owner->isProf())
            {
                EC::set_error_code(501);
                return false;
            }
            $data["owner"] = $owner;
        } else {
            // Sinon le propriétaire est forcément celui qui est connecté
            $data["owner"] = $uLog;
        }

        $classe = new Classe($data);
        $validation = $classe->insertion_update_validation();
        if($validation === true)
        {
            $id = $classe->insertion();
            if ($id!==null)
            {
                return $classe->toArray();
            }
        }
        else
        {
            EC::set_error_code(422);
            return array('errors'=>$validation);
        }
        // Si on en arrive là, erreur
        EC::set_error_code(501);
        return false;
    }

    public function update()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }
        if ($uLog->isEleve()) {
            // Interdit pour élève
            EC::set_error_code(403);
            return false;
        }
        $id = (integer) $this->params['id'];
        $classe=Classe::getObject($id);
        if ($classe === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if ($uLog->isAdmin() || $classe->isOwnedBy($uLog))
        {
            $data = json_decode(file_get_contents("php://input"),true);
            $validation = $classe->insertion_update_validation($data);
            if ($validation===true)
            {
                $modOk = $classe->update($data);
                if ($modOk === true)
                {
                    return $classe->toArray();
                }
            }
            else
            {
                EC::set_error_code(422);
                return array('errors' => $validation);
            }
        }
        else
        {
            // Interdit, pas propriétaire ni admin
            EC::set_error_code(403);
            return false;
        }
        EC::set_error_code(501);
        return false;
    }

    public function join()
    {
        $idClasse = (integer) $this->params['id'];
        $classe = Classe::getObject($idClasse);
        if ($classe === null)
        {
            EC::set_error_code(404);
            return false;
        }
        if (!$classe->isOpen())
        {
            EC::addError("Classe fermée.");
            EC::set_error_code(403);
            return false;
        }

        $data = json_decode(file_get_contents("php://input"),true);
        if (isset($data["pwdClasse"]))
        {
            $pwdClasse = $data["pwdClasse"];
        }
        else
        {
            $pwdClasse = "";
        }

        if (!$classe->testPwd($pwdClasse))
        {
            EC::addError("Mot de passe invalide.");
            EC::set_error_code(422);
            return false;
        }

        // On procède à l'inscription
        $data['idClasse'] = $idClasse;
        $data['rank'] = User::RANK_ELEVE;
        $user=new User($data);
        $validation = $user->insertion_validation();
        if ($validation === true)
        {
            $id = $user->insertion();
            if ($id!==null)
            {
                return $user->toArray();
            }
        }
        else
        {
            EC::set_error_code(422);
            return array('errors'=>$validation);
        }
        EC::set_error_code(501);
        return false;
    }

    public function testMDP()
    {
        $idClasse = (integer) $this->params['id'];
        $pwd = "";
        if (isset($_GET['pwd']))
        {
            $pwd = $_GET['pwd'];
        }

        $classe = Classe::getObject($idClasse);

        if ($classe === null)
        {
            EC::addError("La classe n'existe pas");
            EC::set_error_code(404);
            return false;
        }
        if (!$classe->testPwd($pwd))
        {
            EC::addError("Mot de passe invalide.");
            EC::set_error_code(422);
            return false;
        }
        return array("message"=>"Mot de passe correct");
    }

    public function fill()
    {
        $uLog=Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }

        if ($uLog->isAdmin())
        {
            $idClasse = (integer) $this->params['id'];
            $classe = Classe::getObject($idClasse);
            if ($classe === null)
            {
                EC::set_error_code(404);
                return false;
            }
            $messages = array();
            $inserteds = array();
            $data = $_POST; //json_decode(file_get_contents("php://input"),true);
            if (isset($data["liste"])) { $liste= $data["liste"]; } else { $liste=""; }
            $arr_liste = explode(PHP_EOL, $liste);
            foreach ($arr_liste as $item) {
                $item = trim($item);
                if ($item!=="")
                {
                    $arr_item = explode(";",$item);
                    if (count($arr_item)==3) {
                        $arr_item[] = "";
                    }
                    if (count($arr_item)<4) {
                        $messages[] = "$item => mal formatté";
                    } else if (($arr_item[2]=="")&&($arr_item[3]=="")){
                        $messages[] = "$item => cas et email vides";
                    } else {
                        $itData = array("nom"=>$arr_item[0], "prenom"=>$arr_item[1], "cas"=>$arr_item[2], "email"=>$arr_item[3], "pwd"=>"dfge_sx".rand(1000,9999), "idClasse"=>$idClasse, "rank"=>User::RANK_ELEVE);
                        $user=new User($itData);
                        $user->casToEmail(); // crée un email sur le cas si c'est possible et l'email n'est pas défini
                        $validation = $user->insertion_validation();
                        if ($validation === true)
                        {
                            $id = $user->insertion();
                            if ($id!==null)
                            {
                                $inserteds[] = $user->toArray();
                            }
                            else
                            {
                                $messages[] = "$item => Échec d'insertion";
                            }
                        }
                        else
                        {
                            $errorMessage = array();
                            foreach ($validation as $k => $v) {
                                if (is_array($v)) {
                                    $errorMessage[] = "($k) ".implode(" & ",$v);
                                } else {
                                    $errorMessage[] = "($k) $v";
                                }
                            }
                            $messages[] = "$item => Invalide [".implode("+", $errorMessage)."]";
                        }
                    }
                }
            }


            return array("inserteds"=>$inserteds, "message"=>$messages);
        }
        else
        {
            // Interdit, pas admin
            EC::set_error_code(403);
            return false;
        }


    }

}
?>

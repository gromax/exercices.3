<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\User;
use BDDObject\Logged;
use BDDObject\Classe;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class users
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

    public function fetch()
    {
        $uLog =Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }

        $id = (integer) $this->params['id'];
        $user = User::getObject($id);
        if ($user===null)
        {
            EC::set_error_code(404);
            return false;
        }
        if ( ($uLog->isAdmin() && $uLog->isStronger($user)) || ($uLog->isProf() && $user->isMyTeacher($uLog)) || ($user->getId() === $uLog->getId()) )
        {
            return $user->toArray();
        }
        else
        {
            EC::set_error_code(403);
            return false;
        }
    }

    public function fetchList()
    {
        $uLog =Logged::getConnectedUser();
        if (!$uLog->connexionOk())
        {
            EC::set_error_code(401);
            return false;
        }

        if ($uLog->isRoot()) return User::getList(array('ranks'=>array(User::RANK_ADMIN, User::RANK_ELEVE, User::RANK_PROF)));
        if ($uLog->isAdmin()) return User::getList(array('ranks'=>array(User::RANK_ELEVE, User::RANK_PROF)));
        if ($uLog->isProf()) return User::getList(array('classes'=>array_keys( $uLog->ownerOf() )));
        EC::set_error_code(403);
        return false;
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
            $user=User::getObject($id);
            if ($user === null)
            {
                EC::set_error_code(404);
                return false;
            }
            elseif( ($uLog->isAdmin() && $uLog->isStronger($user)) || $user->isMyTeacher($uLog) )
            {
                if ($user->delete())
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
            $data = json_decode(file_get_contents("php://input"),true);
            // S'il y a un code pour rejoindre la classe on accepte l'insertion
            if (isset($data["idClasse"]) && isset($data["classeMdp"]))
            {
                // Il s'agit d'une inscription
                $idClasse = (integer) $data['idClasse'];
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

                $pwdClasse = $data["classeMdp"];

                if (!$classe->testPwd($pwdClasse))
                {
                    EC::addError("Mot de passe invalide.");
                    EC::set_error_code(422);
                    return false;
                }

                // On procède à l'inscription
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
            else
            {
                EC::set_error_code(401);
                return false;
            }
        }
        if ($uLog->isAdmin()) {
            $data = json_decode(file_get_contents("php://input"),true);
            $userAdd = new User($data);
            $userAdd->casToEmail(); // met à jour l'email s'il n'est pas défini
            if ($userAdd->isEleve())
            {
                // Les élèves doivent s'inscrire eux-mêmes
                EC::set_error_code(403);
                return false;
            }
            elseif (!$uLog->isStronger($userAdd))
            {
                // rang trop élevé
                EC::set_error_code(403);
                return false;
            }
            else
            {
                $validation = $userAdd->insertion_validation();
                if ($validation === true)
                {
                    $id = $userAdd->insertion(true);
                    if ($id!==null)
                        return $userAdd->toArray();
                    else
                    {
                        EC::set_error_code(501);
                        return false;
                    }
                }
                else
                {
                    EC::set_error_code(422);
                    return array('errors'=>$validation);
                }
            }
        }
        else
        {
            // Seuls admin et root peuvent créer des utilisateurs
            EC::set_error_code(403);
            return false;
        }
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
        $id = (integer) $this->params['id'];
        if ($uLog->getId() == $id){
            // On modifie l'utilisateur connecté
            $userToMod=$uLog;
        }
        elseif ($uLog->isProf(true))
        {
            $userToMod=User::getObject($id);
            if ($userToMod === null)
            {
                EC::set_error_code(404);
                return false;
            }
            elseif( !($uLog->isAdmin() && $uLog->isStronger($userToMod)) && !$userToMod->isMyTeacher($uLog) ) {
                EC::set_error_code(403);
                return false;
            }
        }
        else
        {
            EC::set_error_code(403);
            return false;
        }

        $data = json_decode(file_get_contents("php://input"),true);

        // cas ne peut être modifié que par un admin
        if (isset($data['cas']) && !$uLog->isAdmin()) {
            unset($data['cas']);
        }

        $validation = $userToMod->update_validation($data);
        if ($validation === true)
        {
            $modOk=$userToMod->update($data);
            if ($modOk === true)
            {
                return $userToMod->toArray();
            }
            else
            {
                EC::set_error_code(501);
                return false;
            }
        }
        else
        {
            EC::set_error_code(422);
            return array('errors' => $validation);
        }
    }

    public function forgottenWithEmail()
    {
        if (isset($_POST['email']))
        {
            $email = $_POST['email'];
            $id = User::emailExists($email);

            if ($id!==false) {
                $user = User::getObject($id);
                if ($user!==null)
                {
                    return $this->forgotten($user);
                }
                else
                {
                    EC::set_error_code(404);
                    return false;
                }
            }
            else
            {
                EC::set_error_code(404);
                return false;
            }
        }
        else
        {
            EC::set_error_code(501);
            return false;
        }
    }

    private function forgotten($user)
    {
        $key = $user->initKey();
        if ($key!==null)
        {
            require_once MAIL_CONFIG;
            $mail = new PHPMailer(true);                              // Passing `true` enables exceptions
            try{
                //Server settings
                $mail->CharSet = 'UTF-8';
                //$mail->SMTPDebug = 2;                                 // Enable verbose debug output
                $mail->isSMTP();                                      // Set mailer to use SMTP
                $mail->Host = SMTP_HOST;                     // Specify main and backup SMTP servers
                $mail->SMTPAuth = true;                               // Enable SMTP authentication
                $mail->Username = SMTP_USER;                 // SMTP username
                $mail->Password = SMTP_PASSWORD;                           // SMTP password
                $mail->SMTPSecure = 'ssl';                            // Enable TLS encryption, `ssl` also accepted
                $mail->Port = SMTP_PORT;                                    // TCP port to connect to

                //Recipients
                $mail->setFrom(EMAIL_FROM, PSEUDO_FROM);
                $arrUser = $user->toArray();
                $mail->addAddress($user->identifiant(), $arrUser['prenom']." ".$arrUser['nom']);     // Add a recipient
                //$mail->addReplyTo('info@example.com', 'Information');
                //$mail->addCC('cc@example.com');
                //$mail->addBCC('bcc@example.com');

                //Attachments
                //$mail->addAttachment('/var/tmp/file.tar.gz');         // Add attachments
                //$mail->addAttachment('/tmp/image.jpg', 'new.jpg');    // Optional name

                //Content
                $mail->isHTML(true);                                  // Set email format to HTML
                $mail->Subject = "Mot de passe oublié";
                $mail->Body    = "<b>".NOM_SITE.".</b> Vous avez oublié votre mot de passe. Suivez ce lien pour pour modifier votre mot de passe : <a href='".PATH_TO_SITE."/#forgotten:$key'>Réinitialisation du mot de passe</a>.";
                $mail->AltBody = NOM_SITE." Vous avez oublié votre mot de passe. Copiez ce lien dans votre navigateur pour vous connecter et modifier votre mot de passe : ".PATH_TO_SITE."/#forgotten:$key";

                $mail->send();
            }   catch (Exception $e) {
                EC::addError("Le message n'a pu être envoyé. Erreur :".$mail->ErrorInfo);
                EC::set_error_code(501);
                return false;
            }
            $uLog=Logged::getConnectedUser();
            if ($uLog->isAdmin() || $user->isMyTeacher($uLog)){
                return array("message"=>"Email envoyé.", "key"=>$key);
            } else {
                return array("message"=>"Email envoyé.");
            }
        }
        else
        {
            EC::set_error_code(501);
            return false;
        }
    }

}
?>

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
    $uLog =Logged::getFromToken();
    if ($uLog->isOff())
    {
      EC::addError("Utilisateur non connecté.");
      EC::set_error_code(401);
      return false;
    }

    $id = (integer) $this->params['id'];
    $user = User::getObject($id);
    if ($user===null)
    {
      EC::addError("Utilisateur introuvable.");
      EC::set_error_code(404);
      return false;
    }
    if ( ($uLog->isAdmin() && $uLog->isStronger($user)) || ($uLog->isProf() && $user->get('idOwner') === $uLog->getId()) || ($user->getId() === $uLog->getId()) )
    {
      return $user->toArray();
    }
    else
    {
      EC::addError("Accès refusé.");
      EC::set_error_code(403);
      return false;
    }
  }

  public function fetchList()
  {
    $uLog =Logged::getFromToken();
    if ($uLog->isOff())
    {
      EC::addError("Utilisateur non connecté.");
      EC::set_error_code(401);
      return false;
    }

    if (isset($this->params['id']))
    {
      $id = (integer) $this->params['id'];
      return $this->fetchItem($id);
    }

    if ($uLog->isRoot())
    {
      return User::getList([
        'wheres' => [
          'ranks' => [ 'IN', implode('.', [User::RANK_ADMIN, User::RANK_ELEVE, User::RANK_PROF])]
        ]
      ]);
    }
    if ($uLog->isAdmin())
    {
      return User::getList([
        'wheres' => [
          'ranks' => [ 'IN', implode('.', [User::RANK_ELEVE, User::RANK_PROF])]
        ]
      ]);
    }
    if ($uLog->isProf())
    {
      return User::getList([
        'wheres' => [
          'idTeacher' => $uLog->getId()
        ]
      ]);
    }
    EC::addError("Accès refusé.");
    EC::set_error_code(403);
    return false;
  }

  private function fetchItem($id) {
    $uLog =Logged::getFromToken();
    if ($uLog->isOff())
    {
      EC::addError("Utilisateur non connecté.");
      EC::set_error_code(401);
      return false;
    }
    $oUser = User::getObject($id);
    if ($oUser===null)
    {
      EC::addError("Utilisateur introuvable.");
      EC::set_error_code(404);
      return false;
    }
    if ( ($uLog->isAdmin() && !$oUser->isAdmin())
       || $oUser->getId() === $uLog->getId()
       || $oUser->get("idTeacher") === $uLog->getId())
    {
      return $oUser->toArray();
    }
    EC::addError("Pas les droits pour accéder à cet utilisateur.");
    EC::set_error_code(403);
    return false;
  }

  public function delete()
  {
    $uLog=Logged::getFromToken();
    if ($uLog->isOff())
    {
      EC::addError("Utilisateur non connecté.");
      EC::set_error_code(401);
      return false;
    }
    if ($uLog->isEleve())
    {
      EC::addError("Interdit aux élèves.");
      EC::set_error_code(403);
      return false;
    }

    $id = (integer) $this->params['id'];
    $oUser = User::getObject($id);
    if ($oUser === null)
    {
        EC::addError("Utilisateur introuvable.");
        EC::set_error_code(404);
        return false;
    }
    if ($oUser->isRoot() || !$uLog->isStronger($oUser) ||
      !$uLog->isAdmin() && $oUser->get("idTeacher") !== $uLog->getId())
    {
      EC::addError("Vous n'avez pas le droit de supprimer cet utilisateur.");
      EC::set_error_code(403);
      return false;
    }
    if ($oUser->delete())
    {
      return array( "message" => "Model successfully destroyed!");
    }
    EC::set_error_code(501);
    return false;
  }

  public function insert()
  {
    $data = json_decode(file_get_contents("php://input"),true);
    $uLog=Logged::getFromToken();
    if ($uLog->isOff())
    {
      // Il peut s'agir d'une inscription
      if (!isset($data["idClasse"]) || !isset($data["classeMdp"]))
      {
        EC::addError("Utilisateur non connecté.");
        EC::set_error_code(401);
        return false;
      }
      // Il s'agit d'une inscription
      $idClasse = (integer) $data['idClasse'];
      $classe = Classe::getObject($idClasse);
      if ($classe === null || $classe->get('dateFin') < date('Y-m-d'))
      {
        EC::addError("Classe introuvable.");
        EC::set_error_code(404);
        return false;
      }
      if (!$classe->get('ouverte'))
      {
        EC::addError("Classe fermée.");
        EC::set_error_code(403);
        return false;
      }
      $pwdClasse = $data["classeMdp"];
      if (!$classe->testPwd($pwdClasse))
      {
        EC::addError("Mot de passe de la classe invalide.");
        EC::set_error_code(403);
        return false;
      }
      // On procède à l'inscription
      $data['rank'] = User::RANK_ELEVE;
      $user=new User($data);
      $response = $user->insert();
      if ($response ===null)
      {
        EC::set_error_code(501);
        return false;
      }
      if (is_array($response))
      {
        // erreur de validation
        EC::set_error_code(422);
        return $response;
      }
      return $user->toArray();
    }
    // inscription ordinaire par un admin
    if (!$uLog->isAdmin())
    {
      EC::addError("Seuls les administrateurs peuvent créer des utilisateurs.");
      EC::set_error_code(403);
      return false;
    }
    $userAdd = new User($data);
    if ($userAdd->isEleve())
    {
      // Les élèves doivent s'inscrire eux-mêmes
      EC::set_error_code(403);
      return false;
    }
    if (!$uLog->isStronger($userAdd))
    {
      // rang trop élevé
      EC::addError("Vous ne pouvez pas créer un utilisateur avec un rang supérieur ou égal au vôtre.");
      EC::set_error_code(403);
      return false;
    }
    $response = $userAdd->insert();
    if ($response ===null)
    {
      EC::addError("Erreur lors de la création de l'utilisateur.");
      EC::set_error_code(501);
      return false;
    }
    if (is_array($response))
    {
      // erreur de validation
      EC::set_error_code(422);
      return $response;
    }
    return $userAdd->toArray();
  }

  public function update()
  {
    $uLog=Logged::getFromToken();
    if ($uLog->isOff())
    {
      EC::addError("Utilisateur non connecté.");
      EC::set_error_code(401);
      return false;
    }
    $id = (integer) $this->params['id'];
    $oUser = User::getObject($id);
    if ($oUser->isRoot())
    {
      EC::addError("Le compte root ne peut pas être modifié.");
      EC::set_error_code(403);
      return false;
    }
    if ($oUser->isAdmin() && !$uLog->isRoot() && $uLog->getId() != $oUser->getId()){
      EC::addError("Vous n'avez pas le droit de modifier cet administrateur.");
      EC::set_error_code(403);
      return false;
    }
    if ($oUser->isProf() && !$uLog->isAdmin() && $uLog->getId() != $oUser->getId()){
      EC::addError("Vous n'avez pas le droit de modifier ce professeur.");
      EC::set_error_code(403);
      return false;
    }
    if ($oUser->isEleve() && !$uLog->isAdmin() && $oUser->get("idTeacher") !== $uLog->getId() && $oUser->getId() !== $uLog->getId()){
      EC::addError("Vous n'avez pas le droit de modifier cet élève.");
      EC::set_error_code(403);
      return false;
    }
    $data = json_decode(file_get_contents("php://input"),true);
    unset($data['rank']); // on ne peut pas modifier son rang ici
    $response = $oUser->update($data);
    if ($response ===null)
    {
      EC::addError("Erreur lors de la modification de l'utilisateur.");
      EC::set_error_code(501);
      return false;
    }
    if (is_array($response))
    {
      // erreur de validation
      EC::set_error_code(422);
      return $response;
    }
    return $oUser->toArray();
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
      $mail = new PHPMailer(true);                // Passing `true` enables exceptions
      try{
        //Server settings
        $mail->CharSet = 'UTF-8';
        //$mail->SMTPDebug = 2;                 // Enable verbose debug output
        $mail->isSMTP();                    // Set mailer to use SMTP
        $mail->Host = SMTP_HOST;           // Specify main and backup SMTP servers
        $mail->SMTPAuth = true;                 // Enable SMTP authentication
        $mail->Username = SMTP_USER;         // SMTP username
        $mail->Password = SMTP_PASSWORD;               // SMTP password
        $mail->SMTPSecure = 'ssl';              // Enable TLS encryption, `ssl` also accepted
        $mail->Port = SMTP_PORT;                  // TCP port to connect to

        //Recipients
        $mail->setFrom(EMAIL_FROM, PSEUDO_FROM);
        $arrUser = $user->toArray();
        $mail->addAddress($user->get('email'), $arrUser['prenom']." ".$arrUser['nom']);   // Add a recipient
        //$mail->addReplyTo('info@example.com', 'Information');
        //$mail->addCC('cc@example.com');
        //$mail->addBCC('bcc@example.com');

        //Attachments
        //$mail->addAttachment('/var/tmp/file.tar.gz');     // Add attachments
        //$mail->addAttachment('/tmp/image.jpg', 'new.jpg');  // Optional name

        //Content
        $mail->isHTML(true);                  // Set email format to HTML
        $mail->Subject = "Mot de passe oublié";
        $mail->Body  = "<b>".NOM_SITE.".</b> Vous avez oublié votre mot de passe. Suivez ce lien pour pour modifier votre mot de passe : <a href='".PATH_TO_SITE."/#forgotten:$key'>Réinitialisation du mot de passe</a>.";
        $mail->AltBody = NOM_SITE." Vous avez oublié votre mot de passe. Copiez ce lien dans votre navigateur pour vous connecter et modifier votre mot de passe : ".PATH_TO_SITE."/#forgotten:$key";

        $mail->send();
      }   catch (Exception $e) {
        EC::addError("Le message n'a pu être envoyé. Erreur :".$mail->ErrorInfo);
        EC::set_error_code(501);
        return false;
      }
      $uLog=Logged::getFromToken();
      if ($uLog->isAdmin() || $user->get("idTeacher") === $uLog->getId()){
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

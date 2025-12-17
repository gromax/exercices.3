<?php

namespace RouteController;
use ErrorController as EC;
use BDDObject\User;
use BDDObject\Logged;
use BDDObject\Classe;
use BDDObject\InitKey;
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
      if ($classe === null || $classe->get('expiration') < date('Y-m-d'))
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
        EC::set_error_code(422);
        return ["errors"=>["classeMdp"=>"Mot de passe de la classe invalide."]];
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
    if (isset($data['rank']))
    {
      // seul un root peut modifier prof -> admin ou admin -> prof
      $rank = (integer) $data['rank'];
      if (
        $rank !== $oUser->get("rank") &&
        (
          !$uLog->isRoot() ||
          !($oUser->isProf() && $rank === User::RANK_ADMIN) &&
          !($oUser->isAdmin() && $rank === User::RANK_PROF)
        )
      )
      {
        EC::addError("Vous n'avez pas le droit de modifier le rang de cet utilisateur.");
        EC::set_error_code(403);
        return false;
      }
    }
    
    $response = $oUser->update($data);
    if ($response ===false)
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
    if (!isset($_POST['email']))
    {
      EC::set_error_code(422);
      EC::addError("Email manquant.");
      return false;
    }
    $email = $_POST['email'];
    // vérification de la validité de l'email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      EC::set_error_code(501);
      EC::addError("Email invalide.");
      return false;
    }
    // vérification qu'un tel email existe
    $res = User::getList([
      'wheres' => [
        'email' => $email
      ]
    ]);
    if (count($res)==0)
    {
      // L'email n'existe pas. On ne dit rien pour des raisons de sécurité.
      return array("message"=>"Si un utilisateur a cet email, un message lui a été envoyé.");
    }
    $idUser = $res[0]['id'];
    // Nous pouvons créer une clé de réinitialisation
    $key = InitKey::createKey($idUser);
    $response = $key->insert();
    if ($response === false)
    {
      EC::addError("Erreur lors de la création de la clé.");
      EC::set_error_code(501);
      return false;
    }
    if (is_array($response))
    {
      // erreur de validation
      EC::set_error_code(422);
      return $response;
    }
    if (!$this->sendMail($key)) {
      // erreur lors de l'envoi du mail
      return false;
    }
    return ["message" => "Si un utilisateur a cet email, un message lui a été envoyé."];
  }

  private function sendMail($key)
  {
    $user = User::getObject($key->get("idUser"));
    $token = $key->get("initKey");

    require_once MAIL_CONFIG;
    $mail = new PHPMailer(true);
    
    try {
      // Configuration serveur SMTP
      $mail->CharSet = 'UTF-8';
      $mail->isSMTP();
      $mail->Host = SMTP_HOST;
      $mail->SMTPAuth = true;
      $mail->Username = SMTP_USER;
      $mail->Password = SMTP_PASSWORD;
      $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;  // SSL/TLS moderne
      $mail->Port = SMTP_PORT;
      
      // Décommenter pour debug (affiche les échanges SMTP)
      // $mail->SMTPDebug = 2;

      // Expéditeur et destinataire
      $mail->setFrom(EMAIL_FROM, PSEUDO_FROM);
      $mail->addAddress($user->get('email'), $user->get('prenom') . " " . $user->get('nom'));

      // Contenu de l'email
      $mail->isHTML(true);
      $mail->Subject = "Mot de passe oublié";
      $mail->Body = "<p><b>" . NOM_SITE . "</b></p>"
                  . "<p>Vous avez oublié votre mot de passe.</p>"
                  . "<p>Suivez ce lien pour réinitialiser votre mot de passe : "
                  . "<a href='" . PATH_TO_SITE . "/#forgotten/" . $token . "'>Réinitialisation du mot de passe</a>.</p>";
      $mail->AltBody = NOM_SITE . " - Vous avez oublié votre mot de passe. "
                     . "Copiez ce lien dans votre navigateur : " . PATH_TO_SITE . "/#forgotten/" . $token;

      $mail->send();
      return true;
    } catch (Exception $e) {
      EC::addError("Le message n'a pu être envoyé. Erreur : " . $mail->ErrorInfo);
      EC::set_error_code(500);
      return false;
    }
  }

}
?>

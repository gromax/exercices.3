<?php

namespace BDDObject;
use PDO;
use PDOException;
use ErrorController as EC;

class User extends Item
{
    protected static $BDDName = "users";

    const    RANK_ROOT=3;
    const    RANK_ADMIN=2;
    const    RANK_PROF=1;
    const    RANK_ELEVE=0;
    const    RANK_DISCONNECTED=-1;

    ##################################### METHODES STATIQUES #####################################

    protected static function champs()
    {
        return [
            'nom' => ['def' => "", 'type'=> 'string'],                 // nom de la classe
            'prenom' => ['def' => "", 'type'=> 'string'],            // prénom de l'utilisateur
            'email' => ['def' => "", 'type'=> 'string'],             // email de l'utilisateur
            'rank' => ['def' => self::RANK_DISCONNECTED, 'type'=> 'integer'], // rang de l'utilisateur
            'idClasse' => ['def' => NULL, 'type'=> 'integer'],                 // id de la classe
            'date' => ['def' => date('Y-m-d H:i:s'), 'type'=> 'datetime'], // date de création
            'nomClasse' => ['def' => "", 'type'=> 'string', 'foreign'=>'classes.nom'], // nom de la classe
            'idTeacher' => ['def' => 0, 'type'=> 'integer', 'foreign'=>'classes.idOwner'], // id du professeur
            'hash' => ['def' => "", 'type' => 'string', 'private' => true] // hash du mot de passe
        ] ;
    }

    /**
     * Définit les enfants protégés de cet objet BDD
     * ne peut supprimer que si pas d'enfants protégés
     */
    protected static function protectedChildren()
    {
        return [
            'classes'=> 'idOwner'
        ];
    }

    protected static function joinedTables()
    {
        return [
            'left' => ['classes' => 'users.idClasse = classes.id']
        ];
    }

    /**
     * Filtre les valeurs avant l'insertion dans la base de données
     * @param array $values Valeurs à insérer
     * @return array Valeurs filtrées
     */
    protected static function filterInsert($values)
    {
        $toInsert = parent::filterInsert($values);
        // Le mot de passe doit être hashé
        if (isset($values['pwd']))
        {
            $hash = password_hash($values['pwd'], PASSWORD_BCRYPT);
            $toInsert['hash'] = $hash;
        }
        return $toInsert;
    }

    protected static function filterUpdate($values, $current)
    {
        $toUpdate = parent::filterUpdate($values, $current);
        // Le mot de passe doit être hashé
        if (isset($values['pwd']))
        {
            $hash = password_hash($values['pwd'], PASSWORD_BCRYPT);
            $toUpdate['hash'] = $hash;
        }
        return $toUpdate;
    }

    /**
     * Vérifie la validité d'un mot de passe.
     * @param string $pwd Mot de passe à vérifier
     * @return true|array true si le mot de passe est valide, tableau d'erreurs sinon
     */
    protected static function checkPwd($pwd)
    {
        if (strlen($pwd) < 6)
        {
            return ["Le mot de passe doit contenir au moins 6 caractères."];
        }
        return true;
    }

    /**
     * Vérifie la validité d'une adresse e-mail.
     * @param string $email Adresse e-mail à vérifier
     * @return bool true si l'adresse e-mail est valide, false sinon
     */
    protected static function checkEMail($email)
    {
        return strlen($email) > 5 && strlen($email) < 100;
        //return preg_match("#^[a-zA-Z0-9_-]+(.[a-zA-Z0-9_-]+)*@[a-zA-Z0-9._-]{2,}\.[a-z]{2,4}$#", $email);
    }

    /**
     * Vérifie si une adresse e-mail existe déjà dans la base de données.
     * @param string $email Adresse e-mail à vérifier
     * @return int|false ID de l'utilisateur si l'adresse e-mail existe, false sinon
     */
    public static function emailExists($email)
    {
        require_once BDD_CONFIG;
        try {
            // Vérification que l'email
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $stmt = $pdo->prepare("SELECT id FROM ".PREFIX_BDD."users WHERE email=:email");
            $stmt->bindValue(':email', $email, PDO::PARAM_STR);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (count($results) > 0) return $results[0]["id"];
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage());
        }
        return false;
    }

    /**
     * Valide les valeurs avant l'insertion dans la base de données
     * @param array<string, mixed> $params Valeurs à insérer
     * @return bool|array true si les valeurs sont valides, tableau d'erreurs sinon
     */
    protected static function insertValidation($params)
    {
        $errors = [];
        if (isset($params['email']))
        {
            $email_errors = [];
            if (!self::checkEMail($params['email']))
            {
                $email_errors[] = "Email invalide.";
            }
            if (self::emailExists($params['email'])!==false )
            {
                $email_errors[] = "L'identifiant (email) existe déjà.";
            }
            if (count($email_errors)>0)
            {
                $errors['email'] = $email_errors;
            }
        }
        if (isset($params['pwd']))
        {
            $errorsPwd = self::checkPwd($params['pwd']);
            if ($errorsPwd !== true)
            {
                $errors["pwd"] = $errorsPwd;
            }
        }
        if (count($errors)>0)
        {
            return $errors;
        }
        return true;
    }

    /**
     * Prépare les données de l'utilisateur pour la génération d'un token.
     * @return array<string, mixed> Données de l'utilisateur
     */
    public function dataForToken()
    {
        return array(
            'id' => $this->getId(),
            'nom' => $this->get('nom'),
            'prenom' => $this->get('prenom'),
            'idClasse' => $this->get('idClasse'),
            'email' => $this->get('email'),
            'rank' => $this->get('rank')
        );
    }

    ##################################### METHODES #####################################

    /**
     * Constructeur de la classe User.
     * @param array<string, mixed> $options Options d'initialisation de l'utilisateur
     */
    public function __construct($options = array())
    {
        parent::__construct($options);
        if (isset($options['pwd']))
        {
            $this->values['pwd'] = $options['pwd'];
        }
    }

    /**
     * Valide les valeurs avant la mise à jour dans la base de données.
     * @param array<string, mixed> $params Valeurs à mettre à jour
     * @return bool|array true si les valeurs sont valides, tableau d'erreurs sinon
     */
    protected function updateValidation($params)
    {
        $errors = [];
        if (isset($params['email']) && $params['email'] != $this->get('email'))
        {
            $email_errors = [];
            if (!self::checkEMail($params['email']))
            {
                $email_errors[] = "Email invalide.";
            }
            if (self::emailExists($params['email'])!==false )
            {
                $email_errors[] = "L'identifiant (email) existe déjà.";
            }
            if (count($email_errors)>0)
            {
                $errors['email'] = $email_errors;
            }
        }

        if (isset($params['pwd']))
        {
            if (!self::checkPwd($params['pwd']))
            {
                $errors["pwd"] = "Mot de passe invalide.";
            }
        }
        if (count($errors)>0)
        {
            return $errors;
        }
        return true;
    }

    /**
     * Vérifie si l'utilisateur a le rang root.
     * @return bool true si l'utilisateur est root, false sinon
     */
    public function isRoot ()
    {
        return ( $this->get('rank') == self::RANK_ROOT );
    }

    /**
     * Vérifie si l'utilisateur a le rang admin.
     * @return bool true si l'utilisateur est admin, false sinon
     */
    public function isAdmin ()
    {
        return (( $this->get('rank') == self::RANK_ROOT ) || ( $this->get('rank') == self::RANK_ADMIN ));
    }

    /**
     * Vérifie si l'utilisateur a le rang prof.
     * @return bool true si l'utilisateur est prof, false sinon
     */
    public function isProf ()
    {
        return ( $this->get('rank') == self::RANK_PROF );
    }

    /**
     * Vérifie si l'utilisateur a le rang élève.
     * @return bool true si l'utilisateur est élève, false sinon
     */
    public function isEleve ()
    {
        return ( $this->get('rank') == self::RANK_ELEVE );
    }

    /**
     * Vérifie si l'utilisateur est déconnecté.
     * @return bool true si l'utilisateur est déconnecté, false sinon
     */
    public function isOff()
    {
        return $this->get("rank") === self::RANK_DISCONNECTED;
    }

    /**
     * Vérifie si l'utilisateur a un rang supérieur à un autre utilisateur.
     * @param User $user Utilisateur à comparer
     * @return bool true si l'utilisateur a un rang supérieur, false sinon
     */
    public function isStronger(User $user)
    {
        return $this->get("rank") > $user->get("rank");
    }

    /**
     * Vérifie si l'utilisateur peut être supprimé.
     * @return bool true si l'utilisateur peut être supprimé, false sinon
     */
    public function okToDelete()
    {
        if ($this->isRoot()) {
            EC::add("Le compte root ne peut être supprimé.");
            return false;
        }
        return parent::okToDelete();
    }

    /**
     * Met à jour la date de dernière modification de l'utilisateur.
     * @return $this
     */
    public function updateTime()
    {
        $this->set('date', date('Y-m-d H:i:s'));
        require_once BDD_CONFIG;
        try{
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $prefix = PREFIX_BDD;
            $stmt = $pdo->prepare(<<<SQL
                UPDATE {$prefix}users SET date=:date WHERE id=:id
            SQL
            );
            $stmt->execute(array(
                ':date' => $this->get('date'),
                ':id' => $this->get('id')
            ));
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage(), 'User/updateTime');
        }
        return $this;
    }

    /**
     * Initialise une nouvelle clé d'initialisation pour l'utilisateur.
     * @return string|null La nouvelle clé d'initialisation ou null en cas d'erreur
     */
    public function initKey(): string|null
    {
        $key = md5(rand());
        require_once BDD_CONFIG;
        try {
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // On supprime d'abord les anciennes clés
            $prefix = PREFIX_BDD;
            $stmt = $pdo->prepare(<<<SQL
                DELETE FROM {$prefix}initKeys WHERE idUser=:idUser
            SQL
            );
            $stmt->bindValue(':idUser', $this->getId(), PDO::PARAM_INT);
            $stmt->execute();
            $stmt = $pdo->prepare(<<<SQL
                INSERT INTO {$prefix}initKeys (initKey, idUser) VALUES (:initKey, :idUser)
            SQL
            );
            $stmt->bindValue(':initKey', $key, PDO::PARAM_STR);
            $stmt->bindValue(':idUser', $this->getId(), PDO::PARAM_INT);
            $stmt->execute();
            return $key;
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage());
        }
        return null;
    }
}


?>

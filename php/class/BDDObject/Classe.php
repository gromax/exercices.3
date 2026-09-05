<?php

namespace BDDObject;

use ErrorController as EC;
use PDO;
use PDOException;

final class Classe extends Item
{
    protected static $BDDName = "classes";

    ##################################### METHODES STATIQUES #####################################

    /**
     * Renvoie les champs de l'objet Classe
     * @return array Tableau des champs
     */
    protected static function champs()
    {
        return [
            'nom' => ['def' => "", 'type'=> 'string'],                 // nom de la classe
            'idOwner' => ['def' => 0, 'type'=> 'integer'],                 // id du propriétaire de la classe
            'nomOwner' => ['def' => "", 'type'=> 'string', 'foreign'=>'users.nom'], // nom du propriétaire de la classe
            'description' => ['def' => "", 'type'=> 'string'], // descriptif de la classe
            'pwd' => ['def' => "", 'type'=> 'string'],                 // mot de passe pour entrer dans la classe
            'date' => ['def' => date('Y-m-d'), 'type'=> 'date'], // date de création
            'expiration' => ['def' => date('Y-m-d', strtotime('+1 year')), 'type'=> 'date'], // date d'expiration
            'ouverte' => ['def' => false, 'type'=> 'boolean'],     // indique si la classe est ouverte aux inscriptions
        ] ;
    }

    /**
     * Renvoie les tables jointes pour l'objet Classe
     * @return array Tableau des tables jointes
     */
    protected static function joinedTables()
    {
        return [
            'inner' => ['users' => 'classes.idOwner = users.id']
        ];
    }

    /**
     * Définit les enfants protégés de cet objet BDD
     * ne peut supprimer que si pas d'enfants protégés
     * @return array Tableau des enfants protégés
     */
    protected static function protectedChildren()
    {
        return [
            'users'=> 'idClasse'
        ];
    }

    /**
     * Vérifie si le nom de la classe est valide
     * @param string $nom Nom de la classe
     * @return bool true si le nom est valide, false sinon
     */
    public static function checkNomClasse($nom)
    {
        return (is_string($nom) && (strlen($nom)>=NOMCLASSE_MIN_SIZE) && (strlen($nom)<=NOMCLASSE_MAX_SIZE));
    }

    /**
     * Teste le mot de passe d'une classe
     * @param int $id ID de la classe
     * @param string $pwd Mot de passe à tester
     * @return array|null Résultat du test (success ou error) ou null en cas d'erreur BDD
     */
    public static function testMDP($id, $pwd)
    {
        require_once BDD_CONFIG;
        try {
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $stmt = $pdo->prepare("SELECT id FROM ".PREFIX_BDD."classes WHERE id = :id AND pwd = :pwd");
            $stmt->execute(array(':id' => $id, ':pwd' => $pwd));
            $bdd_result = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage(), 'Classe/testMDP');
            return null;
        }

        if ($bdd_result !== null) { // Connexion réussie
            return array("success"=>true);
        }

        EC::addError("Mot de passe invalide.");
        return array("error"=>"Mot de passe invalide.");
    }

    /**
     * Valide les paramètres avant l'insertion d'une nouvelle classe
     * @param array $params Paramètres à valider
     * @return array|bool Tableau des erreurs ou true si les paramètres sont valides
     */
    protected static function insertValidation($params)
    {
        // vérifie si l'utilisateur peut-être inséré
        $errors = array();
        if (strlen($params['nom'])>NOMCLASSE_MAX_SIZE)
        {
            $errors["nom"] = "Nom trop long";
        }
        elseif (strlen($params['nom'])<NOMCLASSE_MIN_SIZE)
        {
            $errors["nom"] = "Nom trop court";
        }
        if (count($errors)>0)
            return $errors;
        else
            return true;
    }

    ##################################### METHODES #####################################

    /**
     * Valide les paramètres avant la mise à jour d'une classe
     * @param array $params Paramètres à valider
     * @return array|bool Tableau des erreurs ou true si les paramètres sont valides
     */
    protected function updateValidation($params)
    {
        return static::insertValidation($params);
    }

    /**
     * Vérifie si un utilisateur appartient à la classe
     * @param int $userId ID de l'utilisateur ou objet User
     * @return bool true si l'utilisateur appartient à la classe, false sinon
     */
    public function hasUserId($userId)
    {
        $eleves = $this->eleves();
        return isset($eleves[$userId]);
    }

    /**
     * Vérifie si un utilisateur appartient à la classe
     * @param User $user utilisateur ou objet User
     * @return bool true si l'utilisateur appartient à la classe, false sinon
     */
    public function hasUser($user)
    {
        return $this->hasUserId($user->getId());
    }

    /**
     * Teste si le mot de passe fourni correspond à celui de la classe
     * @param string $pwd Mot de passe à tester
     * @return bool true si le mot de passe est correct, false sinon
     */
    public function testPwd($pwd)
    {
        return ($this->get('pwd') == $pwd);
    }

    /**
     * Récupère la liste des élèves appartenant à la classe
     * @return array Liste des objets User représentant les élèves
     */
    public function eleves()
    {
        return User::getList(array('classe' => $this->id));
    }
}

?>

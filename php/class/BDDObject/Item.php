<?php

namespace BDDObject;
use PDO;
use PDOException;
use ErrorController as EC;

abstract class Item
{
    /**
     * @var int|null Identifiant unique de l'item dans la base de données
     */
    protected $id = null;

    /**
     * @var string[]
     */
    protected static $idAttribute = ['id'];

    /**
     * @var array<string, mixed>|null
     */
    protected $values = null;

    /**
     * @var string Nom de la table en base de données
     */
    protected static $BDDName = "Item";

    /**
     * Tableau associatif définissant les types de données pour les colonnes de la table.
     * Les clés sont les types de données (integer, string, boolean, datetime, date)
     * et les valeurs sont les constantes PDO correspondantes.
     * @var array<string, int>
     */
    protected static $TYPES = array(
        'integer' => PDO::PARAM_INT,
        'string' => PDO::PARAM_STR,
        'boolean' => PDO::PARAM_BOOL,
        'datetime' => PDO::PARAM_STR,
        'date' => PDO::PARAM_STR
    );

    ##################################### METHODES STATIQUES #####################################

    /**
     * Retourne l'attribut identifiant de l'objet.
     * @return array<string>
     */
    protected static function idAttribute()
    {
        return [static::$BDDName.'.id'];
    }

    /**
     * Retourne les clés de l'objet.
     * @return array<string>
     */
    protected static function keys()
    {
        $arr = array_keys(static::champs());
        array_unshift($arr,"id");
        return $arr;
    }

    /**
     * Retourne la définition des champs de l'objet.
     * Les enfants doivent redéfinir cette méthode pour spécifier leurs champs.
     * @return array
     */
    protected static function champs()
    {
        /*
            items de la forme
            'key' => array(
                'def' => "",             // valeur par défaut
                'type'=> 'string', // type de donnée (string, integer, boolean, datetime, date)
                'foreign'=> 'table.key' // clé étrangère (optionnel)
                )
            )
        */
        return array();
    }

    /**
     * Retourne les tables jointes pour l'objet.
     * Les enfants peuvent redéfinir cette méthode pour spécifier leurs jointures.
     * @return array
     */
    protected static function joinedTables()
    {
        /*
            Permet aux classes enfants de définir des tables jointes.
            [
                "inner" => [                 // pour les inner join
                    "table à joindre" => "condition"
                ],
                "left" => [                    // pour les left join
                    "table à joindre" => "condition"
            ]
        */
        return array();
    }

    /**
     * Retourne les colonnes pour le group by.
     * Les enfants peuvent redéfinir cette méthode pour spécifier leurs colonnes.
     * @return array<string>
     */
    protected static function groupby()
    {
        /*
            Permet aux classes enfants de définir des colonnes pour le group by
            [
                "table1.key1",
                "table2.key2"
            ]
        */
        return array();
    }

    /**
     * Retourne les classes des objets enfants protégés (pour la suppression en cascade).
     * Ne permet la suppression que si pas d'enfants protégés.
     * @return array<string, string> Tableau associatif où les clés sont les tables enfants et les valeurs sont les colonnes de référence.
     */
    protected static function protectedChildren()
    {
        /*
            Renvoie les classes des objets enfants protégés (pour la suppression en cascade)
            ne permet la suppresssion que si pas d'enfants protégés
            "table" => "strangerId" // colonne de référence de l'objet dans la table enfant
        */
        return array();
    }

    /**
     * Génère la clause SELECT SQL à partir des champs de l'objet
     * en tenant compte des colonnes à cacher et des colonnes forcées
     * @param array<string> $hideCols Colonnes à cacher
     * @param array<string> $forcecols Colonnes à forcer
     * @return string
     */
    protected static function sqlGetFieldsNames($hideCols, $forcecols)
    {
        $champs = static::champs();
        $bddName = static::$BDDName;
        $keys = array();
        if (!isset($champs["id"]) && !in_array("id",$hideCols)) {
            $keys[] = "$bddName.`id`";
        }
        foreach ($champs as $key => $val) {
            if (in_array($key,$hideCols)) continue;
            if (isset($val['private']) && $val['private'] === true) continue;
            if (isset($val['alias'])) {
                $alias = $val['alias'];
            } else {
                $alias = $key;
            }
            if (isset($val['sub'])) {
                $keys[] = $val['sub'] ." AS `$alias`";
            } else if (isset($val['foreign'])) {
                [$table, $col] = explode(".",$val['foreign']);
                if (isset($val['agregation'])) {
                    $def = isset($val['def']) ? $val['def'] : 0;
                    $keys[] = "COALESCE(".$val['agregation']."($table.`$col`), $def) AS `$alias`";
                } else {
                    $keys[] = "$table.`$col` AS `$alias`";
                }
            } else {
                if ($alias !== $key) {
                    $keys[] = "$bddName.`$key` AS `$alias`";
                } else {
                    $keys[] = "$bddName.`$key`";
                }
            }
        }
        foreach ($forcecols as $key) {
            $keys[] = static::$BDDName.".`$key`";
        }
        return implode(", ",$keys);
    }

    /**
     * Génère la clause JOIN SQL à partir des tables jointes.
     * Les tables jointes doivent être définies dans la méthode joinedTables.
     * @param string $type Type de jointure : inner | left
     * @return string
     */
    protected static function sqlGetJoin($type)
    {
        // type = inner | left
        if ($type !== "inner" && $type !== "left")
        {
            EC::addError("sqlGetJoin : type de jointure inconnu : $type");
            return "";
        }
        $join = "";
        $joined = static::joinedTables();
        if (!isset($joined[$type])) {
            return "";
        }
        foreach ($joined[$type] as $table => $condition)
        {
            if (strpos($table,":")!==false)
            {
                list($table, $alias) = explode(":",$table);
            }
            else
            {
                $alias = $table;
            }
            $join .= strtoupper($type)." JOIN ".PREFIX_BDD.$table." AS $alias ON $condition ";
        }
        return $join;
    }

    /**
     * Génère la clause WHERE SQL à partir d'un tableau de conditions
     * @param array $wheres : tableau associatif key => value ou key est de la forme table.col ou col
     */
    protected static function sqlGetWhere($wheres)
    {
        $champs = static::champs();
        $whereItems = [];
        foreach ($wheres as $key => $value)
        {
            $operator = is_array($value) ? $value[0] : "=";
            if (strpos($key,".")!==false)
            {
                [$t1, $c1] = explode(".",$key);
                $whereItems[] = "$t1.`$c1` $operator :".str_replace(".","_",$key);
                continue;
            }
            if (isset($champs[$key]))
            {
                if (isset($champs[$key]['alias']))
                {
                    $alias = $champs[$key]['alias'];
                    $whereItems[] = "`$alias` $operator :$key";
                    continue;
                }
                if (isset($champs[$key]['foreign']))
                {
                    // clé étrangère
                    [$table, $col] = explode(".",$champs[$key]['foreign']);
                    $whereItems[] = "$table.`$col` $operator :$key";
                    continue;
                }
            }
            $whereItems[] = static::$BDDName.".`$key` $operator :$key";
        }
        if (count($whereItems) > 0)
        {
            return "WHERE ".implode(" AND ",$whereItems);
        }
        else
        {
            return "";
        }
    }

    /**
     * Complète le nom d'un champ avec le nom de la table si nécessaire
     * @param string $col Nom du champ
     * @return string Nom complet du champ avec le nom de la table si nécessaire
     */
    protected static function completeFieldName($col)
    {
        if (strpos($col,".")===false) {
            return static::$BDDName.".`$col`";
        } else {
            return $col;
        }
    }

    /**
     * Génère la clause SELECT SQL à partir des champs de l'objet
     * en tenant compte des colonnes à cacher et des colonnes forcées
     * @param array<string> $hideCols Colonnes à cacher
     * @param array<string> $forcecols Colonnes à forcer
     * @return string
     */
    protected static function sqlGetSELECT($hideCols, $forcecols)
    {
        $bddName = static::$BDDName;
        $prefixedBddName = PREFIX_BDD.static::$BDDName;
        $fields = static::sqlGetFieldsNames($hideCols, $forcecols);
        $innerJoined = static::sqlGetJoin("inner");
        $leftJoined = static::sqlGetJoin("left");
        return "SELECT $fields FROM ($prefixedBddName AS $bddName $innerJoined $leftJoined)";
    }

    /**
     * Génère la clause GROUP BY SQL à partir des colonnes définies dans la méthode groupby() de l'objet
     * @return string Clause GROUP BY SQL ou chaîne vide si aucune colonne n'est définie
     */
    protected static function sqlGetGROUPBY()
    {
        $groupby = static::groupby();
        if (count($groupby) === 0) {
            return "";
        }
        $cols = array_map(function($col){
            return static::completeFieldName($col);
        }, $groupby);
        return " GROUP BY ".implode(", ", $cols);
    }


    /**
     * Génère un tableau associatif pour la clause WHERE à partir d'un identifiant
     * @param int|string $id Identifiant unique ou composite (séparé par "_")
     * @return array|null Tableau associatif clé => valeur pour la clause WHERE ou null en cas d'erreur
     */
    public static function whereForId($id)
    {
        $idAttribute = static::idAttribute();
        if (is_int($id) || ctype_digit($id)) {
            if (count($idAttribute) == 1) {
                return [$idAttribute[0] => (int) $id];
            } else {
                EC::addError("whereForId : identifiant multiple attendu.");
                return null;
            }
        } else {
            $ids = explode("_", $id);
            if (count($ids) != count($idAttribute)) {
                EC::addError("whereForId : nombre d'identifiants incorrect.");
                return null;
            }
            $wheres = [];
            foreach ($idAttribute as $index => $col) {
                $wheres[$col] = (int) $ids[$index];
            }
            return $wheres;
        }
    }

    /**
     * Récupère la liste des enregistrements correspondant aux filtres spécifiés
     * @param array<string, mixed> $filter Tableau associatif des filtres (wheres, hideCols, forcecols, orderby)
     * @return array Résultat de la requête SQL sous forme de tableau associatif
     */
    public static function getList($filter = [])
    {
        $args = ["wheres", "hideCols", "forcecols", "orderby"];
        foreach ($filter as $key => $value) {
            if (!$key) {
                EC::addError("getList : clé vide dans le filtre.");
                return array("error"=>true, "message"=>"getList : clé vide dans le filtre");
            }
            if (!in_array($key, $args)) {
                EC::addError("getList : argument de filtre inconnu : $key.");
                return array("error"=>true, "message"=>"getList : argument de filtre inconnu : $key");
            }
        }
        if (isset($filter['wheres'])) $wheres = $filter['wheres']; else $wheres = array();
        if (isset($filter['hideCols'])) $hideCols = $filter['hideCols']; else $hideCols = array();
        if (isset($filter['forcecols'])) $forcecols = $filter['forcecols']; else $forcecols = array();
        if (isset($filter['orderby'])) $orderby = "ORDER BY ".$filter['orderby']; else $orderby = "";
        $where = static::sqlGetWhere($wheres);
        $groupby = static::sqlGetGROUPBY();
        require_once BDD_CONFIG;
        try {
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $select = static::sqlGetSELECT($hideCols, $forcecols);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $stmt = $pdo->prepare("$select $where $groupby $orderby");
            foreach ($wheres as $k => $v) {
                $val = is_array($v) ? $v[1] : $v;
                $stmt->bindValue(
                    ":".str_replace(".", "_", $k),
                    (string) $val
                );
            }
            $stmt->execute();
            //EC::add($stmt->queryString, static::$BDDName."/getList");
            $bdd_result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch(PDOException $e) {
                    EC::addBDDError($e->getMessage(), static::$BDDName."/getList");
                    EC::addBDDError($stmt->queryString, static::$BDDName."/getList");
                    return array("error"=>true, "message"=>$e->getMessage());
            }
            return $bdd_result;
    }

    /**
     * Récupère un objet correspondant à l'identifiant spécifié
     * @param int|string $idInput Identifiant unique ou composite (séparé par "_")
     * @return static|null Objet correspondant ou null si non trouvé
     */
    public static function getObject($idInput)
    {
        $wheres = static::whereForId($idInput);
        if ($wheres === null) {
            return null;
        }
        $idKeys = array_keys($wheres);
        $ids = array_values($wheres);
        $tagToId = [];
        $arrStrWheres = [];
        foreach ($idKeys as $index => $col) {
            $arrStrWheres[] = "$col = :id$index";
            $tagToId[":id$index"] = (int) $ids[$index];
        }
        $strWheres = implode(" AND ", $arrStrWheres);
        require_once BDD_CONFIG;
        try {
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $select = static::sqlGetSELECT([], []);
            $stmt = $pdo->prepare("$select WHERE $strWheres");
            foreach ($tagToId as $key => $value) {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            }

            $stmt->execute();
            $bdd_result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($bdd_result === null) return null;
            $item = new static($bdd_result);
            return $item;
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage(),static::$BDDName."/getObject");
        }
        return null;
    }

    /**
     * Filtre les valeurs avant l'insertion dans la base de données
     * @param array<string, mixed> $values Valeurs à insérer
     * @return array<string, mixed> Valeurs filtrées
     */
    protected static function filterInsert($values)
    {
        $champs = static::champs();
        $toInsert = array_intersect_key($values, $champs);
        unset($toInsert['id']);
        foreach ($champs as $key => $value) {
            if ($value['foreign'] ?? false) {
                // champ de jointure, on ne l'insère pas
                unset($toInsert[$key]);
            }
        }
        return $toInsert;
    }
    
    /**
     * Filtre les valeurs avant la mise à jour dans la base de données
     * @param array<string, mixed> $params Nouvelles valeurs à mettre à jour
     * @param static $current Objet actuel représentant l'état actuel dans la base de données
     * @return array<string, mixed> Valeurs filtrées pour la mise à jour
     */
    protected static function filterUpdate($params, $current)
    {
        $toUpdate = array_intersect_key($params, static::champs());
        unset($toUpdate['id']);
        $parsed = static::parse($params);
        $champs = static::champs();
        foreach ($toUpdate as $key => $value) {
            if ($champs[$key]['foreign'] ?? false) {
                // champ de jointure, on ne l'insère pas
                unset($toUpdate[$key]);
            }
            $parsedValue = $parsed[$key] ?? null;
            if ($parsedValue === $current->get($key)) {
                unset($toUpdate[$key]);
            }
        }
        return $toUpdate;
    }

    /**
     * Valide les valeurs avant l'insertion dans la base de données
     * @param array<string, mixed> $params Valeurs à insérer
     * @return bool|array true si les valeurs sont valides, tableau d'erreurs sinon
     */
    protected static function insertValidation($params)
    {
        return true;
    }

    /**
     * Parse les valeurs en fonction des types définis dans les champs
     * @param array<string, mixed> $params Valeurs à parser
     * @return array<string, mixed> Valeurs parsées
     */
    public static function parse($params=array())
    {
        $values = array();
        foreach ( $params as $key => $value) {
            $type = static::champs()[$key]['type'] ?? "";
            switch ($type)
            {
            case "integer":
                $values[$key] = (int) $value;
                break;
            case "string":
                $values[$key] = (string) $value;
                break;
            case "boolean":
                $values[$key] = (bool) $value;
                break;
            case "datetime":
                $values[$key] = $value;
                break;
            case "date":
                $values[$key] = $value;
                break;
            default:
                $values[$key] = $value;
            }
        }
        return $values;
    }

    ##################################### METHODES #####################################

    /**
     * Constructeur de l'objet BDD
     * @param array<string, mixed> $options Valeurs initiales pour l'objet
     */
    public function __construct($options=array())
    {
        $this->values = static::parse($options);
        $arr = static::champs();
        foreach ($arr as $key => $val) {
            if (!array_key_exists($key,$this->values)) {
                $this->values[$key] = $val["def"];
            }
        }
        if (isset($options["id"])) {
            $this->id = (int) $options["id"];
            $this->values["id"] = $this->id;
        }
    }

    /**
     * Retourne une représentation sous forme de chaîne de l'objet BDD
     * @return string Représentation sous forme de chaîne de l'objet BDD
     */
    public function __toString()
    {
        if ($this->id!==null) {
            return static::$BDDName."@".$this->id;
        } else {
            return static::$BDDName."@?";
        }
    }

    /**
     * Méthode appelée après une mise à jour réussie
     * à surcharger dans les classes enfants si nécessaire.
     * @return bool Toujours true
     */
    protected function onUpdateSuccess() {
        // Méthode appelée après une mise à jour réussie
        return true;
    }

    /**
     * Méthode appelée après une insertion réussie
     * à surcharger dans les classes enfants si nécessaire.
     * @return bool Toujours true
     */
    protected function onInsertSuccess() {
        // Méthode appelée après une insertion réussie
        return true;
    }

    /**
     * Méthode appelée après une suppression réussie
     * à surcharger dans les classes enfants si nécessaire.
     * @return bool Toujours true
     */
    protected function onDeleteSuccess() {
        // Méthode appelée après une suppression réussie
        return true;
    }

    /**
     * Vérifie si l'objet peut être supprimé
     * @return bool true si l'objet peut être supprimé, false sinon
     */
    protected function okToDelete()
    {
        // Vérifie si l'objet peut être supprimé (enfants, etc.)
        $children = static::protectedChildren();
        foreach ($children as $table => $strangerId) {
            require_once BDD_CONFIG;
            try {
                $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $stmt = $pdo->prepare("SELECT id FROM ".PREFIX_BDD.$table." WHERE $strangerId = :id");
                $stmt->bindValue(':id', $this->id, PDO::PARAM_INT);
                $stmt->execute();
                if ($stmt->rowCount() > 0) {
                    EC::addError(static::$BDDName."/delete : Impossible de supprimer l'objet car il a des enfants dans la table $table.");
                    return false;
                }
            } catch(PDOException $e) {
                EC::addBDDError($e->getMessage(), static::$BDDName."/okToDelete");
                return false;
            }
        }
        return true;
    }

    /**
     * Supprime l'objet de la base de données
     * @return bool true si la suppression a réussi, false sinon
     */
    public function delete()
    {
        if (!$this->okToDelete()) {
            EC::addError(static::$BDDName."/delete : L'objet a des enfants impossibles à supprimer.");
            return false;
        }

        /*
        if (!$this->deleteChildren()) {
            EC::addError(static::$BDDName."/delete : Impossible de supprimer les enfants.");
            return false;
        }
        */

        require_once BDD_CONFIG;
        /*
        $this->customDelete();
        */
        try {
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $stmt = $pdo->prepare("DELETE FROM ".PREFIX_BDD.static::$BDDName." WHERE id = :id");
            $stmt->execute(array(':id' => $this->id));
            EC::add("Item supprimé avec succès.");
            $this->onDeleteSuccess();
            return true;
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage(), static::$BDDName."/delete");
            return false;
        }
    }

    /**
     * Insère l'objet dans la base de données
     * @return int|null ID de l'objet inséré ou null en cas d'erreur
     */
    public function insert()
    {
        $values = $this->values;
        $valid = static::insertValidation($values);
        if ($valid !== true) {
            return array("errors" => $valid);
        }
        $toInsert = static::filterInsert($values);

        if (count($toInsert) === 0) {
            EC::add(static::$BDDName."/insert : Aucune donnée à insérer.");
            return false;
        }

        require_once BDD_CONFIG;
        try {
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $champs = implode(", ", array_map(function($k){ return "`$k`"; }, array_keys($toInsert)));
            $tokens_values = implode(", ", array_map(function($k){ return ":$k"; }, array_keys($toInsert)));
            $stmt = $pdo->prepare("INSERT INTO ".PREFIX_BDD.static::$BDDName." ( $champs ) VALUES ( $tokens_values )");
            foreach ($toInsert as $k => $v) {
                $champs = static::champs();
                if (isset($champs[$k]) && isset($champs[$k]['type']))
                {
                    $type = static::$TYPES[$champs[$k]['type']] ?? PDO::PARAM_STR;
                } else {
                    $type = PDO::PARAM_STR;
                }
                $stmt->bindValue(":$k", $v, $type);
            }
            $stmt->execute();
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage(), static::$BDDName."/insert");
            EC::addError(" Requete : ".$stmt->queryString);
            return null;
        }
        $this->id=$pdo->lastInsertId();
        $this->values["id"] = $this->id;
        EC::add($this." créé avec succès.");
        $this->onInsertSuccess();
        return $this->id;
    }

    /**
     * Valide les valeurs avant la mise à jour dans la base de données
     * Méthode à surcharger dans les classes enfants si nécessaire.
     * @param array<string, mixed> $params Valeurs à mettre à jour
     * @return bool|array true si les valeurs sont valides, tableau d'erreurs sinon
     */
    protected function updateValidation($params)
    {
        return true;
    }

    /**
     * Met à jour l'objet dans la base de données
     * @param array<string, mixed> $params Valeurs à mettre à jour
     * @param bool $updateBDD Indique si la mise à jour doit être effectuée dans la base de données
     * @return bool|array true si la mise à jour a réussi, tableau d'erreurs sinon
     */
    public function update($params=array(),$updateBDD=true)
    {
        if ($this->id===null) {
            EC::addDebugError(static::$BDDName."/update : Id manquant.");
            return false;
        }

        $params = $this->parse($params);

        // vérifie que les valeurs proposées sont valides
        $valid = $this->updateValidation($params);
        if ($valid !== true) {
            return array("errors" => $valid);
        }
        // filtre les modifications
        $params = static::filterUpdate($params, $this);
        if (count($params) === 0) {
            EC::add(static::$BDDName."/update : Aucune modification.");
            return $this->onUpdateSuccess();
        }
        // applique les modifications à l'objet
        $this->values = array_merge($this->values, $params);
        if (!$updateBDD) {
            EC::add(static::$BDDName."/update : Succès.");
            return true;
        }
        require_once BDD_CONFIG;
        try{
            $pdo=new PDO(BDD_DSN,BDD_USER,BDD_PASSWORD);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $modifications = implode(", ", array_map(function($k){ return "`$k`=:$k"; }, array_keys($params)));
            $stmt = $pdo->prepare("UPDATE ".PREFIX_BDD.static::$BDDName." SET $modifications WHERE id = :id");
            foreach ($params as $k => $v) {
                $stmt->bindValue(":$k", $v, static::$TYPES[static::champs()[$k]['type']] ?? PDO::PARAM_STR);
            }
            $stmt->bindValue(':id', $this->id, PDO::PARAM_INT);
            $stmt->execute();
        } catch(PDOException $e) {
            EC::addBDDError($e->getMessage(), static::$BDDName."/update");
            return false;
        }
        EC::add(static::$BDDName."/update : Succès.");
        return $this->onUpdateSuccess();
    }

    /**
     * Récupère l'ID de l'objet
     * @return int|null ID de l'objet ou null si inexistant
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Récupère la valeur d'un champ
     * @param string $key Nom du champ
     * @return mixed|null Valeur du champ ou null si inexistant
     */
    public function get($key)
    {
        return $this->values[$key] ?? null;
    }

    /**
     * Définit la valeur d'un champ
     * @param string $key Nom du champ
     * @param mixed $value Valeur à définir
     * @return $this
     */
    public function set($key, $value)
    {
        $this->values[$key] = $value;
        return $this;
    }

    /**
     * Récupère toutes les valeurs de l'objet
     * @return array<string, mixed> Tableau associatif des valeurs de l'objet
     */
    public function getValues()
    {
        return $this->values;
    }

    /**
     * Convertit l'objet en tableau en excluant les champs privés
     * @return array<string, mixed> Tableau associatif des valeurs publiques de l'objet
     */
    public function toArray()
    {
        $champs = static::champs();
        return array_filter(
            $this->values,
            function($key) use ($champs) {
                return !isset($champs[$key]) || !isset($champs[$key]['private']) || $champs[$key]['private'] !== true;
            },
            ARRAY_FILTER_USE_KEY
        );
    }
}
?>

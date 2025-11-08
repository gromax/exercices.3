<?php

namespace BDDObject;

final class Exercice extends Item
{
    protected static $BDDName = "exercices";

    ##################################### METHODES STATIQUES #####################################

    protected static function champs()
    {
        return [
            'idOwner' => ['def' => 0, 'type'=> 'int'],       // id du propriétaire de l'exercice
            'nomOwner' => ['def' => "", 'type'=> 'string', 'foreign' => 'users.nom'], // nom du propriétaire de l'exercice
            'title' => ['def' => "", 'type'=> 'string'],        // nom de l'exercice
            'keywords' => ['def' => "", 'type'=> 'string'],   // mots-clés de l'exercice
            'description' => ['def' => "", 'type'=> 'string'], // descriptif de l'exercice
            'options' => ['def' => "", 'type'=> 'string'],   // options de l'exercice (json)
            'init' => ['def' => "", 'type'=> 'string'],      // code d'initialisation (json)
            'code' => ['def' => "", 'type'=> 'string'],      // code de l'exercice (json)
            'published' => ['def' => false, 'type'=> 'boolean'],      // publié ou non
        ];
    }

    protected static function joinedTables()
    {
        return [
            'inner' => [ 'users' => 'exercices.idOwner = users.id' ]
        ];
    }

    ##################################### METHODES #####################################
}

?>

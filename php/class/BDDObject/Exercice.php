<?php

namespace BDDObject;

final class Exercice extends Item
{
    protected static $BDDName = "exercices";

    ##################################### METHODES STATIQUES #####################################

    protected static function champs()
    {
        return array(
            'idOwner' => array( 'def' => 0, 'type'=> 'int'),       // id du propriétaire de l'exercice
            'nomOwner' => array( 'def' => "", 'type'=> 'string',
                'join'=>array('table'=>'users', 'col'=>'nom', 'strangerId'=>'idOwner')), // nom du propriétaire de l'exercice
            'title' => array( 'def' => "", 'type'=> 'string'),        // nom de l'exercice
            'keywords' => array( 'def' => "", 'type'=> 'string'),   // mots-clés de l'exercice
            'description' => array( 'def' => "", 'type'=> 'string'), // descriptif de l'exercice
            'options' => array( 'def' => "", 'type'=> 'string'),   // options de l'exercice (json)
            'init' => array( 'def' => "", 'type'=> 'string'),      // code d'initialisation (json)
            'code' => array( 'def' => "", 'type'=> 'string'),      // code de l'exercice (json)
            );
    }

    ##################################### METHODES #####################################
}

?>

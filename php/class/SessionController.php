<?php

final class SessionController
{
    /* Attribut en private (car classe final) et seul $session (l'instance unique de la classe) en static */

    private static $session = null;
    private $session_started = false;
    private $session_name = 'sid';

    ##################################### METHODES STATIQUES #####################################

    /* Constructeur en private pour empécher l'instanciation directe */

    private function __construct($start)
    {
        if( $start ) $this->start();
    }

    ##################################### METHODES #####################################

    /* Démarrer une session */

    public function start ()
    {
        // Si la session est déjà démarrée, on ne fait rien
        if ($this->isStarted ()) return;

        // Sinon on renomme la session
        $this->rename ();

        // Puis on la démarre
        session_start ();
        $this->session_started = true;

        // Régénération de l'id de session (protection des sessions propagées par url)
        $this->regenerate ();
    }

    /* Détruire une session */

    public function destroy ()
    {
        // Si aucune session n'est démarrée on ne fait rien
        if (!$this->session_started) return;
        //if (!$this->session_started) $this->start();

        // On vide le tableau $_SESSION
        session_unset ();
        $_SESSION = array ();

        // On détruit la session
        session_destroy ();
        setcookie (session_name () , '');

        // On met $session_started à false
        $this->session_started = false;
    }

    /* Régénérer l'ID de session */

    public function regenerate ()
    {
        // Efface aussi les fichiers liés à l'ancien id
        session_regenerate_id (true);
    }

    /* Renomme la session */

    public function rename ()
    {
        if (session_name () == $this->session_name) return;

        setcookie (session_name (), '');
        session_name ($this->session_name);
    }

    /* Savoir si une session est démarrée */

    public function isStarted ()
    {
        return $this->session_started;
    }

    /* Savoir si le tableau $_SESSION est vide */

    public function isEmpty ()
    {
        return empty($_SESSION);
    }


}

?>

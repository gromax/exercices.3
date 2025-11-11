<?php
    function autoloadMyClass($className) {
        $className = str_replace('\\', DIRECTORY_SEPARATOR, $className);
        $filename = PATH_TO_CLASS."/". $className . ".php";
        if (is_readable($filename)) {
            require_once $filename;
        }
    }

    spl_autoload_register("autoloadMyClass");
?>

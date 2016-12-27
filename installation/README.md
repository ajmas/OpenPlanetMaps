OpenPlanetMaps Installer
========================

This is the installer for OpenPlanetMaps. The current implementation
is written in NodeJS and leverages ImageMagick, to generate tiles
that can be served up by a web server, such as Apache. Future versions
may provide an option to deploy to an map server.



MacOS X with MacPorts
---------------------

First modify the config.json to use the correct file paths. Take
into account that you may need a lot of room for both the cache
and build files.

    sudo port install imagemagick
    sudo port install nodejs6
    sudo port install npm3
    npm install
    npm start


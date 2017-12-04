OpenPlanetMaps Installer
========================

This folder is the installer for OpenPlanetMaps. The installer
will process the configuration in sister folder, downloading
the assets and then generate the tiles.

Some of the assets can be very large, so ensure you have plenty of space (100GB is probably sufficient) and time, since this likely take a while.

## First Steps

  - Ensure you have installed the following external dependencies:
    - gdal
    - gdal Python bindings
    - python 2.7 or above
    - pip

  - Install the dependencies:
    ```./scripts/install-deps.sh```
    
    Note, to avoid requiring 'root' permissions the above script
    is configured to install python dependencies in the user's
    home folder location.

## Running the installer

Just before running check that config.json is tuned to use the
right locations for your project.

If all the dependencies were properly installed, then you will
be able to run the installer as follows:

    python ./install.py








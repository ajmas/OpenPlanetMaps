![Open Planet Maps](public/img/logo.png)

[![Join the chat at https://gitter.im/OpenPlanetMaps/Lobby](https://badges.gitter.im/OpenPlanetMaps/Lobby.svg)](https://gitter.im/OpenPlanetMaps/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Open Planet Maps
================

The project should be treated as being in an alpha state.

The current aim of the project is to build a map server dedicated to
providing map layers for the surfaces of known astral bodies, such as
the Sun, the planets and the various non-man-made satellites. 

The data the project depends on should be of an open nature, whether
that is public domain, creative commons or an alternative license that
allows use in a non-commercial context.

The current design assumption of the project is to provide a collection
of JSON files that indicate the location of the source map data, along
suitable metadata and then have a script that fetches the source map
data and then via a script prepare the content for distribution.

This is still very much a work in progress and not ready for deployment.

Installation
------------

Requirements:

  - Python
    - provides the execution environment
  - Imagemagick
    - provides convert command, used by `tile_generator.py`
  - GDAL
    - provides ogr2ogr, used by `kmz2geojson.py`

You'll need to run the installer/install.py Python script, first ensuring you have at least 10GB of storage, for both downloaded files and generated tiles.

Check the installer/config.json for installation paths. This will result in a folder containing the basic viewer and the
generated tiles. This will take some time, as the source files can be large.

Contribution & Collaboration
----------------------------

This is a project that is being done in available time and is not sponsored.
If you would like to contribute or collaborate in any way, then the best place
to start is on the OpenPlanetMaps channel on Gitter.

You should note that I am not a cartographer, so everything up to here is based
on a best effort, as I have researched things on the net. There is is certainly
plenty of ways in which this can be improved. 
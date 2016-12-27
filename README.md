![Open Planet Maps](public/img/logo.png)

[![Join the chat at https://gitter.im/OpenPlanetMaps/Lobby](https://badges.gitter.im/OpenPlanetMaps/Lobby.svg)](https://gitter.im/OpenPlanetMaps/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Open Planet Maps
================

[![Join the chat at https://gitter.im/OpenPlanetMaps/Lobby](https://badges.gitter.im/OpenPlanetMaps/Lobby.svg)](https://gitter.im/OpenPlanetMaps/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

The current aim of the project is to build a map server dedicated to providing map
layers for the surfaces of known astral bodies, such as the sun, the planets and
the various non-man made satellites. 

The data the project depends on should be of an open nature, whether that is public
domain, creative commons or an alternative license that allows use in a non-commercial
context.

The current design assumption of the project is to provide a collection of JSON files that indicate the location of the source map data, along suitable metadata and then
have a script that fetches the source map data and then via a script prepare the
content for distribution.

This is still very much a work in progress and not ready for deployment.

Installation
------------

Currently the idea is to run a NodeJS tool, located in the 'installation' directory to run through the configuration in the 'conf' folder and then merge that with the contents of the 'public' folder and place the results in a generate build folder, such that

    build/   
      - index.html   ...  Sample viewer, using LeafletJS
      - css/         ...  CSS to support viewer
      - img/         ...  images to support viewer
      - js/          ...  Javascript to support viewer
      - tiles/       ...  The tiles and the JSON data
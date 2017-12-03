"""
This module is used to do handle the tile generation logic.
The current version simply delegates the work to gdal2tiles.py
"""
from __future__ import print_function
import os
from subprocess import call
#from osgeo import gdal, osr

def log(text):
    """ logging output """
    print(text)

def mkdir(path, mode=0o777):
    """ creates the specified path if it does
        not exist """
    if not os.path.exists(path):
        os.makedirs(path, mode)

def process(src_file, output_dir, min_zoom=0, max_zoom=1, planet_radius_km=6371):
    """ Generate the images tiles for various zoom levels, using the
        src_file for input and the output_dir for ouput. """

    command = ['tools/gdal2tiles.py', '-l', '-p', 'raster',
               '-w', 'none', src_file, output_dir]

    return call(command)

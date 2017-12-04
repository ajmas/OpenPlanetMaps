"""
Converts KMZ data into geojson
"""
from __future__ import print_function
from subprocess import call
import zipfile
import tempfile
import shutil

def convert(src_file, out_file):
    """converts a kmz file to a geojson file"""

    #Since a kmz is a zip file, we need to unzip it to get to the kml inside
    zip_ref = zipfile.ZipFile(src_file, 'r')
    dirpath = tempfile.mkdtemp()
    zip_ref.extractall(dirpath)
    zip_ref.close()

    command = ["ogr2ogr", '-f', 'GeoJSON', out_file, dirpath + '/doc.kml']
    call(command)

    #remove the temporary directory we created    
    shutil.rmtree(dirpath)

    return out_file

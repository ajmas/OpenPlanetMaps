## TODO Look at GDAL or https://isis.astrogeology.usgs.gov/Application/presentation/Tabbed/isis2std/isis2std.html

from subprocess import call

def convert(src_file, out_file):
    """converts a cub file to a tif file, with the help of gdal_translate"""
    return call(['gdal_translate', '-of', 'GTiff', '-co', '"TILED=YES"', src_file, out_file])

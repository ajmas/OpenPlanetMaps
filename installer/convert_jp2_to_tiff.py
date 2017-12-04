from subprocess import call

def convert(src_file, out_file):
    """converts a jp2 file to a tif file, with the help of imagemagick's convert tool"""
    return call(['gdal_translate', '-of', 'GTiff', '-co', '"TILED=YES"', src_file, out_file])
    ## return call(['convert', src_file, out_file])

from subprocess import call

def convert(src_file, out_file):
    """converts a kmz file to a geojson file"""
    return call(["ogr2ogr", '-f', 'GeoJSON', src_file, out_file])



import math
import os
from subprocess import call

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

    zoom_range = '%d-%d' % (min_zoom, max_zoom)

    return call(['tools/gdal2tiles.py', '-l', '-p', 'raster',
                 zoom_range, '-w', 'none', src_file, output_dir])

    # for zoom_level in range(min_zoom, max_zoom+1):
    #     tiles_per_side = int(math.pow(2, zoom_level))
    #     width = 256 * tiles_per_side
    #     height = width
    #     #planet_width_km = planet_radius_km * math.pi * 2
    #     #metres_per_pixel = (planet_width_km * 1000) / width

    #     zoom_dir = os.path.join(output_dir, str(zoom_level))
    #     mkdir(zoom_dir)

    #     ## Do the conversion with the assistance of Imagemagick's convert tool
    #     ## Also, ensure we provide settings for not running out of memory. Gigabyte
    #     ## files will do that.

    #     log('  Processing tiles for zoom ' + str(zoom_level))
    #     call(['convert', src_file, '-resize', str(width) + 'x' + str(height) + '!',
    #           '-limit', 'map', '0', '-limit', 'memory', '0',
    #           '-crop', '256x256', '-set', 'filename:tile', '%[fx:page.x/256+1]-%[fx:page.y/256+1]',
    #           '+repage', '+adjoin', os.path.join(zoom_dir, '%[filename:tile].jpg')])

    #     ## Loop through the images and arrange them such we can refer to them
    #     ## as basepath/z/x/y.jpg (z-axis, x-axis, y-axis)

    #     for x in range(0, tiles_per_side):
    #         mkdir(os.path.join(zoom_dir, str(x)))
    #         for y in range(0, tiles_per_side):
    #             os.rename(
    #                 os.path.join(zoom_dir, str(x+1) + '-' + str(y+1) + '.jpg'),
    #                 os.path.join(zoom_dir, str(x), str(y) + '.jpg')
    #             )


## ref: https://github.com/moagrius/TileView/wiki/Creating-Tiles

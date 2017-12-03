
from __future__ import print_function
from subprocess import call
import random
import string
import requests
import json
import os
import shutil
import argparse

import tile_generator
import kmz2geojson
import convert_cub_to_png
import convert_jp2_to_tiff

"""
This installer script takes care of going through the configuration
and downloading the assets as needed. For raster images they are
converted to tiles.

The general flow:
  - Create build folder
  - Copy base resources to build folder
  - Process celestial bodies
    - Creates destination folders
    - Create index file, copying in metadata as necessary
  - Process dataset types
    - Creates destination folders
    - Create index file, copying in metadata as necessary
  - Process datasets
    - Creates destination folders
    - Create index file, copying in metadata as necessary
    - Process artifcats
      - Download (or fetch from cache)
      - Convert

"""

VERSION = '0.5.0'

SUPPORTED_DATA_TYPES = ['feature', 'raster', 'vector']
KILIBYTE = 1024
MEGIBYTE = KILIBYTE * 1024
GIGIBYTE = MEGIBYTE * 1024
KILOBYTE = 1000
MEGABYTE = KILOBYTE * 1000
GIGABYTE = MEGABYTE * 1000

DEFAULT_QUALITY = 'low'

def log(text):
    """ logging output """
    print(text)


def format_bytes(size):
    """ formats value as divisions of 1024 """
    size = size * 1.0
    if size < KILIBYTE:
        return str(round(size, 0)) + 'b'
    elif size < MEGIBYTE:
        return str(round(size / KILIBYTE, 2)) + 'kib'
    elif size < GIGIBYTE:
        return str(round(size / MEGIBYTE, 2)) + 'Mib'
    else:
        return str(round(size / GIGIBYTE, 2)) + 'Gib'


def format_bytes_metric(size):
    """ formats value as divisions of 1000 """
    size = size * 1.0
    if size < KILOBYTE:
        return str(round(size, 0)) + 'b'
    elif size < MEGABYTE:
        return str(round(size / KILOBYTE, 2)) + 'kb'
    elif size < GIGABYTE:
        return str(round(size / MEGABYTE, 2)) + 'Mb'
    else:
        return str(round(size / GIGABYTE, 2)) + 'Gb'

# def convertKmzToGeojson(src_file, ):
#     return call(["ogr2ogr", '-f', 'GeoJSON', src_file, out_file])

# def get_path(x):
#     if 'layer' in x:
#         return x['layer']
#     else:
#         return ''

def mkdir(abs_path, mode=0o777):
    """ Creates the specified folder path if it does not exist """
    if (not os.path.exists(abs_path)):
        os.makedirs(abs_path, mode)

def resolve_path(base_path, requested_path):
    """ Resolves the requested_path against the base_path, if the
        requested_path is not absolute """
    if os.path.isabs(requested_path):
        return requested_path
    else:
        return os.path.join(base_path, requested_path)

def random_str(length=16):
    """ Generates a random string, defaulting to 16 characters in length """
    rand_str = lambda n: ''.join([random.choice(string.lowercase) for i in xrange(n)])
    return rand_str(length)

def download_resource(url, download_dir, force=False):
    """ Downloads the contents of the specified url to the download_dir,
        unless it already exists. If 'force' is set to True, then it will
        overwrite the file if it already exists.

        The function returns the path of the downloaded file. """

    filename = random_str()
    download = True

    if url.find('/'):
        filename = url.rsplit('/', 1)[1]

    path = os.path.join(download_dir, filename)

    headers = {'Range': 'bytes=%d-' % 0}
    response = requests.get(url, stream=True, allow_redirects=True, headers=headers)
    remote_filesize = float(response.headers['content-length'])

    # check to see if file exists and that the file sizes matches,
    # otherwise we will download
    if os.path.exists(path):
        local_filesize = os.stat(path).st_size
        download = local_filesize != remote_filesize
        ## TODO handle resuming download
        if local_filesize > 0:
            #response.connection.close()
            headers = {'Range': 'bytes=%d-' % local_filesize}
            #response = requests.get(url, stream=True, allow_redirects=True)
        

    # we donwload if we are either forced to or the above logic indicates
    # that we should download
    if download or force:
        print('downloading')
        output_file = open(path, 'wb')
        chunk_size = 1024
        total = 0
        
        for chunk in response.iter_content(chunk_size=chunk_size):
            if chunk: # filter out keep-alive new chunks
                total += chunk_size
                output_file.write(chunk)
                output_file.flush()
                print("\r" + 'received ... ' +
                      str(round((total * 1.0)/remote_filesize*100, 2)) + '% ' +
                      format_bytes(total) + ' of ' + format_bytes(remote_filesize) +
                      '   ', end='')
        print()
        output_file.flush()
        output_file.close()
    else:
        print('We already have ' + filename + ', will not download')

    response.connection.close()

    return path

def read_json(path):
    """ read json from file at specified path """
    try:
        with open(path) as json_data:
            return  json.load(json_data)
    except ValueError:
        raise ValueError("failed to parse data from " + path)

def write_json(path, data):
    """ write json to file at specified path """
    with open(path, 'w') as outfile:
        json.dump(data, outfile, sort_keys=True, indent=2)

def process_raster(abs_path, output_path, json_data, config):
    #pylint: disable=unused-argument
    """ Processes a raster (pixel based images) dataset directory """
    if not config['options'].features_only and not config['options'].vector_only:
        if 'source' in json_data:
            sources = json_data['source']
            if 'images' in sources:
                images = sources.get('images')
                for image in images:
                    if 'quality' in image and image.get('quality') == config['quality']:
                        cached_path = download_resource(image.get('url'),
                                                        resolve_path(config['base_folder'],
                                                                     config['cachePath']))

                        if not config['options'].download_only:
                            if cached_path.endswith('.cub'):
                                tif_cub = cached_path + '.tif'
                                convert_cub_to_png.convert(cached_path, tif_cub)
                                cached_path = tif_cub
                            elif cached_path.endswith('.jp2'):
                                tif_jp2 = cached_path + '.tif'
                                convert_jp2_to_tiff.convert(cached_path, tif_jp2)
                                cached_path = tif_jp2
                        
                            print('Creating map tile for planet/type/name [todo]')
                            tile_generator.process(cached_path, output_path)
            return True

def process_vector(abs_path, output_path, json_data, config):
    #pylint: disable=unused-argument
    """ Processes a vector dataset directory """
    #if not config['options'].features_only and not config['options'].raster_only:
    print('TODO vector ' + abs_path)
    return False

def process_features(abs_path, output_path, json_data, config):
    #pylint: disable=unused-argument
    """ Processes a feature dataset directory """
    #if not config['options'].vector_only and not config['options'].raster_only:
    print('TODO features ' + abs_path)
    return False

def process_dataset(abs_path, output_path, celestial_object, config):
    #pylint: disable=unused-argument
    """ TODO docs """
    json_data = None
    if os.path.exists(os.path.join(abs_path, 'index.json')):
        json_data = read_json(os.path.join(abs_path, 'index.json'))
        elements = abs_path.split('/')
        dataset_type = elements[len(elements)-2]
        # return json_data
        if dataset_type == 'raster':
            process_raster(abs_path, output_path, json_data, config)
            # print('xxxx ' + output_path)
            write_json(os.path.join(output_path, 'index.json'), json_data)
            #return json_data
        elif dataset_type == 'vector':
            #process_vector(abs_path, output_path, json_data, config)
            #return json_data
            json_data = None
        elif dataset_type == 'features':
            #process_features(abs_path, output_path, json_data, config)
            json_data = None
        else:
            print('Error: unknown dataset type ' + dataset_type)
            json_data = None


        print(json_data)

    return json_data



def process_datasets(abs_path, output_path, celestial_object, dataset_type, config):
    """ TODO docs """
    datasets = []
    all_layers = []
    for filename in  os.listdir(abs_path):
        child_path = os.path.join(abs_path, filename)
        if os.path.isdir(child_path):
            dataset = filename
            datasets.append(dataset)
            child_output_path = os.path.join(output_path, dataset)
            mkdir(child_output_path)
            print('Processing dataset ' + celestial_object + '/' + dataset)
            json_data = process_dataset(child_path, child_output_path, dataset, config)

            # return just the fields we want to appear in the main index
            if json_data:
                author = None
                link_to = None
                if 'author' in json_data:
                    author = json_data['author']
                if 'linkTo' in json_data:
                    link_to = json_data['linkTo']

                all_layers.append({
                    'name': json_data['name'],
                    'path': str(celestial_object) + '/' + dataset_type + '/' + str(dataset),
                    'type': dataset_type,
                    'license': json_data['license'],
                    'author': author,
                    'href': link_to,
                    })
    return all_layers

def process_celestial_object(abs_path, output_path, celestial_object, config):
    """ identifies the directories that represent the dataset types
        and then process them """
    dataset_types = []
    json_data = {}
    layer_data = []
    if os.path.exists(os.path.join(abs_path, 'index.json')):
        json_data = read_json(os.path.join(abs_path, 'index.json'))

    for filename in  os.listdir(abs_path):
        child_path = os.path.join(abs_path, filename)
        if os.path.isdir(child_path):
            dataset_type = filename
            dataset_types.append(dataset_type)
            child_output_path = os.path.join(output_path, dataset_type)
            mkdir(child_output_path)
            layer_data += process_datasets(child_path, child_output_path,
                                           celestial_object, dataset_type, config)

    json_data['layers'] = layer_data ## map(get_path, layer_data)
    write_json(os.path.join(output_path, 'index.json'), json_data)
    return json_data

def process_celestial_objects(abs_path, output_path, config):
    """ TODO docs
        :param str abs_path: Absolute path to the celestial object directory
        :param str abs_path: Absolute path to the output folder
        """
    celestial_objects = []
    for filename in  os.listdir(abs_path):
        child_path = os.path.join(abs_path, filename)
        if os.path.isdir(child_path):
            celestial_object = filename
            child_output_path = os.path.join(output_path, celestial_object)
            log('Processing data for ' + celestial_object)
            mkdir(child_output_path)
            data = process_celestial_object(child_path, child_output_path, celestial_object, config)

            ## Only add Celestial objects which have layers
            if data != None and 'layers' in data and data['layers']:
                name = celestial_object
                if 'name' in data:
                    name = data['name']
                celestial_objects.append({
                    'name': name,
                    'path': celestial_object
                    })

            log('')

    write_json(os.path.join(output_path, 'index.json'), {
        'entries': celestial_objects
    })

def process_static_assets(abs_path, output_path):
    """ Copy over the static assets, overwriting existing
        assets in the output_path """
    if os.path.exists(output_path):
        shutil.rmtree(output_path)
    shutil.copytree(abs_path, output_path)

def load_config(config_file):
    """ loads the base installer configuration and resolves the paths """
    if config_file is None:
        base_folder = os.path.dirname(os.path.realpath(__file__))
        config = read_json(os.path.join(base_folder, 'config.json'))
    else:
        base_folder = os.path.dirname(config_file)
        config = read_json(os.path.join(config_file))

    config['base_folder'] = os.path.abspath(base_folder)
    config['outputPath'] = resolve_path(base_folder, config['outputPath'])
    config['cachePath'] = resolve_path(base_folder, config['cachePath'])
    config['celestialDataPath'] = resolve_path(base_folder, config['celestialDataPath'])
    # config['buildPath'] = resolve_path(base_folder, config['buildPath'])
    config['staticAssetsPath'] = resolve_path(base_folder, config['staticAssetsPath'])

    if not 'quality' in config:
        config['quality'] = DEFAULT_QUALITY

    return config

def main():
    """ Main function, partly to be sure we aren't making variables
        unnecessarily global """

    version_str = ('OpenPlanetMaps tile generator ' + VERSION +
                   ' - http://openplanetmaps.org')

    parser = argparse.ArgumentParser(description=version_str)

    parser.add_argument('-d', '--download-only', action='store_true',
                        help='download files only, don\'t generate tiles')
    parser.add_argument('-c', '--config-file', metavar='CONFIG_FILE',
                        help='path to alternative configuration file')
    parser.add_argument('-f', '--features-only', action='store_true',
                        help='only process feature data types')
    parser.add_argument('-r', '--raster-only', action='store_true',
                        help='only process raster data types')
    parser.add_argument('-v', '--vector-only', action='store_true',
                        help='only process vector data types')
    parser.add_argument('--version', action='store_true',
                        help='display the version information')

    args = parser.parse_args()

    config = load_config(args.config_file)
    config['options'] = args


    if args.version:
        print(version_str)
        return

    ### Create output folder
    mkdir(config['outputPath'])

    ## Copy over the static assets from the 'public' folder
    print("Copying over static assets")
    ##process_static_assets(config['staticAssetsPath'],  config['outputPath'])

    ## Now process the rest
    process_celestial_objects(
        config['celestialDataPath'], config['outputPath'], config
        )

main()

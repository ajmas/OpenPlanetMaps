#!/bin/python
from __future__ import print_function
from subprocess import call
import random
import string
import requests
import json
import os

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
# import curses

# from stat import *

SUPPORTED_DATA_TYPES = ['feature', 'raster', 'vector']
KILIBYTE = 1024
MEGIBYTE = KILIBYTE * 1024
GIGIBYTE = MEGIBYTE * 1024
KILOBYTE = 1000
MEGABYTE = KILOBYTE * 1000
GIGABYTE = MEGABYTE * 1000
config = {}
quality = 'medium'

def log(text):
    print(text)


def formatBytes(size):
    size = size * 1.0
    if (size < KILIBYTE):
        return str(round(size,0)) + 'b'
    elif (size < MEGIBYTE):
        return str(round(size / KILIBYTE, 2)) + 'kib'    
    elif (size < GIGIBYTE):
        return str(round(size / MEGIBYTE, 2)) + 'Mib'   
    else:
        return str(round(size / GIGIBYTE, 2)) + 'Gib' 


def formatBytesMetric(size):
    size = size * 1.0    
    if (size < KILOBYTE):
        return str(round(size,0)) + 'b'
    elif (size < MEGABYTE):
        return str(round(size / KILABYTE, 2)) + 'kb'    
    elif (size < GIGABYTE):
        return str(round(size / MEGABYTE, 2)) + 'Mb'   
    else:
        return str(round(size / GIGABYTE, 2)) + 'Gb' 

def convertKmzToGeojson(src_file, ):
    return call(["ogr2ogr", '-f', 'GeoJSON', src_file, out_file])


def mkdir (path, mode=0o777):
    if (not os.path.exists(path)):
        os.makedirs(path, mode)

def resolve_path(base_path, requested_path):
    if (os.path.isabs(requested_path)):
        return requested_path
    else:
        return os.path.join(base_path,requested_path)

# def process_feature(path, output_path):

def random_str(len=16):
    rand_str = lambda n: ''.join([random.choice(string.lowercase) for i in xrange(n)])
    return rand_str(len) 

def download_resource(url, download_dir, force=False):
    # cache_path = resolve_path(config['cachePath']
    # window = curses.initscr()
    filename = random_str()
    if url.find('/'):
        filename = url.rsplit('/', 1)[1]
    path = os.path.join(download_dir, filename)
    print ('downloading from ' + url) 
    print ('downloading to ' + path)    
    ### TODO Chnage this to user streaming & iter_lines, so as
    ###      start writing chunks. This is important for large
    ###      files.
    if not os.path.exists(path):
        chunk_size=1024
        total = 0
        f = open(path, 'wb')
        r = requests.get(url, stream=True, allow_redirects=True)
        length = float(r.headers['content-length'])
        print ('length ...' + formatBytes(length) + ' ' + formatBytesMetric(length))
        for chunk in r.iter_content(chunk_size=chunk_size):
            if chunk: # filter out keep-alive new chunks
                total += chunk_size
                f.write(chunk)
                f.flush()
                print("\r" + 'received ... ' + str(round((total * 1.0)/length*100, 2)) + '%', end='')                # window.deleteln()
                # window.refresh()
        #open(path, 'wb').write(r.content)
        print()
        f.close()
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
        json.dump(data, outfile)

def process_dataset(path, output_path, celestial_object):
    json_data = {}
    if (os.path.exists(os.path.join(path, 'index.json'))):
        json_data = read_json( os.path.join(path, 'index.json'))
        # print(json_data)
        if ('source' in json_data):
            sources = json_data['source']
            if 'images' in sources:
                images = sources.get('images')            
                for image in images:
                    if 'quality' in image and image.get('quality') == quality:
                        print(resolve_path(base_folder, config['cachePath']))
                        download_resource(image.get('url'), resolve_path(base_folder, config['cachePath']))
                        print(image)


def process_datasets(path, output_path, celestial_object):
    datasets = []  
    for filename in  os.listdir(path):
        child_path = os.path.join(path,filename)
        if os.path.isdir(child_path):
           dataset = filename
           datasets.append(dataset)           
           child_output_path = os.path.join(output_path, dataset)
           log('     - ' + dataset)
           mkdir(child_output_path)
           process_dataset(child_path, child_output_path, dataset)
    
    write_json(os.path.join(output_path,'index.json'), {
        'contents': datasets
    })

def process_dataset_types (path, output_path, celestial_object):
    dataset_types = []  
    json_data = {}
    if (os.path.exists(os.path.join(path, 'index.json'))):
        json_data = read_json( os.path.join(path, 'index.json'))

    print(json_data)
    for filename in  os.listdir(path):
        child_path = os.path.join(path,filename)
        if os.path.isdir(child_path):
           dataset_type = filename
           dataset_types.append(dataset_type)
           child_output_path = os.path.join(output_path, dataset_type)
           log('   - ' + dataset_type)
           mkdir(child_output_path)
           process_datasets(child_path, child_output_path, dataset_type)

    json_data['contents'] = dataset_types
    write_json(os.path.join(output_path,'index.json'), json_data)

def process_celestial_objects (path, output_path):  
    celestial_objects = []  
    for filename in  os.listdir(path):
        child_path = os.path.join(path,filename)
        if os.path.isdir(child_path):
           celestial_object = filename
           celestial_objects.append(celestial_object)
           child_output_path = os.path.join(output_path, celestial_object)
           log(' - ' + celestial_object)
           mkdir(child_output_path)
           process_dataset_types(child_path, child_output_path, celestial_object)

    write_json(os.path.join(output_path,'index.json'), {
        'contents': celestial_objects
    })

base_folder = os.path.dirname(os.path.realpath(__file__))
parent_folder = os.path.join(base_folder,os.pardir)

config = read_json(os.path.join(base_folder,'config.json'))

### Create output folder
celestial_data_path = resolve_path(base_folder, config['celestialDataPath'])
output_path = resolve_path(base_folder, config['outputPath'])
mkdir(output_path, None)


print(config['outputPath'])
print(os.path.isabs(config['outputPath']))
print(resolve_path(base_folder, config['outputPath']))

process_celestial_objects(celestial_data_path, output_path)

#!/bin/sh

## Ensure we are in the right place to start off with
scripts_dir=`dirname $0`
cd "${scripts_dir}/"..

project_dir="${PWD}"

## Create the tools directory
if [ ! -d "tools" ]; then
   mkdir -p "tools"
fi

cd "${TMPDIR}"

echo "Retrieving tool depdencies"
if [ ! -d "gdal2tiles-leaflet" ]; then
   git clone https://github.com/commenthol/gdal2tiles-leaflet
fi 

echo "Installing tool dependencies"
cp gdal2tiles-leaflet/gdal2tiles.py "${project_dir}/tools/gdal2tiles.py"
chmod +x "${project_dir}/tools/gdal2tiles.py"

cd "${project_dir}"

echo "Installing Python packages"
pip install --user -r requirements.txt
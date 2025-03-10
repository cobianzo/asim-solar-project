# reset dist folder
rm -rf dist
mkdir dist

# create zip for coco map plugin
cd plugins/coco-gravity-form-map-field
node ./bin/build-plugin.js
cd ../..
cp plugins/coco-gravity-form-map-field/dist/coco-gravity-form-map-field.zip ./dist/coco-gravity-form-map-field.zip

# create zip for the solar-project plugin
cd plugins/solar-project
node ./bin/build-plugin.js
cd ../..
cp ./plugins/solar-project/dist/solar-project.zip ./dist/solar-project.zip

# open in finder the folder dist
open dist
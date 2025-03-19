# TODO NEXT

Make the solar panels editable on off
Make a command to rotate the solar panels
Make a notice message suite
Save the data from the rectangles and solar panels
Fix form back and fw.

# What 

- Dependencies : 
  `coco-gravity-form-map-field/`, (branch develop)
  `gravity-forms` (needs license) and API Key for Google Maps
  `solar-project` plugin, where I actively develop
- Sometimes I modify also the plugin `coco-gravity-form-map-field/`, to improve it  
- We develop both folders (the plugin and this one together)

# Setup the minimum project:

- In this project, we create a custom Gravity Form with 3 steps, every step needs a `coco-gravity-form-map-map` field (which an Add on developed by me included in as submodule repo in this project)
  - We need a license for Gravity Forms. http://localhost:8777/wp-admin/admin.php?page=gf_settings
  - We need to add an Google API Key and a Map ID in the GForms settings.
  - We have a xml form ready to import. However, here the instructions to create it yourself

  **The form edition**

  - The form has 3 steps. Every step has a `coco-map` field
  - The first step of the form, the user selects a roof with a marker
    - The map in step 1 must have the adminLabel === 'map-roof'  >> We select the roof with a marker
  - The second step the user sees the shape of the roof he just selected, the interaction type of this coco-map is ´Developer´
    - The map in step 2 must have the adminLabel === 'map-segments-offset' >> We apply offset position of the segments and rotate them if needed
    - The radio select in step 2, for the orientation of the segments 
must have the class === 'segment-rotation' AND the adminLabel  === 'segment-rotation'
    - That radio button must have two options, with values: `no-extra-rotation` and `rotate-90-only-portrait`
  - The 3rd step shows the disposition of the panels, (also interaction 'Developer')
    - The map in step 3 must have the adminLabel === 'map-rectangle'    

# Develop

  in this folder
  `npm run start` for wp scripts compilation into /build
    - In my case I must call the global command with `wp-env start`
  ~~`npm run bs`~~ for browser sync (not working)

## deploy of the work in a website

Export both plugins in the zip into `./dist`
`npm run plugins-zip`

  Sieglberg 31, Passau-Sieglgut, Germany

// California
37.4449739,-122.13914659999998

**In development env**
npx wp-env run cli wp db reset --yes
npx wp-env run cli wp core install --url="http://localhost:8777" --title="Mi Test Site WP" --admin_user="admin" --admin_password="password" --admin_email="admin@example.com"
npx wp-env run cli -- wp plugin activate coco-gravity-form-map-field gravityforms solar-project solar

# Testing playwright

npx wp-env run tests-cli wp db reset --yes
npx wp-env run tests-cli wp core install --url="http://localhost:8889" --title="Mi Test Site WP" --admin_user="admin" --admin_password="password" --admin_email="admin@example.com"
npx wp-env run tests-cli -- wp plugin activate coco-gravity-form-map-field gravityforms solar-project solar

# Testing unit test of js (jest)

npm run test:jest
or
cd plugins/solar && npm run test

# Testing PHPUnit

Still in WIP - I'm having problems the required files for phpunit to work are not installed with wp-env.
We need to have `/tmp/wordpress-tests-lib` installed, and it's not. I want to install it with the command `./bin/install-wp-tests.sh` but we require `svn` and it's not in the docker's container. It shouldnt be that difficult.

The DB inside the container of tests is 
`tests-wordpress`
user: 

# Debug and test in console

I have nicely exposed in console many functions, and you can expose more, to test visually some functions.
Check debug.ts. I expose the trigonometry functions, so you can call them with data, like this:
```
s0 = debug.getSegmentAsPoints(0); // gets the points of the segment with index 0.
s0 = debug.rotateRectangle(s0, 45); // paints the segment, and the paints the segment rotated 45 degrees
```
The rotateRectangle has been overwritten to paint a preview of the result in an overlay. You can do it with any other function to see the result or print in the screen any info, for example, the result of getInclinationByRectanglePoints(points) of the segment before and anfter the rotation.

# PHPCS

composer run-script lint plugins/solar-project/solar-project.php
para el plugin coco- ... you need to enter the project and see its README.


# Terminology:

- segment: when selecting a roof, Solar API provides several areas with radiance information. Everyone of them is a segment.
- rectangle: the user will draw a rectangle over the roof, which is the area where the panels will go. That's the rectangle
- azimuth: the angle of orientation of every segment, 0 degrees is set to North.
- building profile: Google Maps API gives the path of a polygon defining the shape of the roof.
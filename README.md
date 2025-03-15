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
  - The 3rd step shows the disposition of the panels, (also interaction 'Developer')
    - The map in step 3 must have the adminLabel === 'map-panelli'    

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

# Testing playwright

npx wp-env run tests-cli wp db reset --yes
npx wp-env run tests-cli wp core install --url="http://localhost:8889" --title="Mi Test Site WP" --admin_user="admin" --admin_password="password" --admin_email="admin@example.com"
npx wp-env run tests-cli -- wp plugin activate coco-gravity-form-map-field gravityforms solar-project solar


**In development env**
npx wp-env run cli wp db reset --yes
npx wp-env run cli wp core install --url="http://localhost:8777" --title="Mi Test Site WP" --admin_user="admin" --admin_password="password" --admin_email="admin@example.com"
npx wp-env run cli -- wp plugin activate coco-gravity-form-map-field gravityforms solar-project solar


# Testing PHPUnit

Still in WIP - I'm having problems the required files for phpunit to work are not installed with wp-env.
We need to have `/tmp/wordpress-tests-lib` installed, and it's not. I want to install it with the command `./bin/install-wp-tests.sh` but we require `svn` and it's not in the docker's container. It shouldnt be that difficult.

The DB inside the container of tests is 
`tests-wordpress`
user: 

# PHPCS

composer run-script lint plugins/solar-project/solar-project.php
para el plugin coco- ... you need to enter the project and see its README.


# Terminology:

- segment: when selecting a roof, Solar API provides several areas with radiance information. Everyone of them is a segment.
- rectangle: the user will draw a rectangle over the roof, which is the area where the panels will go. That's the rectangle
- azimuth: the angle of orientation of every segment, 0 degrees is set to North.
- building profile: Google Maps API gives the path of a polygon defining the shape of the roof.
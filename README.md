# What 

- Dependencies : 
  `coco-gravity-form-map-field/`, (branch develop)
  `gravity-forms` (needs license) and API Key for Google Maps
  `solar-project` plugin, where I actively develop
- Sometimes I modify also the plugin `coco-gravity-form-map-field/`, to improve it  
- We develop both folders (the plugin and this one together)
- In this project, we create a custom Gravity Form with 3 steps, every step needs a coco-map field
  - The first step of the form, the user selects a roof with a marker
  - The second step the user sees the shape of the roof he just selected, the interaction type of this coco-map is ´Developer´
  - The 3rd step shows the disposition of the panels, (also interaction 'Developer')
- The map in step 1 must have the adminLabel === 'map-roof'
- The map in step 2 must have the adminLabel === 'map-rectangle'
- The map in step 3 must have the adminLabel === 'map-panelli'

# Develop

  in this folder
  `npm run start` for wp scripts compilation into /build
  `npm run bs` for browser sync

## deploy of the work in a website

Export both plugins in the zip into `./dist`
`npm run plugins-zip`

  Sieglberg 31, Passau-Sieglgut, Germany

// California
37.4449739,-122.13914659999998

# PHPCS

composer run-script lint plugins/solar-project/solar-project.php
composer run-script format plugins/solar-project/solar-project.php


# Terminology:

- segment: when selecting a roof, Solar API provides several areas with radiance information. Everyone of them is a segment.
- rectangle: the user will draw a rectangle over the roof, which is the area where the panels will go. That's the rectangle
- azimuth: the angle of orientation of every segment, 0 degrees is set to North.
- building profile: Google Maps API gives the path of a polygon defining the shape of the roof.
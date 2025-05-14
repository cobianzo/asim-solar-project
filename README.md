
# TODO NEXT

Corregir error: You have included the Google Maps JavaScript API multiple times on this page. This may cause unexpected errors.

# TESTS 
Testear y confirmar que responda bien cuando no se encuentra un edificio.

Make sure kW are correct and they are not Watts.
Fix style last report.
Verify format of data in the entries.

When the offset in step 2 and the marker in step 1 are very faraway, it means that the building has changed.
We need 


DONE: Bugs: invert horizontal and vertical for rotated segments.
DONE: misure in mm
DONE: superficie panelli, deleted segment surface.
DONE: add space between pannelli.

DONE: Bugs: when changing length, height, power, we deactivate the Model.
DONE: Save data in form submitted
DONE: Add Save form in every step.
Add all PHP CS to all files.
Refactor code and sort it out better.
Add Playwright testing
When dragging and redimensioning the rect, hide the solar panels
Show in DB the data from the rectangles and solar panels
Fix form back and fw.
Message to mobile: not shown. Try to make it mobile friendly, with tap events
Install all development to Emiliano.

# What

- Dependencies :
  `coco-gravity-form-map-field/`, (branch develop)
  `gravity-forms` (needs license) and API Key for Google Maps
  `solar-project` plugin, where I actively develop
- Sometimes I modify also the plugin `coco-gravity-form-map-field/`, to improve it
- We develop both folders (the plugin and this one together)
- We need to setup the API for Solar and Google Maps, and the Map ID, and insert the values in the CMS
http://localhost:8777/wp-admin/options-general.php?page=coco_solar_settings
http://localhost:8777/wp-admin/admin.php?page=gf_settings&subview=coco-gravity-forms-map-addon
- The permalinks must be /%postname%/ . Make sure you flush the rules o resave the option. Otherwise the apr fetch to WP requests fail (like notification api)

# Setup the minimum project:

- In this project, we create a custom Gravity Form with 4 steps, The first 3 steps need a `coco-gravity-form-map-map` field (which is an Add on developed by me included in as git submodule repo in this project)

  - We need a license for Gravity Forms. http://localhost:8777/wp-admin/admin.php?page=gf_settings
  - We need to add an Google API Key and a Map ID in the GForms settings.
	- We need a Google Solar API Key to include in /wp-admin/options-general.php?page=coco_solar_settings
  - We have a .json gravity form ready to import (best option). However, here the instructions to create it yourself

  **The form edition**

  - The form has 3 steps. Every step has a `coco-map` field
  - The first step of the form, the user selects a roof with a marker
    - The map in step 1 must have the `adminLabel === 'map-roof'` >> We select the roof with a marker
  - The second step the user sees the shape of the roof he just selected, the interaction type of this coco-map is ´Developer´ - The map in step 2 must have the `adminLabel === 'map-segments-offset'` >> We apply offset position of the segments and rotate them if needed - The radio select in step 2, for the orientation of the segments
    must have the `class === 'segment-rotation'` AND the `adminLabel === 'segment-rotation'` - That radio button must have two options, with values: `no-extra-rotation` and `rotate-90-only-portrait`
  - The 3rd step shows the disposition of the panels, (also interaction 'Developer')
    - The map in step 3 must have the `adminLabel === 'map-rectangle'`
    - below the map in step 3 we need a gf textarea with adminLabel and class === 'saved-rectangles'

    -- More fields in step 3 gravity forms with class and adminLabel: 
    [...]
    --- `panel-length`
    --- `panel-height`
    --- `panel-length-gap`
    --- `panel-height-gap`
    --- `panel-power`
    --- `panel-efficiency`
		--- `panel-quantiles` radio buttons with scenarios from 0 - 10 values
    --- Dropdown of panels: allow dynamic content: param `panel_list`
  - The step 4 needs to have any field with class and adminLabel === 'power-calculations'

# Project Structure

- plugin.php contains only code for playwright testing. Creates the page Settings > Testing to create the page with the form quickly.
├── coco-gravity-form-map-field (the git submodule, you dont need to touch it)
└── solar-project
    ├── inc : All the php files. The add hooks to GF and expose JS vars used by our typescript scripts.
		├── src : The typescript files. All the code starts by the
					stepX_functions.ts , and the rest of .ts files contain the helpers.

For more info, see `AI-AGENT.md`.

# Develop

in this folder
`npm run dev` for wp scripts compilation into /build - It compiles also into the coco-gravity-form-map-field subproject, in case you modify something there.

`npm run bs` for browser sync

## deploy of the work in a website

Export both plugins in the zip into `./dist`
`npm run plugins-zip`

**In development env**

Reset the DB with this command. Later you can re seetup everything going to Settings > Testing and clicking the button to import the form again and create the main page.

```bash
sh ./bin/reset-db.sh
```

# Testing playwright

To reset the DB in test env
```bash
sh ./bin/reset-db.sh --test
```

Since we need to setup the plugin with the Google Places API, and Map Id, these need to be 
provided in an .env file, to be used in http://localhost:8777/wp-admin/options-general.php?page=testing-page

We created two simple Playwright tests, for step 1 and step 2. It's difficult to simulate the interaction with Google Maps, so we left it like this.

# Testing unit test of js (jest)

We created some js unit testing for the trigonmetry functions
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
Check `debug.ts`. I expose the trigonometry functions, so you can call them with data, like this:

```
s0 = debug.getSegmentAsPoints(0); // gets the points of the segment with index 0.
s0 = debug.rotateRectangle(s0, 45); // paints the segment, and the paints the segment rotated 45 degrees
```

The rotateRectangle has been overwritten to paint a preview of the result in an overlay. You can do it with any other function to see the result or print in the screen any info, for example, the result of getInclinationByRectanglePoints(points) of the segment before and anfter the rotation.

# EsList 

I set `npm run eslint` to format all the typescript FILEs in `solar-panel` plugin

# PHPCS and PHPCBF

`composer run-script lint plugins/solar-project/solar-project.php`
para el plugin coco- ... you need to enter the project and see its README.

# Terminology:

- segment: when selecting a roof, Solar API provides several areas with radiance information. Everyone of them is a segment.
- rectangle: the user will draw a rectangle over the roof, which is the area where the panels will go. That's the rectangle
	- savedRectangle: object that contains the data for a google.map.polygon rectangle drawn over the map. Contains info about the solarPanelsPolygons drawin inside of it.
- azimuth: the angle of orientation of every segment, 0 degrees is set to North.
- building profile: Google Maps API gives the path of a polygon defining the shape of the roof.


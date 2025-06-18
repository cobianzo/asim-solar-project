# TODO NEXT

## Communicazione 

- ⁠✅Traduzione del plugin ( vedrai la cartella /languages, si possono modificare i testi. Ci sono diverse tecniche, ti posso spiegare come. Anche chatgpt lo spiega molto bene)
- ⁠✅Ho aggiunto uno script di js aparte, scritto nel CMS di dev, per nascondere il marker che si vede la prima volta che si visita la pagina (cioe’ tu vai su
	- ⁠⁠https://dev.pannellisolariitalia.it/calcola-il-tuo-preventivo-per-i-panelli/
	- ⁠⁠e vedi la mappa dell’italia, con un puntino settato a Roma. Con il mio js, si cancella quel marker nel page load.
	- ⁠⁠ecco il codice lo trovi qui (e’ buono abituarsi a usare quei snippets per aggiungere questo tipo di modifiche semplici) https://dev.pannellisolariitalia.it/wp-admin/admin.php?page=wpcode-snippet-manager&snippet_id=488
- Volendo, puoi modificare lo zoom anche con JS (si puo' fare con PHP, ma forese piu' complesso). In quella pagina potresti usare, in JS:  `cocoMaps.input_9_3.map.setZoom(7) `, e ti amplia lo zoom per raggiungere tutta l'Italia.
•⁠  ⁠✅Cambio colore bottone top-left di geolocalizzazione. Il codice CSS en anche uno snippet, lo trovi qui: https://dev.pannellisolariitalia.it/wp-admin/admin.php?page=wpcode-snippet-manager&snippet_id=487

Poi un po' di considerazioni generali.
- Divi e troppo lento, problemi mostrando i panelli popup con info del segmento su cui ci si passa il mouse.
	- Ho dovuto mettere un delay nel mostrare il panello di informazione di un segmento del tetto, perche' si appiccicavano.
- SMTP e' duplicato, con Gravity Forms e con il plugin apposta per SMTP. Sarebbe buono usare solo uno.
- Dobbiamo risolverre probemma con l'environment tuo. Sara' una cazzata, possiamo rinizziare l'installazione da capo

Corregir error: You have included the Google Maps JavaScript API multiple times on this page. This may cause unexpected errors.
Add all PHP CS to all files.
Show in DB the data from the rectangles and solar panels
Fix form back and fw.
Message to mobile: not shown. Try to make it mobile friendly, with tap events

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
- We have included the plugin `gravityformsgeolocation` just to fix the error that loads the API key twice when that plugin is present.


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

    -- More fields in step 3 gravity forms with class and `adminLabel`:  
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

> Note: this info about how to mark the fields in the GForm might not be up to date. But we have a demo of
> the gravity form in `tests/data/gravityforms-form.json`. You can simply import it.

# Project Structure

- plugin.php contains only code for playwright testing. Creates the page Settings > Testing to create the page with the form quickly. (in order to use that page, you need to setup the `.env` file )
├── coco-gravity-form-map-field (the git submodule, you dont need to touch it)
└── solar-project
    ├── inc : All the php files. The add hooks to GF and expose JS vars used by our typescript scripts.
		├── src : The typescript files. All the code starts by the
					stepX_functions.ts , and the rest of .ts files contain the helpers.

For more info, see `AI-AGENT.md`.

# Develop

`git clone <this repo>`

`git submodule update --init --recursive`

- Node 20 (not sure if its n18?)
- NPM 10.7
- WP Env installed globally
- Docker
- Composer

`npm install`
`composer install`
also, inside the folder `plugins/coco-gravity-form-map-field`
`npm install` 
`composer install`
also, inside the folder `plugins/solar-project`
`npm install`
`composer install`

in this root folder

`npm run dev` for wp scripts compilation into `/plugins/solar-project/build` - It compiles also into the `coco-gravity-form-map-field` subproject, in case you modify something there.

`npm run bs` for browser sync

## start the environment in localhost:8777

for the first time, it is avisable to run the global wp-env with 

`wp-env start`

after the containers are created, you can replace it by the local installatin

`npm run up`

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

provided in an `.env` file, to be used in `http://localhost:8777/
wp-admin/options-general.php?page=testing-page`

We created two simple Playwright tests, for step 1 and step 2. It's difficult to simulate the interaction with Google Maps, so we left it like this.

You might need to run
> npx playwright install

And you need to setup the .env with the Keys.

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

ie.
`composer run-script lint plugins/solar-project/solar-project.php`  
or simply `composer lint <relative/path/to/file.php>`
para el plugin coco- ... you need to enter the project and see its README.md

# Translations

- I Added a `\Coco_Solar\Helper::get_language()` to detect the code of the language (ie 'it')  
- The translations apply mostyl to the notifications (there are two kinds, the ones on top of the screen,
and the into panels popup shown when hovering a segment)
- For the top bar notifications (they pretend to be a user helper, like a wizard), thw translations are in  
`plugins/solar-project/src/notification-texts/*.json`
- For the popups panel notifications: I added a suffix to the files (js and json) which shows notifications, ie `segmentInfo_it.html` in folder `plugins/solar-project/assets/notifications/`

> Since the top notifications act like a wizard, they trigger when the state of the page changes 
> (ie when starting to draw a rectangle), so I added a custom listener. Like this, we can hook custom code 
> when that change of state happens.

## How I created the translations

`npm run cli bash`
```
cd wp-content/plugins/solar-project
wp i18n make-pot . ./languages/solar-project.pot --exclude="vendor,node_modules" --domain=solar-project
```

# Terminology:

- segment: when selecting a roof, Solar API provides several areas with radiance information. Everyone of them is a segment.
- rectangle: the user will draw a rectangle over the roof, which is the area where the panels will go. That's the rectangle
	- savedRectangle: object that contains the data for a google.map.polygon rectangle drawn over the map. Contains info about the solarPanelsPolygons drawin inside of it.
- azimuth: the angle of orientation of every segment, 0 degrees is set to North.
- building profile: Google Maps API gives the path of a polygon defining the shape of the roof.

# XDebug

WIP. I was not able to set it up in wp-env environment.

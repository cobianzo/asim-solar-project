Solar Project
===

The project is a WordPress plugin that integrates custom functionalities, and depends on two other plugins: gravityforms and coco-gravity-form-map-field.

The main flow focuses on user interaction with Gravity Forms and the business logic related to the solar project.

A typical interaction flow involves a user accessing a WordPress page with a Gravity Forms form that includes the map field. WordPress loads the form and scripts from both plugins.
The user interacts with the map to select a location or draw an area, and enters other relevant solar project data. Upon form submission, Gravity Forms processes the data, which is then intercepted by the this `solar-project` plugin via its hooks.
The `solar-project` plugin uses this information to make calls to external APIs (mostly to Google Solar API), performs calculations and applies business logic, generates results or notifications, and finally renders the response on the frontend.

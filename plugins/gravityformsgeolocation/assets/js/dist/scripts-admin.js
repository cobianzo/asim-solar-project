!(function () {
	'use strict';
	var e,
		t = {
			5947: function (e, t, n) {
				var o = gform.utils,
					r = n(9801),
					a = n(9509),
					i = n.n(a),
					s = gform,
					c = n.n(s),
					u = jQuery,
					l = n.n(u),
					g = 'ggeolocationEnableGeolocationSuggestions',
					f = function (e, t) {
						return (
							'address' !== t.type ||
								-1 !== e.indexOf('.geolocation_suggestions_setting') ||
								e.push('.geolocation_suggestions_setting'),
							e
						);
					},
					d = function (e, t, n) {
						'address' === t.type &&
							(void 0 === t[g] && (t[g] = !1),
							l()('#ggeolocation-enable-geolocation-suggestions').prop('checked', t[g]));
					},
					p = function (e) {
						if ('function' == typeof window.SetFieldProperty) {
							var t = e.target;
							window.SetFieldProperty(g, t.checked);
						}
					},
					_ = ajaxurl,
					m = n.n(_),
					v = n(4265),
					y = (function () {
						var e = (0, r.Z)(
							i().mark(function e() {
								var t, n, o;
								return i().wrap(function (e) {
									for (;;)
										switch ((e.prev = e.next)) {
											case 0:
												if (
													'gf_settings' ===
														(t = new URLSearchParams(window.location.search)).get(
															'page'
														) ||
													'gravityformsgeolocation' === t.get('subview')
												) {
													e.next = 3;
													break;
												}
												return e.abrupt('return');
											case 3:
												return (
													(n = new google.maps.places.PlacesService(
														document.createElement('div')
													)),
													(o = { query: 'Cape Canaveral', fields: ['name'] }),
													(e.next = 7),
													n.findPlaceFromQuery(o, function (e, t) {
														t === google.maps.places.PlacesServiceStatus.OK &&
															((0, v.v_)({
																endpoint: m(),
																body: {
																	action: 'set_validation_status',
																	valid: !0,
																	nonce: gform_geolocation_vendor_admin_js_strings.set_validation_status_nonce,
																},
															}),
															document
																.querySelector(
																	'#gform_setting_google_places_api_key .gform-settings-input__container'
																)
																.classList.add(
																	'gform-settings-input__container--feedback-success'
																));
													})
												);
											case 7:
											case 'end':
												return e.stop();
										}
								}, e);
							})
						);
						return function () {
							return e.apply(this, arguments);
						};
					})(),
					w = (function () {
						var e = (0, r.Z)(
							i().mark(function e(t) {
								var n;
								return i().wrap(function (e) {
									for (;;)
										switch ((e.prev = e.next)) {
											case 0:
												if (!0 !== (window.gf_geolocation_key_updated || null)) {
													e.next = 3;
													break;
												}
												return e.abrupt('return');
											case 3:
												(n = document.getElementsByName(
													'_gform_setting_google_places_api_key'
												)[0].value),
													t.preventDefault(),
													b(n);
											case 6:
											case 'end':
												return e.stop();
										}
								}, e);
							})
						);
						return function (t) {
							return e.apply(this, arguments);
						};
					})(),
					b = (function () {
						var e = (0, r.Z)(
							i().mark(function e(t) {
								return i().wrap(function (e) {
									for (;;)
										switch ((e.prev = e.next)) {
											case 0:
												return (
													(e.next = 2),
													(0, v.v_)({
														endpoint: m(),
														body: {
															action: 'update_key',
															key: t,
															nonce: gform_geolocation_vendor_admin_js_strings.update_key_nonce,
														},
													})
												);
											case 2:
												(window.gf_geolocation_key_updated = !0),
													document
														.querySelector(
															'#tab_gravityformsgeolocation #gform-settings-save'
														)
														.click();
											case 5:
											case 'end':
												return e.stop();
										}
								}, e);
							})
						);
						return function (t) {
							return e.apply(this, arguments);
						};
					})(),
					h = function () {
						var e;
						l()(document).on('gform_load_field_settings', d),
							(0, o.delegate)(
								'#ggeolocation-enable-geolocation-suggestions',
								'input',
								'change',
								p,
								!1
							),
							c().addFilter('gform_editor_field_settings', f),
							(e = document.querySelector('#tab_gravityformsgeolocation #gform-settings-save')) &&
								e.addEventListener('click', w, !0),
							(window.gm_authFailure = function () {
								(0, v.v_)({
									endpoint: m(),
									body: {
										action: 'set_validation_status',
										valid: !1,
										nonce: gform_geolocation_vendor_admin_js_strings.set_validation_status_nonce,
									},
								}),
									document
										.querySelector(
											'#gform_setting_google_places_api_key .gform-settings-input__container'
										)
										.classList.add('gform-settings-input__container--feedback-error');
							}),
							y();
					},
					k = google,
					x = n.n(k),
					O = { mapRoot: (0, o.getNodes)('geolocation-map-root')[0] },
					j = function () {
						h(),
							O.mapRoot &&
								((function () {
									var e = parseFloat(O.mapRoot.dataset.lat),
										t = parseFloat(O.mapRoot.dataset.long),
										n = new (x().maps.Map)(O.mapRoot, {
											center: { lat: e, lng: t },
											zoom: 8,
										});
									new (x().maps.Marker)({ position: { lat: e, lng: t }, map: n });
								})(),
								(0, o.consoleInfo)('Gravity Forms Geolocation Admin: Initialized map metabox.')),
							(0, o.consoleInfo)(
								'Gravity Forms Geolocation Admin: Initialized all javascript that targeted document ready.'
							);
					};
				(0, o.ready)(j);
			},
		},
		n = {};
	function o(e) {
		var r = n[e];
		if (void 0 !== r) return r.exports;
		var a = (n[e] = { exports: {} });
		return t[e].call(a.exports, a, a.exports, o), a.exports;
	}
	(o.m = t),
		(e = []),
		(o.O = function (t, n, r, a) {
			if (!n) {
				var i = 1 / 0;
				for (l = 0; l < e.length; l++) {
					(n = e[l][0]), (r = e[l][1]), (a = e[l][2]);
					for (var s = !0, c = 0; c < n.length; c++)
						(!1 & a || i >= a) &&
						Object.keys(o.O).every(function (e) {
							return o.O[e](n[c]);
						})
							? n.splice(c--, 1)
							: ((s = !1), a < i && (i = a));
					if (s) {
						e.splice(l--, 1);
						var u = r();
						void 0 !== u && (t = u);
					}
				}
				return t;
			}
			a = a || 0;
			for (var l = e.length; l > 0 && e[l - 1][2] > a; l--) e[l] = e[l - 1];
			e[l] = [n, r, a];
		}),
		(o.n = function (e) {
			var t =
				e && e.__esModule
					? function () {
							return e.default;
						}
					: function () {
							return e;
						};
			return o.d(t, { a: t }), t;
		}),
		(o.d = function (e, t) {
			for (var n in t)
				o.o(t, n) && !o.o(e, n) && Object.defineProperty(e, n, { enumerable: !0, get: t[n] });
		}),
		(o.g = (function () {
			if ('object' == typeof globalThis) return globalThis;
			try {
				return this || new Function('return this')();
			} catch (e) {
				if ('object' == typeof window) return window;
			}
		})()),
		(o.o = function (e, t) {
			return Object.prototype.hasOwnProperty.call(e, t);
		}),
		(function () {
			var e = { 223: 0 };
			o.O.j = function (t) {
				return 0 === e[t];
			};
			var t = function (t, n) {
					var r,
						a,
						i = n[0],
						s = n[1],
						c = n[2],
						u = 0;
					if (
						i.some(function (t) {
							return 0 !== e[t];
						})
					) {
						for (r in s) o.o(s, r) && (o.m[r] = s[r]);
						if (c) var l = c(o);
					}
					for (t && t(n); u < i.length; u++) (a = i[u]), o.o(e, a) && e[a] && e[a][0](), (e[a] = 0);
					return o.O(l);
				},
				n = (self.webpackChunkgravityformsgeolocation = self.webpackChunkgravityformsgeolocation || []);
			n.forEach(t.bind(null, 0)), (n.push = t.bind(null, n.push.bind(n)));
		})(),
		o.O(void 0, [194], function () {
			return o(4051);
		});
	var r = o.O(void 0, [194], function () {
		return o(5947);
	});
	r = o.O(r);
})();

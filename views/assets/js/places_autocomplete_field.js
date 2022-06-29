// https://developers.google.com/maps/documentation/javascript/reference/places-widget#AutocompleteOptions
const DEFAULT_OPTIONS = {
  fields: [
    // 'ALL' includes everything, but affects billing and is not recommended for production.
    // https://developers.google.com/maps/documentation/javascript/reference/places-service#PlaceResult
    'address_components',
    'formatted_address',
    'geometry.location',
    'name',
    'place_id',
  ],
  strictBounds: false
}

class PlacesAutocompleteField {
  constructor(element) {
    console.debug('\tPlacesAutoCompleteField');

    if (typeof window['google'] == 'undefined') {
      throw new Error('no Google Maps JS found');
    }

    this.element = element;
    this.input = element.querySelector('input');
    this.input.addEventListener('focus', () => this.input.removeAttribute('placeholder'));
    this.input.addEventListener('keydown', e => {
      if (e.key == 'Enter') {
        // Prevent accidentally submitting a form that wraps this plugin:
        e.preventDefault();
        return false;
      }
    });

    this.options = this.makeOptions();
    this.autocomplete = new google.maps.places.Autocomplete(this.input, this.options);
    this.autocomplete.addListener('place_changed', this.onPlaceChanged.bind(this));
    this.payload = null;
    this.selectedPlace = null;
  }

  makeOptions() {
    const options = {
      strictBounds: this.element.dataset.strict == 'true'
    };

    if (this.element.dataset.bounds) {
      const [lat, lng] = JSON.parse(this.element.dataset.bounds);
      options.bounds = new google.maps.LatLngBounds({lat, lng});
      console.debug(`PlacesAutocompleteField: have bounds: (${lat}, ${lng})`);
    }

    if (this.element.dataset.types) {
      options.types = JSON.parse(this.element.dataset.types);
    }

    return Object.assign({}, DEFAULT_OPTIONS, options);
  }

  onPlaceChanged() {
    const place = this.autocomplete.getPlace();

    // If a user leaves the autocomplete field after typing a query without selecting a valid Place
    // result, the autocomplete object will return a malformed "place" with a sole `name` property
    // and nothing else. We can safely discard these premature results.
    // (see https://developers.google.com/maps/documentation/javascript/reference/places-widget#Autocomplete.place_changed)
    if (!('address_components' in place)) {
      return;
    }

    this.selectedPlace = place;
    this.payload = null;
    console.debug('PlacesAutocompleteField: place =', place);

    this.dispatchEvent('place_changed');
  }

  clear() {
    this.selectedPlace = null;
    this.payload = null;
    this.input.value = '';
  }

  prepareSubmit(params) {
    if (!this.selectedPlace) {
      return;
    }

    if (!this.payload) {
      console.debug('PlacesAutocompleteField: making payload...');
      const address = Object.fromEntries(this.selectedPlace.address_components.map(c => {
        return [c.types[0], c.short_name];
      }));

      // Defer grabbing lat() and lng() until the field is submitted to avoid incurring extra
      // charges for fetching coordinates multiple times.
      const latitude = this.selectedPlace.geometry.location.lat();
      const longitude = this.selectedPlace.geometry.location.lng();

      // If you change the JSON payload structure, be sure to update the doc comments for
      // DSLComponents#places_autocomplete_field.
      this.payload = JSON.stringify(Object.assign({
        name: this.selectedPlace.name,
        place_id: this.selectedPlace.place_id,
        formatted_address: this.selectedPlace.formatted_address,
        latitude,
        longitude
      }, address));
    }

    console.debug('PlacesAutocompleteField: payload =', this.payload);
    params.push(['place_data', this.payload]);
  }

  dispatchEvent(name, data) {
    const event = new CustomEvent(name, {bubbles: true, composed: true, detail: data});
    console.debug(`PlacesAutocompleteField: dispatch ${name}`);
    this.element.dispatchEvent(event);
  }
}

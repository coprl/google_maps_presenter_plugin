import AddressFormatter from './address_formatter';
import AddressMapper from './address_mapper';
import GBAddressMapper from './address_mappers/gb';

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

function getSubdivisions(countryCode) {
  return window.google_maps_presenter_plugin.subdivisions[countryCode];
}

function objectToFormData(destination = [], object = {}, parentKey = null) {
  for (const [k, v] of Object.entries(object)) {
    if (v == null || v == undefined) {
      continue;
    }

    const key = parentKey ? `${parentKey}[${k}]` : k;

    if (v && v.constructor === {}.constructor) {
      objectToFormData(destination, v, key);
    } else {
      destination.push([key, v]);
    }
  }
}

// https://developers.google.com/maps/documentation/javascript/places-autocomplete
export default class PlacesAutocompleteField {
  constructor(element) {
    console.debug('\tPlacesAutoCompleteField');

    if (typeof window['google'] == 'undefined') {
      throw new Error('no Google Maps JS found');
    }

    this.element = element;
    this.input = element.querySelector('input');
    this.inputWrapper = element.querySelector('.v-plugin--places-autocomplete--input');
    this.resultView = element.querySelector('.v-plugin--places-autocomplete--selected-place');
    this.editDialog = document.querySelector(`#${element.dataset.editDialogId}`);
    document.body.appendChild(this.editDialog);
    this.actualName = this.input.name; // see disableAutocomplete, below
    this.input.addEventListener('focus', () => this.input.removeAttribute('placeholder'));
    this.input.addEventListener('focus', () => this.disableAutocomplete());
    this.input.addEventListener('keydown', e => {
      if (e.key == 'Enter') {
        // Prevent accidentally submitting a form that wraps this plugin:
        e.preventDefault();
        return false;
      }
    });
    this.input.vComponent.prepareSubmit = (params) => { // HACK: this hijack is awful
      this.prepareSubmit(params);
    };
    window.addEventListener('message', this.onMessage.bind(this));

    if (this.element.dataset.place) {
      this.placeData = JSON.parse(this.element.dataset.place);
      this.updateResultView();
      this.updateDialogFields();
    }

    this.loadPlacesAPI().then(() => {
      this.options = this.makeOptions();
      this.input.setAttribute('placeholder', '');
      this.autocomplete = new google.maps.places.Autocomplete(this.input, this.options);
      this.autocomplete.addListener('place_changed', this.onPlaceChanged.bind(this));
    }).catch(err => {
      console.error('Failed to initialize Google Places API:', err);
      this.element.classList.add('mdc-text-field--disabled');
    });
  }

  onMessage(event) {
    if (typeof event.data != 'object' || !('type' in event.data && 'id' in event.data)) {
      return;
    }

    const type = event.data.type;
    const id = event.data.id

    switch (type) {
      case 'places_autocomplete_cleared': {
        const plugin = document.querySelector(`#${id}`).closest('.v-plugin--places-autocomplete').vPlugin;
        plugin.clear();
        break;
      }
      case 'places_autocomplete_address_edited': {
        const plugin = document.querySelector(`#${id}`).closest('.v-plugin--places-autocomplete').vPlugin;

        if (!plugin.editDialog.querySelector('form').reportValidity()) {
          return;
        }

        const params = [];
        plugin.editDialog.vComponent.prepareSubmit(params);

        for (const [k, v] of params) {
          plugin.placeData[k] = v == "" ? null : v;
        }

        plugin.placeData.formatted_address = new AddressFormatter(plugin.placeData).string();

        plugin.closeDialog();
        plugin.updateResultView();
        plugin.updateDialogFields();
        break;
      }
      case 'places_autocomplete_address_dialog_dismissed': {
        const plugin = document.querySelector(`#${id}`).closest('.v-plugin--places-autocomplete').vPlugin;
        plugin.editDialog.vComponent.reset();
        plugin.closeDialog();
        plugin.onCountryChanged();
        break;
      }
      case 'places_autocomplete_country_changed': {
        const plugin = document.querySelector(`#${id}`).closest('.v-plugin--places-autocomplete').vPlugin;
        plugin.onCountryChanged();
        break;
      }
      default:
        break;
    }
  }

  disableAutocomplete() {
    // yeah, yeah, I know. I'm sorry. see https://stackoverflow.com/a/30976223 and
    // https://bugs.chromium.org/p/chromium/issues/detail?id=914451#c66.
    this.input.setAttribute('name', (Math.random() + 1).toString(36).substring(2))
    this.input.setAttribute('autocomplete', 'one-time-code');
  }

  async loadPlacesAPI() {
    window.google = window.google || {};
    window.google.maps = window.google.maps || {};

    if ('places' in window.google.maps) {
      return;
    }

    window.google.maps.places = await google.maps.importLibrary('places');
    console.debug("Loaded Google Places API");
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

    console.debug('PlacesAutocompleteField: place =', place);

    const latitude = place.geometry.location.lat();
    const longitude = place.geometry.location.lng();
    place.geometry.location = {
      lat: latitude,
      lng: longitude
    };

    // If you change the JSON payload structure, be sure to update the doc comments for
    // DSLComponents#places_autocomplete_field.
    const address = mapPlaceToAddress(place);
    const fields = mapAddressToFields(address);

    this.placeData = Object.assign({
      name: place.name,
      source: 'google_places',
      source_id: place.place_id,
      formatted_address: place.formatted_address,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng
    }, fields);
    console.debug('PlacesAutocompleteField: placeData =', this.placeData);

    this.updateResultView();
    this.updateDialogFields();
    this.dispatchEvent('place_changed', this.placeData);
  }

  clear() {
    this.placeData = null;
    this.input.value = '';
    this.updateResultView();
    this.editDialog.vComponent.reset();
    this.input.focus();
  }

  prepareSubmit(params) {
    if (!this.placeData) {
      return;
    }

    console.debug('PlacesAutocompleteField: payload =', this.placeData);
    objectToFormData(params, this.placeData, this.actualName);
  }

  onCountryChanged() {
    const countrySelect = this.editDialog.querySelector('[name="country"]').vComponent;
    const countryCode = countrySelect.value();
    this.updateRegionOptions(countryCode);
  }

  async updateResultView() {
    if (!this.placeData) {
      this.inputWrapper.classList.remove('v-hidden');
      this.resultView.classList.add('v-hidden');

      return;
    }

    const img = this.resultView.querySelector('img');
    const src = new URL(img.src);
    const {latitude, longitude} = this.placeData;

    src.searchParams.set('center', `${latitude},${longitude}`);
    src.searchParams.set('scale', window.devicePixelRatio);
    src.searchParams.set('markers', `|${latitude},${longitude}`)
    img.src = src.toString();

    const placeNameElement = this.resultView.querySelector('[data-for="place-name"]');
    const placeAddressElement = this.resultView.querySelector('[data-for="place-address"]');

    placeNameElement.textContent = this.placeData.name;
    placeAddressElement.textContent = this.placeData.formatted_address;

    if (this.placeData.formatted_address.startsWith(this.placeData.name)) {
      placeNameElement.classList.add('v-hidden');
    } else {
      placeNameElement.classList.remove('v-hidden');
    }

    this.inputWrapper.classList.add('v-hidden');
    this.resultView.classList.remove('v-hidden');
  }

  closeDialog() {
    this.editDialog.vComponent.closeDialog();
  }

  updateDialogFields() {
    this.setDialogFieldValue('name', this.placeData.name);
    this.setDialogFieldValue('ln1', this.placeData.ln1);
    this.setDialogFieldValue('ln2', this.placeData.ln2);
    this.setDialogFieldValue('city', this.placeData.city);
    this.updateRegionOptions(this.placeData.country);
    this.setDialogFieldValue('region', this.placeData.region);
    this.setDialogFieldValue('postal_code', this.placeData.postal_code);
    this.setDialogFieldValue('country', this.placeData.country);
  }

  updateRegionOptions(countryCode) {
    const regionSelect = this.editDialog.querySelector('[name="region"]');
    const subdivisions = getSubdivisions(countryCode);

    if (!subdivisions || subdivisions.length < 1) {
      regionSelect.replaceChildren();
      regionSelect.required = false;

      return;
    }

    const fragment = document.createDocumentFragment();

    for (const [k, v] of Object.entries(subdivisions)) {
      const option = document.createElement('option');
      option.value = k;
      option.innerText = v;
      fragment.append(option);
    }

    regionSelect.required = true;
    regionSelect.replaceChildren(fragment);
  }

  setDialogFieldValue(name, value) {
    const component = this.editDialog.querySelector(`[name="${name}"]`).vComponent;
    component.originalValue = value;

    if (value) {
      component.setValue(value);
    } else {
      component.clear();
    }
  }

  dispatchEvent(name, data) {
    const event = new CustomEvent(name, {bubbles: true, composed: true, detail: data});
    console.debug(`PlacesAutocompleteField: dispatch ${name}`);
    this.element.dispatchEvent(event);
  }

  destroy() {
    // since the edit dialog was hoisted up to the document body, it needs to be explicitly
    // removed:
    this.editDialog.remove();
  }
}

function mapPlaceToAddress(place) {
  return Object.fromEntries(place.address_components.map(component => {
    const key = component.types[0];
    let value;

    switch (key) {
    case "street_number":
    case "locality":
    case "postal_code":
      value = component.long_name
      break;
    default:
      value = component.short_name
      break;
    }

    return [key, value];
  }));
}

// Map Place address data (from `mapPlaceToAddress`) to a set of form fields, identified by name.
// https://developers.google.com/maps/documentation/javascript/geocoding#GeocodingAddressTypes
function mapAddressToFields(place) {
  switch (place.country) {
  case "GB":
    return new GBAddressMapper(place).fields();
  // add new cases here as needed
  default:
    return new AddressMapper(place).fields();
  }
}

// Transforms a Places Autocomplete result into an "address" object.
// Country-specific logic is implemented as subclasses in ./address_mappers.
export default class AddressMapper {
  constructor(place) {
    this.place = place;
  }

  get ln1() {
    return this.place.street_address || [this.place.street_number, this.place.route].compactJoin(" ");
  }

  get ln2() {
    return [this.place.subpremise, this.place.premise].compactJoin(" ");
  }

  // town, city, village, etc.
  get city() {
    return this.place.locality || this.place.postal_town;
  }

  // state, province, etc.
  get region() {
    return this.place.administrative_area_level_1;
  }

  get postalCode() {
    return this.place.postal_code;
  }

  get country() {
    return this.place.country;
  }

  fields() {
    return {
      ln1: this.ln1,
      ln2: this.ln2,
      city: this.city,
      region: this.region,
      postal_code: this.postalCode,
      country: this.country
    };
  }
}

Array.prototype.compactJoin = function(separator = " ") {
  if (this.some(Boolean)) {
    return this.filter(Boolean).join(separator);
  } else {
    return null;
  }
};

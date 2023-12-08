import AddressMapper from '../address_mapper';

export default class GBAddressMapper extends AddressMapper {
  // sample addresses: https://gist.github.com/RCrowt/21869022e668d9fafe205aefdfb3260a

  get subpremisePremise() {
    return [this.place.subpremise, this.place.premise].compactJoin(", ");
  }

  get streetNumberRoute() {
    return [this.place.street_number, this.place.route].compactJoin(" ");
  }

  get ln1() {
    return [this.subpremisePremise, this.streetNumberRoute].compactJoin(", ");
  }

  get ln2() {
    return null; // TODO: is there ever a ln2?
  }

  get city() {
    return this.place.postal_town;
  }

  get region() {
    // the Places API returns subdivision names, not codes, which need to be transposed to match how
    // plugin data is stored:
    return {
      'England': 'ENG',
      'Northern Ireland': 'NIR',
      'Scotland': 'SCT',
      'Wales': 'WLS'
    }[this.place.administrative_area_level_1];
  }

  get postalCode() {
    return [this.place.postal_code_prefix, this.place.postal_code, this.place.postal_code_suffix].compactJoin(" ");
  }
}

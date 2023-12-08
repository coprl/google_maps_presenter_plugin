const TOKEN_PATTERN = /<(\w+)>/gi

// Formats an "address" object (one returned by an AddressMapper) as a string.
export default class AddressFormatter {
  constructor(address) {
    this.address = address;
  }

  get format() {
    switch (this.address.country) {
    case "GB":
      // country comes back as "GB", but should be displayed as "UK".
      return "<ln1>, <ln2> <city> <postal_code>, UK";
    default:
      return "<ln1> <ln2>, <city>, <region> <postal_code>, <country>"
    }
  }

  string() {
    // TODO: consume separator characters around empty tokens
    return this.format
      .replace(TOKEN_PATTERN, (_, key) => {
        if (!this.address[key]) {
          return "";
        } else {
          return this.address[key];
        }
      })
      .replace(/\s+,/g, ',')
      .replace(/\s\s+/g, ' ');
  }
}

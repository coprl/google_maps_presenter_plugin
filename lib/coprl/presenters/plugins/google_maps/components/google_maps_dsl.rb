require_relative 'static_map_component'
require_relative 'places_autocomplete_field_component'

module Coprl
  module Presenters
    module Plugins
      module GoogleMaps
        # Components add new methods to the POM component hierarchy. They should add a component object to the
        # POM component stream. These components are the declarative instructions that are used to render a client.
        # POM components require corresponding views templates and JS that render them.
        # Name this method whatever you want.
        module DSLComponents
          def static_map(**attributes, &block)
            self << StaticMapComponent.new(parent: self, **attributes, &block)
          end

          ##
          # Render a Places autocomplete search field.
          # Google's built-in list of results is displayed underneath the field, allowing users to
          # select a specific Place.
          #
          # @param strict Restrict results to those within the provided +bounds+.
          # @param bounds The area in which to search for Places. If +strict+ is +false+, results
          #               are biased towards (but not restricted to) these bounds.
          # @param types Restrict results to those matching the provided types. If +nil+ or empty,
          #              all types are included.
          #              For a list of supported types, consult the Google Places Autocomplete
          #              documentation.
          # @param countries A hash of ISO 3166-1 alpha-2 code => country name pairs. For example,
          #                  `{ "US" => "United States of America" }`.
          # @param subdivisions A hash of ISO 3166-1 alpha-2 code => { code => name } pairs mapping
          #                     countries to their relevant subdivisions/administrative areas. For
          #                     example, `{ "US" => { "TX" => "Texas" } }`
          #
          # The field submits data in the form of a JSON payload with the following keys:
          #   - name: The selected Place's human-readable name
          #   - place_id: Google's unique identifier for the Place
          #   - formatted_address: A human-readable address string
          #   - latitude
          #   - longitude
          #   - address: an object containing key-value pairs of address components.
          #     The keys are Address Component Types and the values are the short form of the Type's
          #     value from the selected Place.
          #     (for example: `{ "street_address": "1", route: "Sim Lane" }`)
          #
          # An up-to-date list of Address Components can be found here:
          #   https://developers.google.com/maps/documentation/javascript/geocoding#GeocodingAddressTypes
          # For more information about Places Autocomplete in general, see here:
          #   https://developers.google.com/maps/documentation/javascript/places-autocomplete
          def places_autocomplete_field(strict: false, bounds: nil, types: [], countries: {}, subdivisions: {}, **attributes, &block)
            self << PlacesAutocompleteFieldComponent.new(
              **attributes,
              bounds: bounds,
              strict: strict,
              types: types,
              countries: countries,
              subdivisions: subdivisions,
              parent: self,
              &block
            )
          end
        end
      end
    end
  end
end

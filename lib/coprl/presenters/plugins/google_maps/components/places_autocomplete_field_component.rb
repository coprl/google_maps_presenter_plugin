module Coprl
  module Presenters
    module Plugins
      module GoogleMaps
        # https://developers.google.com/maps/documentation/javascript/places-autocomplete
        class PlacesAutocompleteFieldComponent < DSL::Components::TextField
          attr_reader :bounds, :strict, :types

          def initialize(bounds: nil, strict: false, types: [], **attributes, &block)
            super(**attributes, type: :places_autocomplete_field, dirtyable: false, &block)

            @bounds = bounds ? validate_bounds(bounds) : nil
            @strict = strict
            @types = validate_types(Array(types))

            expand!
          end

          private

          def validate_bounds(thing)
            unless thing.respond_to?(:[]) && thing.respond_to?(:length) && thing.length > 1
              raise Errors::ParameterValidation, 'bounds must contain 2 elements'
            end

            # Map via Float instead of to_f so bad values raise instead of silently becoming 0,
            # which is both a valid latitude and longitude.
            lat, lng = thing[0..1].map { |s| Float(s) }

            if lat.abs > 90
              raise Errors::ParameterValidation, 'latitude must be within [-90.0, 90.0]'
            end

            if lng.abs > 180
              raise Errors::ParameterValidation, 'longitude must be within [-180.0, 180.0]'
            end

            [lat, lng]
          end

          def validate_types(types)
            types = types.map { |type| type.to_s.strip }.delete_if(&:empty?)
            raise Errors::ParameterValidation, 'cannot provide more than 5 types' if types.length > 5

            types
          end
        end
      end
    end
  end
end

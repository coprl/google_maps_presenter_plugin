module Coprl
  module Presenters
    module Plugins
      module GoogleMaps
        # https://developers.google.com/maps/documentation/javascript/places-autocomplete
        class PlacesAutocompleteFieldComponent < DSL::Components::TextField
          attr_reader :bounds, :strict, :types, :countries, :subdivisions, :place
          attr_reader :edit_button, :remove_button, :edit_dialog, :edit_dialog_id

          def initialize(bounds: nil, strict: false, types: [], countries: {}, subdivisions: {}, **attributes, &block)
            super(**attributes, type: :places_autocomplete_field, dirtyable: false, &block)

            @bounds = bounds ? validate_bounds(bounds) : nil
            @strict = strict
            @types = validate_types(Array(types))
            @countries = countries
            @subdivisions = subdivisions
            @edit_dialog_id = generate_id

            # need a couple of local variable aliases for button blocks below:
            self_id = id
            dialog_id = @edit_dialog_id

            @edit_button = DSL::Components::Button.new(parent: self, text: 'Edit') do
              event :click do
                dialog dialog_id
              end
            end

            @remove_button = DSL::Components::Button.new(parent: self, text: 'Remove') do
              event :click do
                post_message({type: :places_autocomplete_cleared, id: self_id})
              end
            end

            # the edit dialog has its own form, used for validation, and needs to be hoisted up to
            # the POM root to account for this plugin being inside of a form itself. weeeee!
            # (this isn't a pattern that should be repeated.)
            root = @parent

            while (parent = root&.instance_variable_get('@parent'))
              root = parent
            end

            # need an alias to access #make_field_name
            me = self

            @edit_dialog = DSL::Components::Dialog.new(parent: root, id: edit_dialog_id) do
              title 'Edit address'

              form do
                text_field name: me.make_field_name(:name), auto_complete: 'organization' do
                  label 'Name'
                end

                text_field name: me.make_field_name(:ln1), required: true, auto_complete: 'address-line1' do
                  label 'Address'
                end

                text_field name: me.make_field_name(:ln2), auto_complete: 'address-line2' do
                  label 'Address (line 2)'
                end

                text_field name: me.make_field_name(:city), required: true, auto_complete: 'address-level2' do
                  label 'City/town'
                end

                select name: me.make_field_name(:region), required: true, auto_complete: 'address-level1' do
                  label 'State/province'

                  # options populated by JS; see `updateRegionOptions` JS function.

                  option
                end

                text_field name: me.make_field_name(:postal_code), required: true, auto_complete: 'postal-code' do
                  label 'Postal code'
                end

                select name: me.make_field_name(:country), required: true do
                  label 'Country'

                  countries.each do |code, name|
                    option name, value: code
                  end

                  event :change do
                    post_message({type: :places_autocomplete_country_changed, id: self_id})
                  end
                end

                content align: :end, padding: :top3 do
                  button 'Cancel' do
                    event :click do
                      post_message({type: :places_autocomplete_address_dialog_dismissed, id: self_id})
                      # dialog close is handled in JS
                    end
                  end

                  button 'Save', type: :raised do
                    event :click do
                      post_message({type: :places_autocomplete_address_edited, id: self_id})
                      # dialog close is handled in JS
                    end
                  end
                end
              end
            end

            root << @edit_dialog

            expand!
          end

          def value(value = nil)
            if locked?
              # return a human-readable string to be used within the plugin's embedded text_field:
              @value&.formatted_address
            elsif value
              @value = WrappedValue.new(value)
            end
          end

          def place
            @value
          end

          def make_field_name(field_name)
            self.name ? "#{self.name}[#{field_name}]" : field_name
          end

          private

          class WrappedValue
            attr_reader :name, :ln1, :ln2, :city, :region, :postal_code, :country,
                        :latitude, :longitude, :source, :source_id, :formatted_address

            def initialize(thing)
              @name = thing.name if thing.respond_to?(:name)
              @ln1 = thing.ln1 if thing.respond_to?(:ln1)
              @ln2 = thing.ln2 if thing.respond_to?(:ln2)
              @city = thing.city if thing.respond_to?(:city)
              @region = thing.region if thing.respond_to?(:region)
              @region ||= thing.state if thing.respond_to?(:state)
              @postal_code = thing.postal_code if thing.respond_to?(:postal_code)
              @postal_code ||= thing.zip if thing.respond_to?(:zip)
              @postal_code ||= thing.zip_code if thing.respond_to?(:zip_code)
              @country = thing.country if thing.respond_to?(:country)
              @latitude = thing.latitude if thing.respond_to?(:latitude)
              @longitude = thing.longitude if thing.respond_to?(:longitude)
              @source = thing.respond_to?(:source) ? thing.source : 'google_maps'
              @source_id = thing.source_id if thing.respond_to?(:source_id)
              @formatted_address = thing.formatted_address if thing.respond_to?(:formatted_address)
            end

            def to_h
              {
                name: name,
                ln1: ln1,
                ln2: ln2,
                city: city,
                region: region,
                postal_code: postal_code,
                country: country,
                latitude: latitude,
                longitude: longitude,
                source: source,
                source_id: source_id,
                formatted_address: formatted_address || ''
              }.compact
            end
          end.freeze

          def validate_bounds(thing)
            unless thing.respond_to?(:[]) && thing.respond_to?(:length) && thing.length > 1
              raise Errors::ParameterValidation, 'bounds must contain 2 elements'
            end

            # Map via Float instead of to_f so bad values raise instead of silently becoming 0
            # (which is both a valid latitude and a valid longitude).
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

            # this is a restriction on Google's end.
            # https://developers.google.com/maps/documentation/places/web-service/autocomplete#types
            raise Errors::ParameterValidation, 'cannot provide more than 5 types' if types.length > 5

            types
          end
        end
      end
    end
  end
end

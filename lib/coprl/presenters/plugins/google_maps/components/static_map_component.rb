require 'uri'

module Coprl
  module Presenters
    module Plugins
      module GoogleMaps
        class StaticMapComponent < DSL::Components::Image

          attr_reader :url, :google_api_key, :height, :width

          def initialize(**attribs_, &block)
            # These are also supplied in the base so we set them before passing them down
            @map_width = strip_units(attribs_.fetch(:width, 640))
            @map_height = strip_units(attribs_.fetch(:height, 640))
            super(type: :static_map, **attribs_, &block)
            @address = attribs.delete(:address)
            @latitude = attribs.delete(:latitude)
            @longitude = attribs.delete(:longitude)
            @zoom = attribs.delete(:zoom) { 14 }
            @scale = attribs.delete(:scale) { 1 }
            @google_api_key = attribs.delete(:google_api_key) { ENV['GOOGLE_API_KEY'] }
            @url = build_static_map_image_url
            expand!
          end

          private

          def strip_units(width_or_height)
            width_or_height.to_s.sub(/em|ex|px/,'')
          end

          def build_static_map_image_url
            return @img_url if locked?
            @img_url = "https://maps.googleapis.com/maps/api/staticmap?center=#{query_string}&zoom=#{@zoom}&scale=#{@scale}&size=#{@map_width}x#{@map_height}&markers=|#{query_string}&key=#{@google_api_key}"
          end

          def query_string
            return "#{@latitude},#{@longitude}" if @latitude && @longitude
            URI.encode_www_form_component(@address)
          end

        end
      end
    end
  end
end

# Loads the plugin features
# Components
require 'dry-configurable'
require_relative 'google_maps/components/google_maps_dsl'
require_relative 'google_maps/web_client/components/google_maps_render'

module Coprl
  module Presenters
    module Plugins
      module GoogleMaps
        class Settings
          extend Dry::Configurable

          setting :api_key
        end
      end
    end
  end
end

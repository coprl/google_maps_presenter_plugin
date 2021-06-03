require_relative 'google_maps_component'

module Coprl
  module Presenters
    module Plugins
      module GoogleMaps
        # Components add new methods to the POM component hierarchy. They should add a component object to the
        # POM component stream. These components are the declarative instructions that are used to render a client.
        # POM components require corresponding views templates and JS that render them.
        # Name this method whatever you want.
        module DSLComponents
          def google_map(**attributes, &block)
            self << GoogleMaps::GoogleMapsComponent.new(parent: self, **attributes, &block)
          end
          alias google_maps google_map
        end
      end
    end
  end
end

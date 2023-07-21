module Coprl
  module Presenters
    module Plugins
      module GoogleMaps
        module WebClientComponents
          def view_dir_google_maps(_pom)
            File.join(__dir__, '../../../../../../..', 'views', 'components')
          end

          def render_header_google_maps(pom, render:)
            raise 'No API key provided' unless Settings.config.api_key

            render.call :erb, :google_maps_header,
                        views: view_dir_google_maps(pom),
                        locals: { api_key: Settings.config.api_key }
          end

          def render_static_map(comp, render:, components:, index:)
            render.call :erb, :static_map,
                        views: view_dir_google_maps(comp),
                        locals: { comp: comp, components: components, index: index }
          end

          def render_places_autocomplete_field(comp, render:, components:, index:)
            render.call :erb, :places_autocomplete_field,
                        views: view_dir_google_maps(comp),
                        locals: { comp: comp, components: components, index: index, api_key: Settings.config.api_key }
          end
        end
      end
    end
  end
end

module Coprl
  module Presenters
    module Plugins
      module GoogleMaps
        module WebClientComponents
          def view_dir_google_maps(_pom)
            File.join(__dir__, '../../../../../../..', 'views', 'components')
          end

          def render_google_maps(comp, render:, components:, index:)
            render.call :erb, :google_maps, views: view_dir_google_maps(comp),
                        locals: {comp: comp,
                        components: components, index: index}
          end
        end
      end
    end
  end
end

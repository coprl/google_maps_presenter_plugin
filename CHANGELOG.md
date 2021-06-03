## [1.0.1](https://github.com/coprl/google_maps_presenter_plugin/compare/v1.0.0...v1.0.1) (2021-06-03)


### Bug Fixes

* fixed URI.escape is obsolete warnings ([bda9196](https://github.com/coprl/google_maps_presenter_plugin/commit/bda9196d83f5c344f0ffff873e9a9f55f5614f41))

# 1.0.0 (2021-06-03)


### Features

* CORPL 3 Google maps presenter plugin ([fc04184](https://github.com/coprl/google_maps_presenter_plugin/commit/fc04184654a7e95172b10f8df1de3aa5d68e23b3))


### BREAKING CHANGES

* This presenter plugin is compatible with COPRL 3.
The google_map command was a plugin that was hosted in the coprl respository.
It has been removed and renamed google_maps (from google_map).
This means you need to add either the `plugin: :google_mapp` command to your POM or configure it globally:

Create a Rails initializer `config/initializers/presenters_plugins.rb` or equivalent for a Rack app.

    Coprl::Presenters::Settings.configure do |config|
        config.presenters.plugins.push(:theme)
    end

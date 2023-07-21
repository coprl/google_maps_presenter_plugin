lib = File.expand_path("../lib", __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require "google_maps_presenter_plugin/version"

Gem::Specification.new do |spec|
  spec.name          = "google_maps_presenter_plugin"
  spec.version       = GoogleMapsPresenterPlugin::VERSION
  spec.authors       = ["Russell Edens"]
  spec.email         = ["russell@voomify.com"]

  spec.summary       = %q{A COPRL presenter plugin for google maps images}
  spec.homepage      = 'http://github.com/coprl/google_maps_presenters_plugin'
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0").reject do |f|
    f.match(%r{^(test|spec|features)/})
  end
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 2.3.17"
  spec.add_development_dependency "rake", "~> 13.0.6"

  spec.add_runtime_dependency 'dry-configurable', '>0.1', '<= 7.0' # TODO: fix range? (from COPRL)
end

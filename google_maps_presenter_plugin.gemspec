lib = File.expand_path("../lib", __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require "google_maps_presenter_plugin/version"

Gem::Specification.new do |spec|
  spec.name          = "google_maps_presenter_plugin"
  spec.version       = GoogleMapsPresenterPlugin::VERSION
  spec.authors       = ["Russell Edens"]
  spec.email         = ["russell@voomify.com"]

  spec.summary       = %q{google_maps presenter plugin.}
  spec.homepage      = 'http://github.com/coprl/google_maps_presenters_plugin'
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0").reject do |f|
    f.match(%r{^(test|spec|features)/})
  end
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.16"
  spec.add_development_dependency "rake", "~> 10.0"
end

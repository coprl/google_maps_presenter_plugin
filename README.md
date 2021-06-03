# Google Maps Presenter Plugins

A plugin for [COPRL](http://github.com/coprl/coprl) that provides google maps.

The plugin is based on the standard [image component](https://coprl-ruby.herokuapp.com/images) and supports all the same [attributes](https://github.com/coprl/coprl/blob/master/lib/coprl/presenters/dsl/components/image.rb) for styling.

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'google_maps_presenter_plugin',  github: 'coprl/google_maps_presenter_plugin', branch: :main, require: false
```

And then execute:

    $ bundle

## Usage

Example POM:

    Coprl::Presenters.define(:google_maps) do
        plugin :google_maps
        page_title 'Maps'
        subheading 'Static Maps'
        
        address = '125 Park Street, Traverse City, MI'
        google_map address: address, height: 300, width: 400  do
            event :click do
                loads "https://www.google.com/maps/place/#{address}"
            end
        end
    end


Results in the following google map:
![Google Map](https://dl.dropbox.com/s/bmhhs50sj90nyph/Screen%20Shot%202021-06-03%20at%203.32.04%20PM.png?dl=0)

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/coprl/chart_presenter_plugin.

## License

The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).

## Code of Conduct

Everyone interacting in the COPRL project’s codebases, issue trackers, chat rooms and mailing lists is expected to follow the [code of conduct](https://github.com/coprl/coprl/blob/master/CODE-OF-CONDUCT.md).

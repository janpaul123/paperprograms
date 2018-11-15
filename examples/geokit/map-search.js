// map search

let autocompleteService, placesService;

When` environment has parameter named ${'GoogleMapsAPIKey'} set to value {apiKey}`(({ apiKey }) => {
  const url = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
	Wish` ${'system'} loads js library from ${url}`;
  When` ${'system'} loaded js library from ${url}`(() => {
    if (!autocompleteService) {
      autocompleteService = new google.maps.places.AutocompleteService();
    }

    if (!placesService) {
      const map = new google.maps.Map(document.createElement('div'), {
        center: new google.maps.LatLng(-33.8617374, 151.2021291),
        zoom: 15
      });
      placesService = new google.maps.places.PlacesService(map);
    }
  });
});

let searchQuery = 'USA';
let autocompleteRequest, placeDetailsRequest;
let placeId, viewport;

Wish` ${you} is labelled ${'Search for a place'}`;
Wish` ${you} has text input with initial value ${searchQuery} with options ${{x: 0, y: 40}}`;
When` ${you} has text input {input} with value {value}`(({ value }) => {
  if (searchQuery !== value) {
	searchQuery = value;
    autocompleteRequest = null;
    placeId = null;
    placeDetailsRequest = null;
    viewport = null;
  }
});

function suggestPlaceId(input) {
  if (!autocompleteService || autocompleteRequest) return;

  autocompleteRequest = true;
  autocompleteService.getQueryPredictions({ input }, (predictions, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && predictions.length > 0) {
      placeId = predictions[0].place_id;
    }
  });
}

function suggestPlaceViewport(placeId) {
  if (!placesService || placeDetailsRequest) return;
  
  placeDetailsRequest = true;
  const request = { placeId, fields: ['name', 'geometry'] };
  placesService.getDetails(request, (place, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      viewport = place.geometry.viewport;
    }
  });
}

Wish` ${you} has whisker that points ${'up'}`; 
When` ${you} points at {map}`(({ map }) => {
  const input = searchQuery.replace(/[ \n]/g, '+');
  suggestPlaceId(input);
  if (placeId) {
    suggestPlaceViewport(placeId);
    if (viewport) {
      const bbox = {
        left: viewport.getSouthWest().lng(),
        top: viewport.getNorthEast().lat(),
        right: viewport.getNorthEast().lng(),
        bottom: viewport.getSouthWest().lat(),
      };
      Wish` ${map} is geomap containing bbox ${bbox}`;
    }
  }
});

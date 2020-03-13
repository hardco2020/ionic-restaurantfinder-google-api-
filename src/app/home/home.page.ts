import { Component, AfterContentInit,OnInit,ViewChild,NgZone } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
declare var google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterContentInit {
  mypos;
  address="預設";  //record user's location
  place_id; //record user's place_id  for locating nearrestaurant
  map;
  diningItems = [];

  geocoder = new google.maps.Geocoder;
  GoogleAutocomplete = new google.maps.places.AutocompleteService();
  autocomplete = { input: '' };
  autocompleteItems = [];
  markers = [];
  @ViewChild('mapElement',{static:true}) mapElement;
  ngOnInit(): void{

  }
  ngAfterContentInit():void{  //initalize the map and load it
    this.map = new google.maps.Map(this.mapElement.nativeElement, 
    {
        center: { lat: -34.9011, lng: -56.1645 },
        zoom: 15
    });
    this.tryGeolocation(); //pin your location first
  }
  constructor(private zone: NgZone,private geolocation: Geolocation) {}

  updateSearchResults(){
    if (this.autocomplete.input == '') {    //empty then keep it empty in case the empty array cause some error
      this.autocompleteItems = [];
      return;
    }
    this.GoogleAutocomplete.getPlacePredictions({ input: this.autocomplete.input },
    (predictions, status) => {
      this.autocompleteItems = [];
      this.zone.run(() => {
        predictions.forEach((prediction) => {  
          this.autocompleteItems.push(prediction);   //push the results into global variable
        });
      });
    });
  }
  selectSearchResult(item){
    this.autocompleteItems = [];
    this.geocoder.geocode({'placeId': item.place_id}, (results, status) => {  //user geocoder to find position based on placeid  then put marker on it
      if(status === 'OK' && results[0]){
        let position = {     //that's the standard use for putting marker and change map position
            lat: results[0].geometry.location.lat,
            lng: results[0].geometry.location.lng
        };
        let marker = new google.maps.Marker({
          position: results[0].geometry.location,
          map: this.map,
        });
        this.mypos = position;  //change current position
        this.place_id = item.place_id; //change current place_id
        this.address = results[0].formatted_address;
        this.markers.push(marker);
        this.map.setCenter(results[0].geometry.location);
      }
    })
    
  }
  tryGeolocation(){  //locate your current position by using getCurrentPosition
    this.geolocation.getCurrentPosition().then((resp) => {
      let pos = {
        lat: resp.coords.latitude,
        lng: resp.coords.longitude
      };
      let marker = new google.maps.Marker({  
        position: pos,
        map: this.map,
        title: 'I am here!'
      });
      this.markers.push(marker);
      this.map.setCenter(pos);
      this.mypos = pos;
    }).catch((error) => {
      console.log('Error getting location', error);
    });
    this.FindGeoCode();
  }
  FindGeoCode(){
    this.geocoder.geocode({'location': this.mypos}, (results, status) => {  //user geocoder to find position based on placeid  then put marker on it
      if(status === 'OK' && results[0]){
        this.place_id = results[0].place_id;
      }
    });
  }
  updatePosition(){
    let service = new google.maps.places.PlacesService(this.map);
    service.getDetails(
      {placeId: this.place_id},
        (results, status) =>{
          console.log(results.formatted_address);
          this.address = results.formatted_address;
        }
   );
  console.log(this.place_id);
  console.log(this.diningItems);
  }
  restaurantfinder(){
    this.autocompleteItems = [];
    let service = new google.maps.places.PlacesService(this.map);
    this.geocoder.geocode({'placeId': this.place_id}, (results, status) => {
      if(status === 'OK' && results[0]){
        this.autocompleteItems = [];
        service.nearbySearch({
          location: results[0].geometry.location,
          radius: '500',
          types: ['restaurant'],
        }, (near_places) => {
            this.zone.run(() => {
              this.diningItems = [];
              for (var i = 0; i < near_places.length; i++) {
                this.diningItems.push(near_places[i]);
              }
          });
        })
      }
    })
  }
}

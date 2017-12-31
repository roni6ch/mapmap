var app = angular.module('mapmapApp', ["ngRoute","ui.materialize" ,"rzModule"]);
app.config(function ($routeProvider,$locationProvider) {
	$routeProvider.when('/', {
				templateUrl: 'content/pages/main.html',
				controller: 'indexController',
				controllerAs: 'vm',
			})
			.when('/searchZone', {
				templateUrl: 'content/pages/searchZone.html',
				controller: 'searchZoneController',
				controllerAs: 'vm',
			})
			.otherwise({ redirectTo: '/' });

});
app.run(function($compile) {
	angular.element('.loginBT').show();
	$(".button-collapse").sideNav();
	//init google places complete
	$("head").append("<script src='https://maps.googleapis.com/maps/api/js?key=AIzaSyDEnFW2NgIGcepsn5H11rEOC3s7jYNL8cI&libraries=places&callback=initAutoCompleteAddress'/>");


	if(localStorage.getItem('profile') !== null) {
		$('.userProfile img').attr("src", JSON.parse(localStorage.getItem("profile"))["Paa"]);
		$('.userProfile').show();
		$('.loginBT').hide();
	}
});

/*************************************************/
/***************** indexController ***************/
/*************************************************/
app.controller('indexController', function ($scope,$timeout,$compile,$location,$http) {
	//init
	var vm = this;
	//vm shortcut
	window.VM = function(selector){
		return angular.element(selector).scope();
	};
	vm.init = function(){
		//popover userProfile
		/*	angular.element('.userProfile[data-toggle="popover"]').popover({html : true,tooltipClass: 'tooltip-custom',
		 content:$compile("<div class='userProfileCustomClass' role='tooltip'><span ng-click='vm.signOut()'>SignOut</span></div>")($scope)});
		 */
	}

	//search clicked!
	vm.search = function(){
		//location - (with default)
		vm.location = angular.element("#mapsAutoComplete").val() !== "" ? angular.element("#mapsAutoComplete").val() : "תל אביב יפו, ישראל";
		//rent or buy
		vm.selectRentOrBuy = angular.element(".selectRentOrBuy ul .active span").text();
		//apartment type
		vm.apartmentType =  [];
		$(".roomType .dropdown-content .active span").each(function() {
			vm.apartmentType.push($(this).text());
		});
		if (vm.apartmentType.length == 0){
			vm.apartmentType.push("הכל");
		}
		//room numbers
		vm.roomNum =  [];
		$(".roomNum .dropdown-content .active span").each(function() {
			vm.roomNum.push($(this).text());
		});
		vm.roomNum.sort();
		if (vm.roomNum.length == 0){
			vm.roomNum.push("1");
		}
		//range
		vm.range = [];
		vm.range[0] = vm.slider.minValue;
		vm.range[1] = vm.slider.maxValue;


		vm.form = {
			"location":vm.location,
			"selectRentOrBuy":vm.selectRentOrBuy,
			"apartmentType":vm.apartmentType,
			"roomNum":vm.roomNum,
			"range":vm.range,
		}

		$http.post('content/results.json', vm.form).then(function(data) {
			if (data.status == 200){
				localStorage.setItem("data",JSON.stringify(data.data));
				$location.path('/searchZone');
			}
		}, function (error) {
			//fail
			console.log("error: " , error);
		});
	}

	//close popover login
	vm.signOut = function(){
		signOut();
	}
});

/*************************************************/
/***************** searchZoneController ********/
/*************************************************/
app.controller('searchZoneController', function ($scope,$compile) {
	//init
	var vm = this;
	vm.init = function(){
		initAutoCompleteAddress();
		//check if data exist in local storage
		if (localStorage.getItem("data") !== null) {
			console.log(JSON.parse(localStorage.getItem("data")));
			vm.searchResults = JSON.parse(localStorage.getItem("data"));
		}

	}


	vm.signOut = function(){
		signOut();
		window.location = "#";
	}

});

app.directive('roomType', function() {
	return {
		restrict: 'AE',
		replace: true,
		template: function(scope, element, attrs) {
			return '<div class="input-field col-sm-2 right roomType"> <select multiple id="roomType" ng-model="vm.roomType"><option value="all" disabled selected>הכל</option><option value="apartment">דירה</option><option value="unit">יחידת דיור</option> <option value="GardenApartment">דירת גן</option><option value="studio">סטודיו</option></select><label>סוג נכס</label></div>';
		},
		link: function(scope, element, attrs) {
			angular.element('#roomType').material_select();
			$( ".roomType  .dropdown-content li" ).click(function() {
				$roomTypeLength = $( ".roomType  .dropdown-content .active" ).length;
				if ($roomTypeLength > 1){
					$(".roomType .select-dropdown").val($roomTypeLength + " אפשרויות");
				}
			});
		}
	};
});
app.directive('roomNum', function() {
	return {
		restrict: 'AE',
		replace: true,
		template: function(scope, element, attrs) {
			return '<div class="input-field col-sm-2 right roomNum no-padding"> <select multiple id="roomNum"> <option value="1" disabled selected>1</option> <option value="2">2</option> <option value="3">3</option> <option value="4">4</option> <option value="5">5+</option> </select> <label>מספר חדרים</label> </div>';
		},
		link: function(scope, element, attrs) {
			angular.element('#roomNum').material_select();
		}
	};
});
app.directive('rzSlider', function($timeout) {
	return {
		restrict: 'AE',
		replace: true,
		template: function(scope, element, attrs) {
			return '<div class="input-field col-sm-4 right roomNum no-padding"> <p>טווח</p> <rzslider rz-slider-model="vm.slider.minValue" rz-slider-high="vm.slider.maxValue" rz-slider-options="vm.slider.options"></rzslider> </div>';
		},
		link: function(scope, element, attrs) {
			scope.vm.slider = {
				minValue: attrs.min,
				maxValue: attrs.max,
				options: {
					floor: 1000,
					ceil: 8000,
					step: 1000
				}
			};
			//init first dropdown min and max values when click on "more options" button
			scope.vm.moreOptions = function(){
				$timeout(function () {
					scope.$broadcast('rzSliderForceRender');
				});
			}
		}
	};
});
app.directive('googleSignInButton', function($compile) {
	return {
		restrict: 'AE',
		replace: true,
		controller: "indexController",
		controller: "searchZoneController",
		controllerAs: 'vm',
		bindToController: true,
		link: function(scope, element, attrs) {
			var template = "<div class='userProfileCustomClass' role='tooltip'><span ng-click='vm.signOut()'>SignOut</span></div>";
			angular.element('.userProfile[data-toggle="popover"]').popover({
				html: true, tooltipClass: 'tooltip-custom',
				content: $compile(template)(scope)
			});
		}
	};
});

$(function() {

});
var profile;
function onSignIn(googleUser) {
	// Useful data for your client-side scripts:
	profile = googleUser.getBasicProfile();
	// The ID token you need to pass to your backend:
	var id_token = googleUser.getAuthResponse().id_token;
	console.log("profile: " + profile);
	//Store the entity object in sessionStorage where it will be accessible from all pages of your site.
	localStorage.setItem('profile', JSON.stringify(profile));
	$('.userProfile img').attr("src", profile.getImageUrl());
	$('.userProfile').show();
	$('.loginBT').hide();
};
function signOut() {

	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		console.log('User signed out.');
		$('.userProfile').hide();
		$('.userProfile').popover("hide");
		$('.loginBT').show();
		localStorage.removeItem("profile");
	});
	/*auth2.disconnect().then(function () {
	 console.log('User disconnect.');
	 });*/
}
function initAutoCompleteAddress() {
	//init auto complete address
	var input = $('.mapsAutoComplete')[0];
	//check if google alredy exist on refresh and if the input exist
	if(input != undefined && typeof google === 'object' && typeof google.maps === 'object') {
		var autocomplete = new google.maps.places.Autocomplete(input);
		// Set auto complete only to Israel
		autocomplete.setComponentRestrictions(
				{'country': ['il']});
	}

	//init map
	var map = $('#map')[0];
	var marker;
	if(map != undefined  && typeof google === 'object' && typeof google.maps === 'object') {
		var myLatLng = {lat: 32.0852999, lng: 34.7817676};
		if (localStorage.getItem("data") !== null) {
			var address = JSON.parse(localStorage.getItem("data"))["location"];


			var geocoder = new google.maps.Geocoder();

			geocoder.geocode( { 'address': address}, function(results, status) {

				if (status == google.maps.GeocoderStatus.OK) {
					var latitude = results[0].geometry.location.lat();
					var longitude = results[0].geometry.location.lng();
					myLatLng = {lat: latitude, lng: longitude};
					console.log(latitude);
					console.log(longitude);
					map = new google.maps.Map(document.getElementById('map'), {
						zoom: 14,
						center: myLatLng
					});
					marker = new google.maps.Marker({
						position: myLatLng,
						map: map,
						title: 'Hello World!'
					});
				}
			});
		}
		else {
			map = new google.maps.Map(document.getElementById('map'), {
				zoom: 14,
				center: myLatLng
			});
			marker = new google.maps.Marker({
				position: myLatLng,
				map: map,
				title: 'Hello World!'
			});
		}


	}

}
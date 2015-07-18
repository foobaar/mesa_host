var mesaControllers = angular.module('mesaControllers', []);

mesaControllers.controller('ReservationsCtrl', ['$scope', '$http', '$ionicModal', 'restaurantInfo', function($scope, $http, $ionicModal, restaurantInfo) {
  var rootUrl = 'https://obscure-ocean-2327.herokuapp.com';
  $scope.getReservations = function() {
    $http.get(rootUrl + '/reservations/senate_100')
    .then(function(resp) {
      resp.data.sort(function(a, b) {
        if(a.seatingNow) {
          return -1;
        } else if(b.seatingNow) {
          return 1;
        } else if(a.closed) {
          return 1;
        } else if(b.closed) {
          return -1;
        }
        return 0;
      });
      $scope.reservations = resp.data;
      console.log(resp);
    });
  };

  $scope.getReservationRowClass = function(it) {
    if(it == null || typeof it == 'undefined') {
      return "";
    } else if(it.closed) {
      return "reservation-closed";
    } else if(it.seatingNow) {
      return "reservation-seating";
    } else {
      return "reservation-open";
    }
  };
  $scope.notifyButtonClass = function(it) {
    if(it == null || typeof it == 'undefined') {
      return "";
    } else if(it.seatingNow) {
      return "button-light button-outline";
    } else {
      return "button-positive";
    }

  };
  $ionicModal.fromTemplateUrl('partials/add_reservation_modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.openModal = function() {
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    // Execute action
  });
  // Execute action on remove modal
  $scope.$on('modal.removed', function() {
    // Execute action
  });

  var emptyReservation = {
    "name": "",
    "partySize": "",
    "phoneNumber": ""
  };

  $scope.newReservation = Object.create(emptyReservation);

  var resetModal = function() {
    $scope.modal.hide();
    $scope.newReservation = Object.create(emptyReservation);
  };

  $scope.submitReservation = function() {
    var request = {
      userId: $scope.newReservation.phoneNumber,
      customerName: $scope.newReservation.name,
      partySize: $scope.newReservation.partySize,
      restaurantId: restaurantInfo.getRestaurantId()
    };
    console.log(request);
    $http.post(rootUrl + '/reservations', request)
      .then(function(resp) {
        resetModal();
        $scope.getReservations();
      });
  };
  $scope.getReservations();

  return $scope;
}]);

var mesaServices = angular.module('mesaServices', []);

mesaServices.factory('restaurantInfo', function() {
  var restaurantId = "senate_100";
  return {
    setRestaurantId: function(id) {
      restaurantId = id;
    },
    getRestaurantId: function() {
      return restaurantId;
    }
  };
});

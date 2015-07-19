var mesaControllers = angular.module('mesaControllers', []);

mesaControllers.controller('ReservationsCtrl', ['$scope', '$http', '$ionicModal', 'restaurantInfo', '$timeout', function($scope, $http, $ionicModal, restaurantInfo, $timeout) {
  var rootUrl = 'https://obscure-ocean-2327.herokuapp.com';
  var poll = function() {
    $timeout(function() {
      $scope.getReservations();
      poll();
    }, 5000);
  };
  poll();
  $scope.getReservations = function() {
    $http.get(rootUrl + '/reservations/' + restaurantInfo.getRestaurantId())
    .then(function(resp) {
      resp.data.sort(function(a, b) {
        if(a.closed) return 1;
        if(b.closed) return -1;
        if(a.responded) return -1;
        if(b.responded) return 1;
        if(a.seatingNow) return -1;
        if(b.seatingNow) return 1;
        return a.tStamp - b.tStamp;
      });
      $scope.reservations = resp.data;
    });
  };

  $scope.getDateStringFor = function(reservation) {
    return new Date(parseInt(reservation.tStamp)).toLocaleTimeString();
  };

  $scope.shouldHideActions = function(reservation) {
    if(typeof reservation == 'undefined') return "";
    if(reservation.closed) return "hidden";
    return "";
  };

  $scope.shouldHideNotify = function(reservation) {
    if(typeof reservation == 'undefined') return "";
    if(reservation.seatingNow || reservation.closed) return "hidden";
    return "";
  };

  $scope.getReservationRowClass = function(it) {
    if(it == null || typeof it == 'undefined') {
      return "";
    } else if(it.closed) {
      return "reservation-closed";
    } else if(it.responded) {
      return "reservation-accepted";
    } else if(it.seatingNow) {
      return "reservation-seating";
    } else {
      return "reservation-open";
    }
  };

  var doSomethingTo = function(reservation, action) {
    var id = reservation.reservationId;
    var url = rootUrl + '/reservations/' + id + action;
    console.log(url);
    $http.post(url)
      .then(function(resp) {
        $scope.getReservations(); 
      });
  };
  $scope.notifyCustomer = function(reservation) {
    doSomethingTo(reservation, '/notify');
  };
  $scope.closeReservation = function(reservation) {
    doSomethingTo(reservation, '/close');
  };
  $scope.seatCustomer = function(reservation) {
    var id = reservation.userId;
    var url = rootUrl + '/user/' + id + '/seated';
    console.log(url);
    $http.post(url)
      .then(function(resp) {
        $scope.getReservations();
      });
  };

  $ionicModal.fromTemplateUrl('partials/add_reservation_modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.addModal = modal;
  });
  $ionicModal.fromTemplateUrl('partials/reservation_detail_modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.detailModal = modal;
  });
  $ionicModal.fromTemplateUrl('partials/set_wait_time_modal.html', {
    scope: $scope,
    animation: 'slide-in-up' 
  }).then(function(modal) {
    $scope.timeModal = modal;
  });

  $scope.openAddModal = function() {
    $scope.addModal.show();
  };
  $scope.closeAddModal = function() {
    $scope.addModal.hide();
  };
  $scope.openDetailModal = function(reservation) {
    $scope.reservationDetail = reservation;
    $scope.detailModal.show();
  };
  $scope.closeDetailModal = function() {
    $scope.reservationDetail = Object.create(emptyModel);;
    $scope.detailModal.hide();
  };
  $scope.openTimeModal = function(reservation) {
    $scope.reservationTime = reservation;
    $scope.timeModal.show();
  };
  $scope.closeTimeModal = function() {
    $scope.reservationTime = Object.create(emptyModel);;
    $scope.timeModal.hide();
  };
  $scope.$on('$destroy', function() {
    $scope.addModal.remove();
    $scope.detailModal.remove();
    $scope.timeModal.remove();
  });

  var emptyReservation = {
    "name": "",
    "partySize": "",
    "phoneNumber": "",
    "waitTime": "",
    "notes": ""
  };
  
  var emptyModel = {
    "customerName": "",
    "partySize": "",
    "userId": "",
    "waitTime": "",
    "notes": "",
    "tStamp": 0
  };

  var emptyWait = {
    "minutes": ""
  };

  $scope.newReservation = Object.create(emptyReservation);
  $scope.reservationDetail = Object.create(emptyModel);
  $scope.expectedWait = Object.create(emptyWait);
  $scope.expectedWait.minutes = "";

  var resetAddModal = function() {
    $scope.addModal.hide();
    $scope.newReservation = Object.create(emptyReservation);
  };

  $scope.submitReservation = function() {
    var request = {
      userId: $scope.newReservation.phoneNumber,
      customerName: $scope.newReservation.name,
      partySize: $scope.newReservation.partySize,
      restaurantId: restaurantInfo.getRestaurantId(),
      waitTime: $scope.newReservation.waitTime,
      notes: $scope.newReservation.notes
    };
    console.log(request);
    $http.post(rootUrl + '/reservations', request)
      .then(function(resp) {
        resetAddModal();
        $scope.getReservations();
      });
  };

  $scope.updateWaitTime = function() {
    var request = {
      waitTime: $scope.expectedWait.minutes
    };
    console.log(request);
    $http.post(rootUrl + '/restaurants/' + restaurantInfo.getRestaurantId() + '/waitTime', request)
      .then(function(resp) {
        $scope.closeTimeModal();
      });
  };

  $scope.shouldHideControls = function(reservation) {
    if(typeof reservation == 'undefined') return "";
    if(reservation.closed) return "hidden";
    return "";
  };

  $scope.getTotalOpenReservations = function() {
    if(typeof $scope.reservations == 'undefined') return 0;
    var total = 0;
    $scope.reservations.forEach(function(it) {
      if(!it.closed) total++;
    });
    return total;
  };

  $scope.getReservations();
  $http.get(rootUrl + '/restaurants/' + restaurantInfo.getRestaurantId())
  .then(function(resp) {
    $scope.expectedWait.minutes = resp.data[0].waitTime;
  });

  return $scope;
}]);

var mesaServices = angular.module('mesaServices', []);

mesaServices.factory('restaurantInfo', function($timeout, $http) {
  var rootUrl = 'https://obscure-ocean-2327.herokuapp.com';
  var restaurantId = "bakersfield_100";

  return {
    setRestaurantId: function(id) {
      restaurantId = id;
    },
    getRestaurantId: function() {
      return restaurantId;
    },
    getCurrentWaitTime: function() {
      return info.restaurant.waitTime;
    }
  };
});


mesaControllers.controller('LoginCtrl', ['restaurantInfo', '$state', '$scope',
function(restaurantInfo, $state, $scope) {
  $scope.restaurant = {"id": ""};
  $scope.setRestaurantId = function() {
    restaurantInfo.setRestaurantId($scope.restaurant.id);
    $state.go('list', {}, {reload: true});
  }; 
}]);

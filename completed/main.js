var app = angular.module('codecraft', ['ngResource', 'infinite-scroll', 'angularSpinner', 'jcs-autoValidate', 'angular-ladda', 'mgcrea.ngStrap', 'toaster', 'ngAnimate']);
// FACTORY get a resource with param id, and methods "put" and "post" (edit, create)
app.factory("Contact", function($resource) {
    return $resource("https://jsonplaceholder.typicode.com/users/:id/", {
        id: '@id'
    }, {
        update: {
            method: 'PUT'
        },
        create: {
            method: 'POST'
        }
    });
});
// U servisu je važno zapamtiti kada se doda  argument da on vraća instancu funkcije
// "Get" for with id just one user, and query for loading all user
// In array "users" i push "user"

app.service("UserService", function(Contact, $q) {
    Contact.get({
        id: 1
    }, function(user) {
        //  console.log(user);
    });
    var self = {
        'addUser': function(user) {
            this.users.push(user);
        },
        'page': 1,
        'hasMore': true,
        'selectedUser': null,
        'isSaving': false,
        'isDeleting': false,
        'users': [],
        'loadUsers': function() {
            Contact.query(function(data) {
                angular.forEach(data, function(user) {
                    self.users.push(new Contact(user));
                })
            });
        },
        'updateUser': function(user, index) {
            this.isSaving = false;
            Contact.update(user).$promise.then(function(res) {
                // Find index of user and make change
                self.users[index] = res;
                console.log(res);
                this.isSaving = true;
            }).catch(function(res) {
                console.log(res);
            });
        },
        'removeUser': function(user, index) {
            this.isDeleting = true;
            user.$remove().then(function() {
                this.isDeleting = false;
                self.users.splice(index, 1);
                self.selectedUser = null;
            });
        },
        'createContact': function(user, index) {
            var d = $q.defer();
            this.isSaving = true;
            Contact.create(user).$promise.then(function(res) {
                // Find index of user and make change
                self.users.push(new Contact(res));
                console.log(res);
                this.isSaving = false;
                d.resolve()
            });
            return d.promise;
        }
    }
    self.loadUsers();
    return self;
});
//Detail Controller
app.controller('detailController', function($scope, UserService, $rootScope) {
    $scope.users = UserService;
    $scope.edit = function() {
        $scope.users.updateUser($rootScope.selectedUser, $rootScope.selectedIndex);
    };
    $scope.remove = function() {
        $scope.users.removeUser($rootScope.selectedUser, $rootScope.selectedIndex);
    };
});
//Main Controller
app.controller('mainController', function($scope, $rootScope, $http, UserService, $modal) {
    $scope.users = UserService;
    $rootScope.formData = {};
    $scope.showCreateModal = function() {
        $scope.users.selectedUser = {};
        $scope.createModal = $modal({
            scope: $scope,
            templateUrl: 'templates/modal.create.tpl.html',
            show: true
        })
    };
    $scope.createContact = function() {
        $rootScope.selectedUser = angular.copy($rootScope.formData);
        $scope.users.createContact($rootScope.formData).then(function() {
            $scope.createModal.hide();
        });
    };
    $scope.createUser = function() {
        $scope.users.createUser($scope.users.selectedUser);
    };
    $rootScope.selectedIndex = null;
    $rootScope.selectedUser = {};
    $scope.selectUser = function(user, index) {
        // remove instant data biding between detail and list
        $rootScope.selectedIndex = angular.copy(index);
        $rootScope.selectedUser = angular.copy(user);
    };
});
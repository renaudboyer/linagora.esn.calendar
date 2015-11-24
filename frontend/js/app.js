'use strict';

angular.module('esn.calendar', [
  'esn.core',
  'esn.authentication',
  'esn.form.helper',
  'esn.ical',
  'esn.fcmoment',
  'esn.community',
  'restangular',
  'mgcrea.ngStrap.datepicker',
  'mgcrea.ngStrap.aside',
  'materialAdmin',
  'ui.bootstrap.tpls',
  'ui.bootstrap',
  'AngularJstz',
  'esn.notification',
  'esn.widget.helper',
  'uuid4',
  'ui.calendar',
  'ng.deviceDetector',
  'naturalSort'
])
  .config(function($routeProvider, routeResolver) {

    $routeProvider.when('/calendar/communities/:community_id', {
      templateUrl: '/calendar/views/calendar/community-calendar',
      controller: 'communityCalendarController',
      resolve: {
        community: routeResolver.api('communityAPI', 'get', 'community_id', '/communities')
      }
    });

    $routeProvider.when('/calendar/event-full-form', {
      templateUrl: '/calendar/views/event-full-form/event-full-form-view',
      resolve: {
        event: function(eventUtils) {
          return eventUtils.getEditedEvent();
        }
      },
      controller: 'eventFullFormController'
    });

    $routeProvider.when('/calendar/:calendar_id/:event_id', {
      templateUrl: '/calendar/views/event-full-form/event-full-form-view',
      resolve: {
        event: function($route, $location, pathBuilder, calendarService, notificationFactory) {
          var eventPath = pathBuilder.forEventId($route.current.params.calendar_id, $route.current.params.event_id);
          return calendarService.getEvent(eventPath).catch(function(error) {
            notificationFactory.weakError('Cannot display this event.', error.statusText);
            $location.path('/calendar');
          });
        }
      },
      controller: 'eventFullFormController'
    });

    $routeProvider.when('/calendar', {
      templateUrl: '/calendar/views/calendar/user-calendar',
      controller: 'userCalendarController',
      resolve: {
        user: routeResolver.session('user')
      }
    });

  });

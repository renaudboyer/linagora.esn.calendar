(function() {
  'use strict';

  angular.module('esn.calendar')
    .component('calCalendarSharedConfigurationItem', {
      bindings: {
        item: '='
      },
      templateUrl: '/calendar/app/calendar-shared-configuration/item/calendar-shared-configuration-item.html'
    });
})();

(function() {
  'use strict';

  angular.module('esn.calendar')
    .controller('calendarConfigurationController', calendarConfigurationController);

  function calendarConfigurationController(
    $state,
    $stateParams,
    $q,
    _,
    CalendarCollectionShell,
    calendarService,
    calendarHomeService,
    calendarAPI,
    matchmedia,
    notificationFactory,
    uuid4,
    userAPI,
    userUtils,
    SM_XS_MEDIA_QUERY,
    CAL_CALENDAR_MODIFY_COMPARE_KEYS,
    CAL_CALENDAR_PUBLIC_RIGHT,
    CAL_CALENDAR_SHARED_RIGHT,
    CalendarRightShell,
    CalDelegationEditionHelper
  ) {
    var self = this;
    var calendarRightShell, originalCalendarRight;
    var CaldelegationEditionHelperInstance = new CalDelegationEditionHelper();

    self.submit = submit;
    self.addUserGroup = addUserGroup;
    self.removeUserGroup = removeUserGroup;
    self.$onInit = $onInit;
    self.activate = activate;

    ////////////

    function $onInit() {
      calendarHomeService.getUserCalendarHomeId()
        .then(function(calendarHomeId) {
          self.calendarHomeId = calendarHomeId;

          return calendarHomeId;
        })
        .then(function(calendarHomeId) {
          if ($stateParams.calendarId) {
            return calendarService.getCalendar(calendarHomeId, $stateParams.calendarId);
          }
        })
        .then(function(calendar) {
          self.calendar = calendar;

          return self.activate();
        })
        .then(function() {
          if ($stateParams.addUsersFromDelegationState) {
            self.newUsersGroups = $stateParams.addUsersFromDelegationState.newUsersGroups;
            self.selectedShareeRight = $stateParams.addUsersFromDelegationState.selectedShareeRight;

            self.addUserGroup();
            self.selectedTab = 'delegation';
          }
        });
    }

    function activate() {
      self.newCalendar = !self.calendar;
      self.calendar = self.calendar || {};
      self.oldCalendar = {};
      self.newUsersGroups = [];
      self.selectedTab = 'main';

      if (self.newCalendar) {
        calendarRightShell = new CalendarRightShell();
      } else {
        calendarRightShell = self.calendar.rights;
      }

      angular.copy(self.calendar, self.oldCalendar);
      self.delegations = self.delegations || [];
      self.selectedShareeRight = CAL_CALENDAR_SHARED_RIGHT.NONE;

      self.publicSelection = calendarRightShell.getPublicRight();
      var allShareeRights = calendarRightShell.getAllShareeRights();

      $q.all(_.chain(allShareeRights).map('userId').map(userAPI.user).values()).then(function(users) {
        _.chain(users).map('data').zip(allShareeRights).forEach(function(array) {
          var user = array[0];
          var right = array[1].right;

          user.displayName = userUtils.displayNameOf(user);
          self.delegations = CaldelegationEditionHelperInstance.addUserGroup([user], right);
        });
      });

      if (self.newCalendar) {
        self.calendar.href = CalendarCollectionShell.buildHref(self.calendarHomeId, uuid4.generate());
        self.calendar.color = '#' + Math.random().toString(16).substr(-6);
      }
    }

    function _canSaveCalendar() {
      return !!self.calendar.name && self.calendar.name.length >= 1;
    }

    function _hasModifications(oldCalendar, newCalendar) {
      return CAL_CALENDAR_MODIFY_COMPARE_KEYS.some(function(key) {
        return !angular.equals(oldCalendar[key], newCalendar[key]);
      });
    }

    function submit() {
      if (!_canSaveCalendar()) {
        return;
      }

      var calendarCollectionShell = CalendarCollectionShell.from(self.calendar);

      if (self.newCalendar) {
        calendarService.createCalendar(self.calendarHomeId, calendarCollectionShell)
          .then(function() {
            notificationFactory.weakInfo('New calendar - ', self.calendar.name + ' has been created.');
            $state.go('calendar.main');
          });
      } else {
        originalCalendarRight = calendarRightShell.clone();
        CaldelegationEditionHelperInstance.getAllRemovedUsersId().map(function(removedUserId) {
          calendarRightShell.removeShareeRight(removedUserId);
        });

        self.delegations.forEach(function(line) {
          calendarRightShell.updateSharee(line.user._id, line.user.preferredEmail, line.selection);
        });

        var rightChanged = !calendarRightShell.equals(originalCalendarRight);
        var calendarChanged = _hasModifications(self.oldCalendar, self.calendar);
        var updateActions = [];
        var publicRightChanged = self.publicSelection !== calendarRightShell.getPublicRight();

        if (!rightChanged && !calendarChanged && !publicRightChanged) {
          if (matchmedia.is(SM_XS_MEDIA_QUERY)) {
            $state.go('calendar.list');
          } else {
            $state.go('calendar.main');
          }

          return;
        }

        if (calendarChanged) {
          updateActions.push(calendarService.modifyCalendar(self.calendarHomeId, calendarCollectionShell, calendarRightShell));
        }

        if (rightChanged) {
          updateActions.push(calendarService.modifyRights(self.calendarHomeId, calendarCollectionShell, calendarRightShell, originalCalendarRight));
        }

        if (publicRightChanged) {
          switch (self.publicSelection) {
            case CAL_CALENDAR_PUBLIC_RIGHT.READ:
            case CAL_CALENDAR_PUBLIC_RIGHT.READ_WRITE:
            case CAL_CALENDAR_PUBLIC_RIGHT.FREE_BUSY:
              updateActions.push(calendarAPI.modifyPublicRights(self.calendarHomeId, self.calendar.id, { public_right: self.publicSelection }));
          }
        }

        $q.all(updateActions).then(function() {
          notificationFactory.weakInfo('Calendar - ', self.calendar.name + ' has been modified.');
          $state.go('calendar.main');
        });
      }
    }

    function addUserGroup() {
      self.delegations = CaldelegationEditionHelperInstance.addUserGroup(self.newUsersGroups, self.selectedShareeRight);

      if (self.newCalendar) {
        throw new Error('edition of right on new calendar are not implemented yet');
      }

      reset();
    }

    function removeUserGroup(delegationSelected) {
      self.delegations = CaldelegationEditionHelperInstance.removeUserGroup(delegationSelected);
    }

    function reset() {
      self.newUsersGroups = [];
      self.selectedShareeRight = CAL_CALENDAR_SHARED_RIGHT.NONE;
    }
  }
})();

'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The calendar module apis', function() {

  function headerContentTypeJsonChecker(header) {
    return header['Content-Type'] === 'application/json';
  }

  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function($httpBackend, calMoment, calendarAPI, calEventAPI, CALENDAR_CONTENT_TYPE_HEADER, CALENDAR_ACCEPT_HEADER, CALENDAR_GRACE_DELAY) {
      this.$httpBackend = $httpBackend;
      this.calMoment = calMoment;
      this.calendarAPI = calendarAPI;
      this.calEventAPI = calEventAPI;
      this.CALENDAR_CONTENT_TYPE_HEADER = CALENDAR_CONTENT_TYPE_HEADER;
      this.CALENDAR_ACCEPT_HEADER = CALENDAR_ACCEPT_HEADER;
      this.CALENDAR_GRACE_DELAY = CALENDAR_GRACE_DELAY;
    });

    var davDateFormat = 'YYYYMMDD[T]HHmmss';

    this.start = this.calMoment('2014-01-01');
    this.end = this.calMoment('2014-01-02');
    this.data = {
      match: {start: this.start.format(davDateFormat), end: this.end.format(davDateFormat)}
    };

    this.vcalendar = {
      id: 'id'
    };

  });

  describe('calEventAPI', function() {
    beforeEach(function() {
      this.vcalendar.toJSON = angular.identity.bind(null, JSON.stringify(this.vcalendar));
    });

    describe('get request', function() {
      it('should return the http response if status is 200', function(done) {
        this.$httpBackend.expectGET(/^\/dav\/api\/calendars\/test\?_=\d+$/, {Accept: this.CALENDAR_ACCEPT_HEADER}).respond(200, 'aResponse');

        this.calEventAPI.get('/dav/api/calendars/test', this.vcalendar)
          .then(function(response) {
            expect(response.data).to.deep.equal('aResponse');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 200', function(done) {
        this.$httpBackend.expectGET(/^\/dav\/api\/calendars\/test\?_=\d+$/, {Accept: this.CALENDAR_ACCEPT_HEADER}).respond(500, 'Error');

        this.calEventAPI.get('/dav/api/calendars/test', this.vcalendar)
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });

    });

    describe('create request', function() {

      it('should return an id if status is 202 and graceperiod is true', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json?graceperiod=' + this.CALENDAR_GRACE_DELAY, this.vcalendar.toJSON()).respond(202, {id: 'anId'});

        this.calEventAPI.create('/dav/api/calendars/test.json', this.vcalendar, {graceperiod: true})
          .then(function(response) {
            expect(response).to.deep.equal('anId');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 202 and graceperiod is true', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json?graceperiod=' + this.CALENDAR_GRACE_DELAY, this.vcalendar.toJSON()).respond(500, 'Error');

        this.calEventAPI.create('/dav/api/calendars/test.json', this.vcalendar, {graceperiod: true})
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return a http response if status is 201 and graceperiod is false', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', this.vcalendar.toJSON()).respond(201, 'aReponse');

        this.calEventAPI.create('/dav/api/calendars/test.json', this.vcalendar, {graceperiod: false})
          .then(function(response) {
            expect(response.data).to.equal('aReponse');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 201 and graceperiod is true', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', this.vcalendar.toJSON()).respond(500, 'Error');

        this.calEventAPI.create('/dav/api/calendars/test.json', this.vcalendar, {graceperiod: false})
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });
    });

    describe('modify request', function() {
      it('should return an id if status is 202', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json?graceperiod=' + this.CALENDAR_GRACE_DELAY, this.vcalendar.toJSON()).respond(202, {id: 'anId'});

        this.calEventAPI.modify('/dav/api/calendars/test.json', this.vcalendar, 'etag')
          .then(function(response) {
            expect(response).to.deep.equal('anId');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 202', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json?graceperiod=' + this.CALENDAR_GRACE_DELAY, this.vcalendar.toJSON()).respond(500, 'Error');

        this.calEventAPI.modify('/dav/api/calendars/test.json', this.vcalendar, 'etag')
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });
    });

    describe('getRight method', function() {
      var bodyRequest;

      beforeEach(function() {
        bodyRequest = {
          prop: ['cs:invite', 'acl']
        };
      });

      it('should return an Error if response.status is not 202', function() {
        this.$httpBackend.expect('PROPFIND', '/dav/api/calendars/calendars/id.json', bodyRequest, headerContentTypeJsonChecker).respond(500, 'Error');

        var catchSpy = sinon.spy();

        this.calendarAPI.getRight('calendars', this.vcalendar).catch(catchSpy);
        this.$httpBackend.flush();
        expect(catchSpy).to.have.been.calledWith(sinon.match({data: 'Error'}));

      });

      it('should return server body response if success', function() {
        this.$httpBackend.expect('PROPFIND', '/dav/api/calendars/calendars/id.json', bodyRequest, headerContentTypeJsonChecker).respond(200, 'body');

        var catchSpy = sinon.spy();

        this.calendarAPI.getRight('calendars', this.vcalendar).then(catchSpy);
        this.$httpBackend.flush();
        expect(catchSpy).to.have.been.calledWith(sinon.match.same('body'));
      });
    });

    describe('modifyShares', function() {
      var bodyRequest;

      beforeEach(function() {
        bodyRequest = 'bodyRequest';
      });

      it('should return an error if response.status is not 200', function() {
        var catchSpy = sinon.spy();

        this.$httpBackend.expect('POST', '/dav/api/calendars/homeId/calId.json', bodyRequest).respond(500, 'Error');
        this.calendarAPI.modifyShares('homeId', 'calId', bodyRequest).catch(catchSpy);
        this.$httpBackend.flush();

        expect(catchSpy).to.have.been.calledWith(sinon.match({data: 'Error'}));
      });

      it('should return server body response if success', function() {
        var thenSpy = sinon.spy();

        this.$httpBackend.expect('POST', '/dav/api/calendars/homeId/calId.json', bodyRequest).respond(200, 'body');
        this.calendarAPI.modifyShares('homeId', 'calId', bodyRequest).then(thenSpy);
        this.$httpBackend.flush();

        expect(thenSpy).to.have.been.calledOnce;
      });
    });

    describe('remove request', function() {
      it('should return an id if status is 202', function(done) {
        this.$httpBackend.expectDELETE('/dav/api/calendars/test.json?graceperiod=' + this.CALENDAR_GRACE_DELAY, {'If-Match': 'etag', Accept: 'application/json, text/plain, */*' }).respond(202, {id: 'anId'});

        this.calEventAPI.remove('/dav/api/calendars/test.json', 'etag')
          .then(function(response) {
            expect(response).to.deep.equal('anId');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 202', function(done) {
        this.$httpBackend.expectDELETE('/dav/api/calendars/test.json?graceperiod=' + this.CALENDAR_GRACE_DELAY, {'If-Match': 'etag', Accept: 'application/json, text/plain, */*' }).respond(500, 'Error');

        this.calEventAPI.remove('/dav/api/calendars/test.json', 'etag')
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });
    });

    describe('changeParticipation request', function() {
      it('should return a http response if status is 200', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', this.vcalendar.toJSON()).respond(200, 'aResponse');

        this.calEventAPI.changeParticipation('/dav/api/calendars/test.json', this.vcalendar, 'etag')
          .then(function(response) {
            expect(response.data).to.equal('aResponse');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return a http response if status is 204', function(done) {
        this.$httpBackend.expectPUT('/dav/api/calendars/test.json', this.vcalendar.toJSON()).respond(204, 'aResponse');

        this.calEventAPI.changeParticipation('/dav/api/calendars/test.json', this.vcalendar, 'etag')
          .then(function(response) {
            expect(response.data).to.equal('aResponse');
            done();
          });

        this.$httpBackend.flush();
      });

      it('should return an Error if response.status is not 200 and not 204', function(done) {
        this.$httpBackend.expectPUT('', this.vcalendar.toJSON()).respond(500, 'Error');

        this.calEventAPI.changeParticipation('/dav/api/calendars/test.json', this.vcalendar, 'etag')
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        this.$httpBackend.flush();
      });
    });
  });
});

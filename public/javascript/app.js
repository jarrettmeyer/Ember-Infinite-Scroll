var App = Ember.Application.create();
var Router = Ember.Router.map(function () {
});


var MAX_RECORDS = 310;


function fetchData(skip, take) {
  var rows = Ember.A([]);
  for (var i = skip; i < skip + take && i < MAX_RECORDS; i++) {
    var row = { counter: i + 1 };
    rows.pushObject(row);
  }
  return Ember.RSVP.resolve(rows);
}


App.IndexRoute = Ember.Route.extend({

  model: function () {
    return fetchData(0, 50);
  }

});


App.InfiniteScroll = Ember.Mixin.create({

  hasNewRecords: true,
  isLoadingData: false,
  pageSize: 50,
  threshold: 1.00,

  loadData: function () {
    console.error('Must overwrite loadData in controller.');
  },

  _afterLoadingData: function (newRecords) {
    this.set('isLoadingData', false);
    if (newRecords.length === 0) {
      this.set('hasNewRecords', false);
    }
    this.get('model').pushObjects(newRecords);
  },

  _onInit: function () {
    var _this = this;
    Ember.run.schedule('afterRender', function () {
      _this.get('_setupScrolling').bind(_this)();
    });
  }.on('init'),

  _onScroll: function () {
    if (this.get('isLoadingData')) {
      return;
    }
    this.set('isLoadingData', true);
    var recordCount = this.get('model.length');
    var pageSize = this.get('pageSize');
    return this.get('loadData')(recordCount, pageSize).then(this.get('_afterLoadingData').bind(this));
  },

  _setupScrolling: function () {
    var _this = this;
    var threshold = this.get('_threshold');
    Ember.$(window).on('scroll', function () {
      var topPosition = Ember.$(window).scrollTop();
      var docHeight = Ember.$(document).height();
      var windowHeight = Ember.$(window).height();
      var heightDiff = docHeight - windowHeight;
      var loadPosition = Math.floor(threshold * heightDiff);
      if (topPosition >= loadPosition) {
        _this.get('_onScroll').bind(_this)();
      }
    });
  },

  _threshold: Ember.computed('threshold', function () {
    var threshold = this.get('threshold');
    if (0 <= threshold && threshold <= 1.00) {
      return threshold;
    }
    return 1.00;
  })

});


App.IndexController = Ember.Controller.extend(App.InfiniteScroll, {

  pageSize: 25,
  threshold: 0.80,

  loadData: function (skip, take) {
    return fetchData(skip, take);
  }

});

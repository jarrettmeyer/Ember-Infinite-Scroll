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

  /**
   * Value for number of records to fetch from the API at a time. This value may
   * be overwritten in the controller for a smaller or larger fetch size.
   */
  pageSize: 50,

  /**
   * Scrolling threshold as a proportion of the page before records are fetched.
   * This value should be between 0.00 and 1.00.
   */
  threshold: 0.80,

  /**
   * This function must be overwritten in your controller. The function takes
   * two arguments: `skip` and `take`. The function should return a promise of
   * new records from your API.
   */
  loadData: function (/* skip, take */) {
    console.error('Must overwrite loadData in controller.');
  },

  /**
   * Value is `true` if new records were returned from the most recent API call.
   * Otherwise, `false`.
   */
  _hasNewRecords: true,

  /**
   * Value is `true` if data is currently being loaded from the API. Otherwise,
   * `false`.
   */
  _isLoadingData: false,

  /**
   * Function called after loading data is completed.
   */
  _afterLoadingData: function (newRecords) {
    this.set('_isLoadingData', false);
    if (newRecords.length === 0) {
      this.set('_hasNewRecords', false);
    }
    this.get('model').pushObjects(newRecords);
  },

  /**
   * Function called on mixin initialization.
   */
  _onInit: function () {
    var _this = this;
    // After rendering the screen is complete, set up the page scrolling.
    Ember.run.schedule('afterRender', function () {
      _this.get('_setupScrolling').bind(_this)();
    });
  }.on('init'),

  /**
   * Callback when scrolling threshold is reached.
   */
  _onScroll: function () {
    if (this.get('_isLoadingData')) {
      return;
    }
    this.set('_isLoadingData', true);
    var recordCount = this.get('model.length');
    var pageSize = this.get('pageSize');
    return this.get('loadData')(recordCount, pageSize).then(this.get('_afterLoadingData').bind(this));
  },

  /**
   * Setup the page scrolling.
   */
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

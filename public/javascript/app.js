var App = Ember.Application.create();
var Router = Ember.Router.map(function () {
});

/**
 * Number of records to fetch from the API for the initial data load.
 */
var INITIAL_FETCH = 50;

/**
 * Maximum number of records to fetch from the API. This will let us test the
 * feature where no records are returned from the API.
 */
var MAX_RECORDS = 310;

/**
 * Default page size.
 */
var PAGE_SIZE = 50;


/**
 * You will need to write your own function to fetch data from your API.
 */
function fetchData(options) {
  options = options || {};
  var skip = options.skip || 0;
  var take = options.take || PAGE_SIZE;
  console.log('Fetching data, skip: ' + skip + ', take: ' + take + '.');
  var rows = Ember.A([]);
  for (var i = skip; i < skip + take && i < MAX_RECORDS; i++) {
    var row = { counter: i + 1 };
    rows.pushObject(row);
  }
  return Ember.RSVP.resolve(rows);
}


App.IndexRoute = Ember.Route.extend({

  model: function () {
    return fetchData({ skip: 0, take: INITIAL_FETCH });
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
  loadData: function (/* options */) {
    console.error('Must overwrite loadData in controller.');
  },

  /**
   * Value is `true` if new records were returned from the most recent API call.
   * Otherwise, `false`. If `_hasNewRecords` is false, no new attempts to fetch
   * data will be made.
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
   * Callback when scrolling threshold is reached. Do not attempt to load data if
   * we are already in the process of loading data or if no records were returned
   * from the server on our previous attempts.
   */
  _onScroll: function () {
    if (this.get('_isLoadingData')) {
      return;
    }
    if (!this.get('_hasNewRecords')) {
      return;
    }
    this.set('_isLoadingData', true);
    var loadDataOptions = {
      skip: this.get('model.length'),
      take: this.get('pageSize')
    };
    return this.get('loadData')(loadDataOptions).then(this.get('_afterLoadingData').bind(this));
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


/**
 * This will be your controller. You will need to write your own `loadData`
 * function. You may overwrite the `pageSize` and `threshold` variables in your
 * controller.
 */
App.IndexController = Ember.Controller.extend(App.InfiniteScroll, {

  maxRecords: MAX_RECORDS,
  pageSize: 25,
  threshold: 0.80,

  loadData: function (options) {
    return fetchData(options);
  }

});

var App = Ember.Application.create();
var Router = Ember.Router.map(function () {
});

/**
 * Number of records to fetch from the API for the initial data load.
 */
var INITIAL_FETCH = 25;

/**
 * Simulate a delay to load data from the server.
 */
var LOAD_DELAY = 1000; // in ms

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
 * You will need to write your own function to fetch data from your API. As usual,
 * your function to load data needs to return a promise.
 */
function fetchData(options) {
  options = options || {};
  var skip = options.skip || 0;
  var take = options.take || PAGE_SIZE;
  console.log('Simulate fetching data, skip: ' + skip + ', take: ' + take + '.');
  return new Ember.RSVP.Promise(function (resolve) {
    setTimeout(function () {
      var rows = Ember.A([]);
      for (var i = skip; i < skip + take && i < MAX_RECORDS; i++) {
        var row = { counter: i + 1 };
        rows.pushObject(row);
      }
      return resolve(rows);
    }, LOAD_DELAY);
  });
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
    this.get('_ensureScrollbarsVisible').bind(this)();
  },

  /**
   * If the window height is greater than or equal to the document height, then
   * no scroll bars will be visible. If there are no scroll bars, then there will
   * be no scroll trigger. If there is no scroll trigger, then new data will never
   * be loaded from the API.
   */
  _ensureScrollbarsVisible: function () {
    var _this = this;
    var windowHeight = _this.get('_$window').height();
    var documentHeight = _this.get('_$document').height();
    Ember.run.schedule('afterRender', function () {
      if (windowHeight >= documentHeight) {
        _this.get('_onScroll').bind(_this)();
      }
    });
  },

  /**
   * Function called on mixin initialization.
   */
  _onInit: function () {
    var _this = this;
    Ember.run.schedule('afterRender', function () {
      _this.get('_ensureScrollbarsVisible').bind(_this)();
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
      var topPosition = _this.get('_$window').scrollTop();
      var docHeight = _this.get('_$document').height();
      var windowHeight = _this.get('_$window').height();
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
  }),

  _$document: Ember.computed(function () {
    return Ember.$(document);
  }),

  _$window: Ember.computed(function () {
    return Ember.$(window);
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

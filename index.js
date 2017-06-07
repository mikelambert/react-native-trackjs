'use strict';

import {
  Dimensions,
  Platform,
} from 'react-native';

class FakeImage {
  set src(url) {
    // fetch() tries to process the actual data and return it.
    // But trackjs returns nothing, and causes console warnings.
    // So let's just call out to XMLHttpRequest here,
    // even though it's strange to be doing so from a React Native app.
    // Update: Though hm....seems these give errors too from the React Native layer:
    // [RCTNetworking.m:330] Received data was not a string, or was not a recognised encoding.
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();
  }
};

var FakeDocument = {
  get documentElement() {
    var window = Dimensions.get('window');
    return {
      clientWidth: window.width,
      clientHeight: window.height,
    };
  },
};

function initialize() {
  try {
    // Try accessing the useragent (which will work from the Chrome debugger):
    window.navigator.userAgent[0];
    // We are running in a Chrome debugger. Let them continue as-is.
    // In theory, this shouldn't ever happen because we don't run in __DEV__ mode.
  } catch (e) {
    // If it fails, pollyfill it with our stubbed versions.
    window.navigator.userAgent = 'React-Native '  + Platform.OS + ', Version ' + Platform.Version;
    window.location = 'react-native-app';
  }

  XMLHttpRequest.prototype.withCredentials = true;

  global.document = window.document = FakeDocument;
  global.Image = FakeImage;
}

function wrap(wrappedFunc) {
  // This ensures that TrackJS uses XMLHttpRequest
  // Because TrackJS expects too much when it sees addEventListener, hide it during load time.
  var addEventListener = window.addEventListener;
  window.addEventListener = undefined;
  try {
    wrappedFunc();
  } finally {
    window.addEventListener = addEventListener;
  }
}

function init(config) {
  // Check if trackJs enabled is set
  if (typeof config.enabled === 'undefined') {
    // Disable trackJs in development using the variable set up by react-native's packager
    // Don't send exceptions from __DEV__, it's way too noisy!
    // Live reloading and hot reloading in particular lead to tons of noise...
    config.enabled = !__DEV__;
  }

  // If we've already set ourselves up, early-return
  if (window.trackJs) {
    return;
  }

  // Set up the magical config.
  window._trackJs = config;

  // TODO: maybe want to override fetch() to log our own events for the server??
  // (ie search for 'watchNetworkObject', and do something similar for fetch() API)
  // Though really, this should be done inside trackJs, since fetch() is
  // a WHATWG standard, being supported by more and more browsers:
  // http://caniuse.com/#search=fetch

  // TrackJS will wrap these for its tracking events, if they exist:
  // onDocumentClicked: null,
  // onInputChanged: null,
  // addEventListener: null,
  // attachEvent: null,
  // But Redux state-based apps are becoming more and more common
  // in the React Native world, and combining them with their existing "logging"
  // will obviate the need for this kind of tracking. Though I'm sure it will be
  // useful for some people still who don't want to log internal state to the console
  // but do what to log it to TrackJS. But that's a TBD.

  initialize();

  // Here's the main magic! Initialize everything with our monkey patching
  wrap(() => require('trackjs/tracker'))

    // Sometimes this will be empty, if we have any problems initializing
    // in the require('trackjs') above (and don't initialize the windowWatcher).
  if (window.onerror) {
    var originalHandler = global.ErrorUtils.getGlobalHandler();
    var onError = function(e) {
      // Surround this one "just in case" window.onerror changes.
      if (window.onerror) {
        // window.onerror = function(message, source, lineno, colno, error) { ... }
        window.onerror(e.message, null, null, null, e);
      }
      // Again, just in case. Don't want to error in our error handler!
      if (originalHandler) {
        // And then re-throw the exception with the original handler
        originalHandler(e);
      }
      //window.trackJs.windowWatcher.onError('window', e);
    };
    global.ErrorUtils.setGlobalHandler(onError);
  }
}

module.exports = {
  init,
}


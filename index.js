'use strict';

import {
  Dimensions,
  Platform,
} from 'react-native';

function init(token) {
  // Check the variable set up by react-native's packager
  if (__DEV__) {
    // Don't send exceptions from __DEV__, it's way too noisy!
    // Live reloading and hot reloading in particular lead to tons of noise...
    // Plus the Chrome browser ends up creating a different environment,
    // one that we shouldn't polyfill all the logic below.
    // Maybe make this configurable?
    return;
  }
  // If we've already set ourselves up, early-return
  if (window.trackJs) {
    return;
  }

  window._trackJs = {
    token: token,
  };
  try {
    // Try accessing the useragent:
    window.navigator.userAgent[0];
    // We are running in a Chrome debugger. Let them continue as-is.
    // In theory, this shouldn't ever happen because we don't run in __DEV__ mode.
  } catch (e) {
    // If it fails, pollyfill it with our stubbed versions.
    window.navigator = {
      userAgent: 'React-Native '  + Platform.OS + ', Version ' + Platform.Version,
    }
    window.location = 'react-native-app';
  }


  // TODO: maybe want to override fetch() to log our own events for the server?? (search for 'watchNetworkObject')

  // For tracking events the user makes, for the history log. Should be fine to ignore?
  // onDocumentClicked: null,
  // onInputChanged: null,
  // addEventListener: null,
  // attachEvent: null,

  global.Image = class Image {
    set src(url) {
      // fetch() tries to process the actual data and return it.
      // But trackjs returns nothing, and causes console warnings.
      // So let's just call out to XMLHttpRequest here,
      // even though it's strange to be doing so from a React Native app.
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.send();
    }
  };

  global.document = window.document = {
    get documentElement() {
      var window = Dimensions.get('window');
      return {
        clientWidth: window.width,
        clientHeight: window.height,
      };
    },
  };

  // So TrackJS uses XMLHttpRequest
  XMLHttpRequest.prototype.withCredentials = true;

  // Because TrackJS expects too much when it sees addEventListener, hide it during load time.
  var addEventListener = window.addEventListener;
  window.addEventListener = undefined;
  try {
    require('trackjs/tracker');
  } finally {
    //global.document = undefined;
    window.addEventListener = addEventListener;
  }

  var originalHandler = global.ErrorUtils.getGlobalHandler();
  var onError = function(e) {
    // window.onerror = function(message, source, lineno, colno, error) { ... }
    if (window.onerror) {
      window.onerror(e.message, null, null, null, e);
    }
    // And then re-throw the exception with the original handler
    originalHandler(e);
    //window.trackJs.windowWatcher.onError('window', e);
  };
  global.ErrorUtils.setGlobalHandler(onError);
}

module.exports = {
  init,
}


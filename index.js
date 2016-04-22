import { Platform } from 'react-native';

function initializeTrackJs(token) {
  if (window._trackJs) {
    return;
  }

  window._trackJs = {
    token: token,
  };

  window['navigator'] = {
    userAgent: 'React-Native '  + Platform.OS + ', Version ' + Platform.Version,
  };
  window['location'] = 'react-native-app';

  // TODO: maybe want to override fetch() to log our own events for the server?? (search for 'watchNetworkObject')

  // For tracking events the user makes, for the history log. Should be fine to ignore?
  // onDocumentClicked: null,
  // onInputChanged: null,
  // addEventListener: null,
  // attachEvent: null,

  global.Image = class Image {
    set src(val) { fetch(val); }
  };

  global.document = {
    documentElement: {
      clientHeight: 0,
      clientWidth: 0,
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
    window.onerror(e.message, null, null, null, e);
    // And then re-throw the exception with the original handler
    originalHandler(e);
    //window.trackJs.windowWatcher.onError('window', e);
  };
  global.ErrorUtils.setGlobalHandler(onError);
}

module.exports = initializeTrackJs;

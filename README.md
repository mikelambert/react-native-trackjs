react-native-trackjs
===============================

Reports javascript exceptions in React Native to the TrackJS server, by wrapping the trackjs js distribution.

Usage
-----

To use, add this code to your index.ios.js and index.android.js (or some library included by both).

```
import trackjs from 'react-native-trackjs';
trackjs.init({token: myTrackJsToken});
```

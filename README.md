# Alarm Timer for the Mixed Reality Extension SDK

This is a countdown timer which you can embed into an AltspaceVR virtual world. It's written using the [Mixed Reality
Extension SDK](https://github.com/Microsoft/mixed-reality-extension-sdk).

## Prerequisites

Node.js 14 with Typescript support.

## How to Build and Run

* Clone the repository and
* Change to the top-level directory of the repository.
* If you want to access the MRE by a hostname other than _localhost_,
create a _.env_ file to define your desired hostname (see _.env.example_).
Note, that MRE SDK can detect correctly the settings used
by some popular hosting environments, notably Azure.
* `npm install` This will install all dependent packages. (and will do very
little if there are no changes).
* `npm run build` This should not report any errors.
* `npm start` This should print "INF: Multi-peer Adapter listening on..."

In AltspaceVR:

* Go to your personal home
* Make sure you are signed in properly, not a guest
* Activate the Space Editor (only available if you indicate you want to participate in the Early Access Program in your AltspaceVR settings)
* Click Basics group
* Click on SDKApp
* For the URL field, enter `ws://localhost:3901`. If you've configured a different hostname, use that instead.
* Click Confirm
* If the app doesn't seem to load, click on the gear icon next the MRE object
in to the present objects list, and make sure "Is Playing" is checked.
* After the app has been placed, you will see the MRE Anchor (the white box
with red/green/blue spikes on it), rendering on top of the MRE. You can use the
anchor to move the MRE around. To hide the anchor, uncheck "Edit Mode".

### Behavior

You should now see a counter counting down from the count value you've set towards 0.
Clicking it the first time will stop any alarm that's playing, or if the
counter is still counting, it will be paused. Clicking a second time
will either increment the count time by the increment value, if it is non-zero, or
if it is 0, set the counter to the initial count value.

<img src='appearance.jpg'/>

### Configuration

Many aspects of the timer's operation can be customized.
This is done using query parameters in the URL.

* _c_ - Set the initial _count_ in seconds. The default value is 60.
* _i_ - Set the _increment_ in seconds. The default value is 60.
If the value is set to _0_ the behavior changes. A click would instead set the count back to the initial count value.
* _v_ - Set the _volume_ of the alarm. A value between 0 and 100. The default is 50.
* _l_ - Loop the sound until paused. The allowed values are _y_ or _n_. The default is _n_.
* _p_ - Pause-only mode. While the sound is playing, clicking the MRE will alternately pause and resume
the playback. The allowed values are _y_ or _n_. The default is _n_.
* _am_ - Ambient sound. If enabled, set the sound to play with uniform volume within a large distance from the source.
The allowed values are _y_ or _n_. The default is _n_.
* _mo_ - Moderator only. If set to _y_, then only moderators can view and manipulate the counter.
* _as_ - Alarm sound. An _http_ or _https_ URL pointing to of the audio file to play as alarm.
Alternatively, the relative path of the audio file in the public directory from which media are served.
It should point to a _.wav_ or _.ogg_ file. Note, that if a full URL is used, it will likely require
percent-quoting of some characters.

Example: Run the MRE locally with an initial count of 30 seconds, incremented by 15 seconds whenever the counter is clicked.
A custom audio file _myalarm.wav_ is specified

`ws://localhost:3901/?c=30&i=15&as=myalarm.wav`

Example: Run the MRE on a server with SSL. Set the counter to 60 seconds whenever clicked. Only moderators can view the timer.

`wss://my.ssl.server.io/?c=60&i=0&mo=y`

### Hosting in the Cloud

This MRE is built using Node.JS 14. Check out [DEPLOYING.md](https://github.com/Microsoft/mixed-reality-extension-sdk/blob/master/DEPLOYING.md) in the SDK repo for more suggestions.

In particular, deployment to a Heroku Dyno is well supported. To deploy there, set-up your project
to use Node-JS and set the environment variable BASE_URL to be your Heroku https URL.
Use the corresponding _wss://_ URL to access the MRE in the world. Everything else should
be handled automatically by Heroku.

### Using custom audio files

To use your own audio files, you need to get them into the _public_ directory in _.ogg_ or _.wav_ files. Then you can use
the _as_ parameter to specify your own audio file, A way to accomplish this in Heroku (or other environments that use
git push to deploy) would be to clone this repository, then commit your audio files to your local Git repository and
push that to your hosting environment.

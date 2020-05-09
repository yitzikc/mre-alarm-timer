# Alarm Timer for the Mixed Reality Extension SDK

This is a countdown timer which you can embed into an AltspaceVR virtual world. It's written using the [Mixed Reality
Extension SDK](https://github.com/Microsoft/mixed-reality-extension-sdk).

## Prerequisites

Node.js 14.1 with Typescript support.

## How to Build and Run

* Clone the repository and
* Change to the top-level directory of the repository.
* If you want to access the MRE by a hostname other than _localhost_,
create a _.env_ file to define your desired hostname (see _.env.example_).
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

You should now see a counter counting down from 1 minute. Clicking it will increment the count time by 1 minute.

<img src='appearance.jpg'/>

### Configuration

The initial count and the increment applied to the counter when clicked can both be customized.
This is done using query parameters in the URL.

* _c_ - Set the initial _count_ in seconds. The default value is 60.
* _i_ - Set the _increment_ in seconds. The default value is 60.

Example: for running the MRE locally with an initial count of 30 seconds, incremented by 15 seconds whenever the counter is clicked:

`ws://localhost:3901/?c=30&i=15`

### Hosting in the Cloud

This MRE is built using Node.JS 14. Check out [DEPLOYING.md](https://github.com/Microsoft/mixed-reality-extension-sdk/blob/master/DEPLOYING.md) in the SDK repo for more suggestions.

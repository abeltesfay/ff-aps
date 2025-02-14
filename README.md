# Firefox AWS Plugin Searchbox
This extension creates a searchbox on the AWS SAML login page (signin.aws.amazon.com/saml) if your organization uses it, and also provides keyboard functionality to easily log in to AWS from their account selection screen. Live your fanciest life with this extension.

*Installing this unsigned extension requires you to be running Firefox Extended Support Release, Developer Edition, or Nightly version! Firefox Browser alone will NOT allow unsigned extensions. Chrome may work out of the box too.*

**Some assembly may be required**

## Project Anatomy
```
icons/                  Delicious icon
output/                 Where pkg.cmd/pkg.sh drops installable extension
screenshots/            Screenshots of extension in action
fancy_searchbox.js      The goods (self-contained javascript of all logic/styling)
license-gnugplv3.txt    Applies to everything here, except icons (I do not own it)
manifest.json           Meta file for Firefox/Chrome to understand extension
README.md               You are here
```

## Latest changes
```
2025-02-14 Version 1.4
    Add support for jumping between accounts instead of roles by holding down control key when using arrows
    
2024-11-05 Version 1.3
    Add support for accounts with multiple roles
    
2024-02-26 Version 1.2.1
    Fix bug where single click has double prompt
    
2023-01-14 Version 1.2
    Add single-click login functionality

2022-03-07 Version 1.1
    Add tags to accounts for filtering and grouping
    Add export and import functionality

2022-03-04 Version 1.0
    Space-delimited, word-based, 'AND' filtering through an input box
    Arrow keys to select a high-level account
    Enter to log in once selected
    Escape key to re-focus on and clear out input box
    Confirmation if logging into prod/prd accounts
    Delicious drumstick logo
```

## Screenshots

AWS SAML Login Page with searchbox extension
![AWS Login Page](/screenshots/example-01-sso-listing.png)

Filtered accounts, selected using arrow keys. You can hit enter to log in
![Filtered and Selected Using Arrow Keys](/screenshots/example-02-filtered-selected-with-arrow-keys.png)

## Create the unsigned, loadable Firefox extension .zip from this folder

  1. Zip folder without .git/ either [manually](https://stackoverflow.com/a/31043045), or using the provided pkg.cmd, or *(TODO)* pkg.sh on unix-based/macos systems

  1. *(Optional)* Rename zip to to have an .xpi extension -- zip is fine though.

  1. Verify the .zip file shows up under the output directory called **ff-aps-ext.zip**

## Permanently load unsigned extension from .zip

  1. Verify you're running a compatible [Firefox version](https://support.mozilla.org/en-US/kb/add-on-signing-in-firefox?as=u&utm_source=inproduct#w_what-are-my-options-if-i-want-to-use-an-unsigned-add-on-advanced-users): Firefox Browser (ESR), Developer Edition, or Nightly, and NOT simply 'Firefox Browser'
  
  1. Go to about:config, click through the warnings, and change `xpinstall.signatures.required` to false

  1. Click the hamburger (3 lines) button at the top right in Firefox and click Add-ons and Themes (ctrl+shift+a)

  1. On the left click "Extensions"

  1. On the right click the small gear icon 

  1. Click "Install Add-on From File..."

  1. Select the zip

  1. Enjoy your fancy new life

## Temporarily load this extension in developer mode
  
  1. Go to about:debugging in a new Firefox tab

  1. Click "This Firefox" on the left

  1. Under "Temporary Extensions", click "Load Temporary Add-on..."

  1. Select the zip file

  1. Log into AWS via the go URL
  
## Chrome Support

  1. Go to hamburger (3 lines) button at the top right

  1. Drill down into "More Tools" -> "Extensions"

  1. Click "Developer Mode" at the top right to turn it on

  1. Click "Load unpacked" and add this entire folder

  1. Enjoy your Chrome version of ff-aps, aka chr-aps! :)

## Brave Support

  1. Go to hamburger (3 lines) button at the top right

  1. Select "Extensions"

  1. Click "Developer Mode" at the top right to turn it on

  1. Click "Load unpacked" and add this entire folder

  1. Enjoy your Brave version of ff-aps, aka br-aps! :)
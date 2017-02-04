
// Client ID and API key from the Developer Console
var CLIENT_ID = '808734092016-u5ss25nmh0j9o5ponusu5l3tnqb7vl9g.apps.googleusercontent.com';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file'].join(' ');

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

window.handleClientLoad = handleClientLoad;

/**
  *  On load, called to load the auth2 library and API client library.
  */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
  *  Initializes the API client library and sets up sign-in state
  *  listeners.
  */
function initClient() {
  gapi.client.init({
    discoveryDocs: DISCOVERY_DOCS,
    clientId: CLIENT_ID,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    authorizeButton.onclick = handleAuthClick;
    signoutButton.onclick = handleSignoutClick;
  });
}

/**
  *  Called when the signed in status changes, to update the UI
  *  appropriately. After a sign-in, the API is called.
  */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    listFiles();
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
  *  Sign in the user upon button click.
  */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
  *  Sign out the user upon button click.
  */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
  * Append a pre element to the body containing the given message
  * as its text node. Used to display the results of the API call.
  *
  * @param {string} message Text to be placed in pre element.
  */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

/**
  * Print files.
  */
function listFiles() {
  gapi.client.drive.files.list({
    q: "trashed = false and properties has { key='isAnvakaStreakFolder' and value='true' }",
   // q: "'0B8W6vQAc4byGMHh2RnNpa2JSOGM' in parents",
    pageSize: 10,
    fields: "nextPageToken, files(id, name)"
  }).then(function(response) {
    appendPre('Files:');
    var files = response.result.files;
    if (files && files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        appendPre(JSON.stringify(file, null, 2));
      }
    } else {
      appendPre('No files found.');
    }
  });
}

window.createFolder = createFolder;

function createFolder(name) {
  var fileMetadata = {
    name : name,
    mimeType : 'application/vnd.google-apps.folder',
    properties: {
      isAnvakaStreakFolder: 'true'
    }
  };
  gapi.client.drive.files.create({
    resource: fileMetadata,
    fields: 'id'
  }).then((file) =>{
      console.log('Folder Id: ', file.id);
  })
}

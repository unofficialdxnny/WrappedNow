// Initialize vars
let access_token = null;
let user_id = null;
let songsdisplayed = false;
let artistsdisplayed = false;
let time_range = 'short_term';
let time_range_display = 'last 4 weeks';
let playlist_uris = [];
let limit = '20';

// Authorization. Key from spotify api website, must send a waypoint through their settings
// https://developer.spotify.com/documentation/general/guides/authorization-guide/
function authorize() {
  const client_id = '335344394728464e9062f8d327bb88b8';
  const redirect_uri = 'https://gilded-puppy-d6a3c7.netlify.app/wrapped';
  const scopes = 'user-top-read playlist-modify-public playlist-modify-private';

// Store the date
const d = new Date();
let date = [d.getMonth() +  1, d.getDate(), d.getFullYear()];
date = date.join('/');

  // Create a Token, and finalize it
  // final result will lead to a humongous URL Link
  // with the necessary stuff
  let url = 'https://accounts.spotify.com/authorize';
  url += '?response_type=token';
  url += '&client_id=' + encodeURIComponent(client_id);
  url += '&scope=' + encodeURIComponent(scopes);
  url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
  // Paste the final URL format
  window.location = url;
}

// Grab the access token
// with the help of regex
// But first do an if
function getHashValue(key) {
  if (typeof key !== 'string') {
    key = '';
  } else {
    key = key.toLowerCase();
  }
  const keyAndHash = location.hash.match(new RegExp(key + '=([^&]*)'));
  const value = keyAndHash ? keyAndHash[1] : '';
  return value;
}

function updateRange() {
  time_range = $('input[name=time]:checked', '#timeForm').val();
  switch (time_range) {
    case 'short_term':
      time_range_display = 'last 4 weeks';
      break;
    case 'medium_term':
      time_range_display = 'last 6 months';
      break;
    case 'long_term':
      time_range_display = 'all time';
      break;
  }
}

// Refresh display according to the newly updated controls
function refresh() {
  if (songsdisplayed) {
    getTopTracks();
  } else if (artistsdisplayed) {
    getTopArtists();
  }
}

function checkWidth() {
  if (window.innerWidth < 1200) {
    $('html, body').animate({
      scrollTop: $("#results-container").offset().top
    }, 500);
  }
}

// Do a quick check if user has signed in,
// If user hasn't, prompt him to log in.
function getUserId() {
  if (access_token) {
    $.ajax({
      url: 'https://api.spotify.com/v1/me',
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
      success: function(response) {
        user_id = response.id;
        console.log(response.id);
        getCurrentlyPlaying();
      },
      error: function(jqXHR, textStatus, errorThrown) {
        ifError(jqXHR.status);
      },
    });
  } else {
    alert('Please log in to Spotify.');
  }
}


function getCurrentlyPlaying() {
  if (access_token) {
    $.ajax({
      url: 'https://api.spotify.com/v1/me/player/currently-playing',
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
      success: function(response) {
        console.log('Currently Playing Response:', response);
        if (response.item) {
          displayCurrentlyPlaying(response.item);
        } else {
          console.log('No currently playing song.');
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.error('Error fetching currently playing song:', textStatus, errorThrown);
        ifError(jqXHR.status);
      },
    });
  } else {
    alert('Please log in to Spotify.');
  }
}

function displayCurrentlyPlaying(song) {
  // Assuming you have a container with the id 'currently-playing-container' in your HTML
  $('#currently-playing-container').html(`
    <div id="currently-playing">
      <img src="${song.album.images[0].url}" alt="Album Cover" class="album-cover">
      <div class="song-details">
        <h3>${song.name}</h3>
        <p>By ${song.artists[0].name}</p>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${(song.progress_ms / song.duration_ms) * 100}%"></div>
      </div>
    </div>
  `);
}


// Updated getTopArtists function
function getTopArtists() {
  $('#artist-button').addClass("loading");
  if (access_token) {
      $.ajax({
          url: 'https://api.spotify.com/v1/me/top/artists',
          data: {
              limit: limit,
              time_range: time_range,
          },
          headers: {
              'Authorization': 'Bearer ' + access_token,
          },
          success: function(response) {
              $('#artist-button').removeClass("loading");
              $('#results-container').empty();
              let resultsHtml = '<div class="ui stackable three column grid container content" id="results">';
              response.items.forEach((item, i) => {
                  let name = item.name;
                  let url = item.external_urls.spotify;
                  let image = item.images[1].url;
                  resultsHtml += `
                      <div class="column artist item">
                          <a href="${url}" target="_blank">
                              <img src="${image}" class="ui image">
                          </a>
                          <h4 class="title">${i + 1}. ${name}</h4>
                      </div>`;
              });
              resultsHtml += '</div>';
              $('#results-container').html('<h2>Top Artists</h2>' + resultsHtml);
              artistsdisplayed = true;
              songsdisplayed = false;
              checkWidth();
          },
          error: function(jqXHR, textStatus, errorThrown) {
              ifError(jqXHR.status);
          },
      });
  } else {
      alert('Please log in to Spotify.');
  }
}

// Updated getTopTracks function
function getTopTracks() {
  $('#track-button').addClass("loading");
  if (access_token) {
      $.ajax({
          url: 'https://api.spotify.com/v1/me/top/tracks',
          data: {
              limit: limit,
              time_range: time_range,
          },
          headers: {
              'Authorization': 'Bearer ' + access_token,
          },
          success: function(response) {
              $('#track-button').removeClass("loading");
              playlist_uris = [];
              $('#results-container').empty();
              let resultsHtml = '<div class="ui stackable three column grid container content" id="results">';
              if (response.items.length === 0) {
                  resultsHtml += '<p>No top tracks found.</p>';
              } else {
                  response.items.forEach((item, i) => {
                      playlist_uris.push(item.uri);
                      let trackName = item.name;
                      let artistName = item.artists[0].name;
                      let url = item.external_urls.spotify;
                      let image = item.album.images[1].url;
                      resultsHtml += `
                          <div class="column track item">
                              <a href="${url}" target="_blank">
                                  <img src="${image}" class="ui image">
                              </a>
                              <h4>${i + 1}. ${trackName} <br> ${artistName}</h4>
                          </div>`;
                  });
              }
              resultsHtml += '</div>';
              $('#results-container').html('<h2>Top Tracks</h2>' + resultsHtml);
              songsdisplayed = true;
              artistsdisplayed = false;
              checkWidth();
          },
          error: function(jqXHR, textStatus, errorThrown) {
              if (jqXHR.status === 401) {
                  ifError(jqXHR.status);
              } else {
                  $('#track-button').removeClass("loading");
                  $('#results-container').html('<p>Error retrieving top tracks. Please try again later.</p>');
              }
          },
      });
  } else {
      alert('Please log in to Spotify.');
  }
}

// error mechanism
function ifError(error) {
  retryLogin();
  disableControls();
  let errorMessage;
  switch (error) {
    case 401:
      errorMessage = 'Unauthorized. Please log in to Spotify.';
      break;
    case 429:
      errorMessage = 'Too many requests. Please try again later.';
      break;
    default:
      errorMessage = 'Unable to authorize through Spotify Web API. Please try logging in again.';
  }
  alert(errorMessage);
}

function retryLogin() {
  $('#instructions').css('display', 'block');
  $('#login').css('display', 'block');
}

$(document).ready(function() {
  initialize();
  access_token = getHashValue('access_token');

  function enableControls() {
    $('#instructions').css('display', 'none');
    $('#login').css('display', 'none');
    $('#button-segment').removeClass("disabled");
    $('#timeForm').removeClass("disabled");
    $('#numForm').removeClass("disabled");
  }

  function disableControls() {
    $('#button-segment').addClass("disabled");
    $('#track-button').addClass("disabled");
    $('#artist-button').addClass("disabled");
    $('#timeForm').addClass("disabled");
    $('#numForm').addClass("disabled");
  }

  function initialize() {
    $('#timeForm input').on('change', function() {
      updateRange();
      refresh();
    });

    const slider = document.getElementById("numResponses");
    slider.oninput = function() {
      limit = $('#numResponses').val().toString();
      $('#number').html("Results: " + limit);
    }

    $('#numResponses').on('change', refresh);
  }

  if (access_token) {
    getUserId();
    enableControls();
  } else {
    disableControls();
  }
});

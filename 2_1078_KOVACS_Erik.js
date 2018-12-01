(function() {
  let app = {};

  app.metadataUrl = "./media/metadata/metadata.json";
  app.configFile = "appConfig";
  app.errorTimeout = 4000;
  app.pauseBetween = 5000;
  app.currentVideoId = null;
  app.isPlaying = true;

  // Read values from localStorage or pass defaults
  app.initialise = () => {
    // Try to load configs from localStorage
    app.store = window.localStorage;
    const configJSON = app.store.getItem(app.configFile);
    if (configJSON === null) {
      // Load defaults
      app.currentVideoId = null;
      app.isPlaying = false;
      app.isMute = true;
      app.autoplay = true;
      app.isHistogramActive = false;
      app.playlist = [];
    } else {
      // Set preferences
      const config = JSON.parse(configJSON);
      for (let setting in config) {
        app[setting] = config[setting];
      }
    }

    // Finally, init buttons
    const muteUnmuteButton = document.getElementById("mute-unmute");
    muteUnmuteButton.className = app.isMute ? "unmute" : "mute";
    const histogramCheckbox = document.getElementById("histogram");
    histogramCheckbox.checked = app.isHistogramActive;
    const autoplayCheckbox = document.getElementById("autoplay");
    autoplayCheckbox.checked = app.autoplay;
  };

  // Save preferences before leaving the page
  app.saveState = () => {
    app.store = !app.store ? window.localStorage : app.store;
    const { isMute, autoplay, isHistogramActive, playlist } = app;
    // Save a JSOn with settings to localStorage
    app.store.setItem(
      app.configFile,
      JSON.stringify({
        isMute,
        autoplay,
        isHistogramActive,
        playlist
      })
    );
  };

  // This is where the fun is. It gets the videos and loads the first one in the list.
  app.getPlaylist = function() {
    // Start with an empty playlist. Easier this way
    app.resetPlaylist();

    // Initialise our drawing context
    app.refreshCanvas();

    // Get the metadata JSON where we have data about the videos
    fetch(app.metadataUrl)
      .then(data => data.json())
      .then(data => {
        // Loop through the videos
        data.videos.forEach((video, i) => {
          // For autoplay
          app.playlist.push(video);

          const { id, title, subtitle, src, thumbnail } = video;

          // If we have no requested video, load our first video
          // Conversely, if we know which video was chosen, load that
          // Do not add the current video to list, just like YouTube
          if (
            (app.currentVideoId === null && i === 0) ||
            app.currentVideoId === id
          ) {
            // Set the id in case it was null
            if (!app.currentVideoId) app.currentVideoId = id;

            app.loadVideo(app.ctx, title, src);
            return;
          }

          // Add rest of videos to the playlist
          const playlistHtml = app.playlistEntryFactory(
            id,
            title,
            subtitle,
            thumbnail
          );
          app.playlistElement.insertAdjacentHTML("beforeend", playlistHtml);
        });

        // Allow switching between videos
        const videoElements = document.querySelectorAll(".playlist-item");
        videoElements.forEach(element => {
          element.addEventListener("click", function(event) {
            const id = this.dataset.id;
            app.currentVideoId = id;
            app.currentVideo.pause();
            app.getPlaylist();
          });
        });
      })
      .catch(e => app.error(e));
  };

  app.refreshCanvas = () => {
    app.canvas = app.canvas ? app.canvas : document.querySelector("canvas");
    app.ctx = app.ctx ? app.ctx : app.canvas.getContext("2d");
    app.ctx.clearRect(0, 0, app.canvas.width, app.canvas.height);
  };

  app.resetPlaylist = () => {
    // Playlist in memory
    app.playlist = [];
    // Playlist in the DOM
    app.playlistElement = app.playlistElement
      ? app.playlistElement
      : document.getElementById("playlist");
    app.playlistElement.innerHTML = "";
  };

  // Template for a video in the playlist
  app.playlistEntryFactory = (id, header, description, image) => {
    return `
        <div class="row playlist-item" data-id="${id}">
            <div class="col-md-5 playlist-image-holder" style="background-image: url(${image});">
            </div>
            <div class="card border-light col-md-7" style="max-width: 20rem;">
                <div class="card-header">${header}</div>
                <div class="card-text">
                    <p>${
                      description.length > 30
                        ? description.substring(0, 30) + " ..."
                        : description
                    }</p>
                </div>
            </div>
        </div>
    `;
  };

  // Loads a video in the canvas
  app.loadVideo = function(ctx, title, src) {
    // Set the title of the video
    let titleElement = document.getElementById("current-video-title");
    titleElement.textContent = title;

    // Reset the video if it already exists
    if (app.currentVideo) {
      app.currentVideo.pause();
      app.currentVideo.removeAttribute("src");
      app.currentVideo = null;
      app.isPlaying = false;
    }

    app.currentVideo = document.createElement("video");
    app.currentVideo.src = src;
    if (app.autoplay) app.currentVideo.muted = true;

    // When playing the video, we will copy frame by frame to canvas
    app.currentVideo.addEventListener("play", () => {
      // requestAnimationFrame is a better alternative for setTimeout because it syncs framerate to
      // that detected by browser - less skipped frames and z-tearing, really good for canvas stuff
      const step = () => {
        ctx.drawImage(
          app.currentVideo,
          0,
          0,
          app.canvas.width,
          app.canvas.height
        );

        // Draw histogram on top of video, but use the original video as source
        if (app.isHistogramActive) app.drawHistogram(app.currentVideo);

        // Finally call self
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });

    // Maybe play next video if it has ended
    app.currentVideo.addEventListener("ended", () => {
      setTimeout(app.playNext, app.pauseBetween);
    });

    // Fill scrubber and update timestamp
    const scrubberFill = document.getElementById("scrubber-fill");
    const time = document.getElementById("time");

    // Little helper function
    const timeParse = t => {
      const minutes = Math.floor(t / 60).toString();
      const seconds = Math.floor(t - minutes * 60).toString();
      return `${minutes.length > 1 ? minutes : 0 + minutes}:${
        seconds.length > 1 ? seconds : 0 + seconds
      }`;
    };

    let duration = "0:00:00";
    app.currentVideo.addEventListener("timeupdate", () => {
      // Set duration only once
      if (duration === "0:00:00")
        duration = timeParse(app.currentVideo.duration);

      // Get current time as percent
      const position = app.currentVideo.currentTime / app.currentVideo.duration;
      scrubberFill.style.width = position * 100 + "%";

      // Parse the time and display it
      time.innerHTML = `${timeParse(
        app.currentVideo.currentTime
      )} / ${duration}`;
    });

    // Allow user to scrub through the video
    const scrubber = document.getElementById("scrubber");
    scrubber.addEventListener("click", event => {
      // Do not allow video to pause
      event.stopPropagation();
      const { offsetX, offsetY } = event;
      const whereTo =
        (offsetX / scrubber.offsetWidth) * app.currentVideo.duration;
      app.currentVideo.currentTime = whereTo;
    });

    // If autoplay was enabled, start the video
    if (app.autoplay) app.currentVideo.play();
  };

  // Downloads the current frame as a png image
  app.downloadCurrentFrame = () => {
    // Create a link to an in-memory png and simulate a click on that
    const download = document.createElement("a");
    try {
      const image = app.canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      download.setAttribute("href", image);
      download.setAttribute("download", btoa(new Date()) + ".png");
      download.click();
    } catch (e) {
      app.error(e);
    }
  };

  // Show errors to user
  app.error = err => {
    const html = `
    <div class="alert alert-dismissible alert-danger app-error">
        <button type="button" class="close">&times;</button>
        <strong>Error:</strong> ${err}
    </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    // Retrieve the elements and add handle two events: the user clicks the x or
    // the time runs out
    const alerts = document.getElementsByClassName("app-error");

    const clear = () => {
      for (let i = 0; i < alerts.length; i++) {
        alerts[i].parentElement.removeChild(alerts[i]);
      }
    };

    for (let closeButton of document.getElementsByClassName("close")) {
      closeButton.addEventListener("click", () => {
        clear();
      });
    }

    setTimeout(() => {
      clear();
    }, app.errorTimeout);
  };

  // Draws the histogram
  app.drawHistogram = rawImageData => {
    if (!app.currentVideo || !app.canvas || !app.ctx) return;

    // Helper function
    const zerofill = (start, stop, step = 1) => {
      let arr = [];
      for (let i = start; i < stop; i += step) {
        arr[i] = 0;
      }
      return arr;
    };

    // We will have the three distributions tables - value of pixel is index and frequency is no of pixels of that value
    let rvals = zerofill(0, 256);
    let gvals = zerofill(0, 256);
    let bvals = zerofill(0, 256);

    // In order not to also include the histogram itself (which will result in a feedback loop), get the pixel
    // array from the frame that was passed in rather than the canvas displayed to the user
    const virtualCanvas = document.createElement("canvas");
    virtualCanvas.height = app.canvas.height;
    virtualCanvas.width = app.canvas.width;
    const ctx = virtualCanvas.getContext("2d");
    ctx.drawImage(
      rawImageData,
      0,
      0,
      virtualCanvas.width,
      virtualCanvas.height
    );
    const { data } = ctx.getImageData(
      0,
      0,
      virtualCanvas.height,
      virtualCanvas.width
    );

    // Get the frequencies of all colours from the unpacked array
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      rvals[r]++;
      gvals[g]++;
      bvals[b]++;
    }

    // Helper function to draw the histograms
    const drawBar = (ctx, max, min, vals, colour, y, xScale, yScale) => {
      ctx.fillStyle = colour;
      const delta = max - min;
      vals.forEach((val, i) => {
        // Obtain a normalized value within [0, 1] based on the existing range within the image by using
        // formula: Xi - Xmin / Xmax - Xmin
        let normalizedVal = (val - min) / delta;
        // Exaggerate small values; otherwise they will not be seen by user
        normalizedVal =
          normalizedVal < 0.1 ? normalizedVal * 10 : normalizedVal;
        const barY = normalizedVal * yScale;
        ctx.fillRect(i * xScale, y, 1, -Math.ceil(barY));
      });
    };

    // Get the width and height to properly scale the histogram
    const { width, height } = app.canvas;

    // Put the data into an array, calculating the minima and maxima of each array in the process
    const bars = [
      {
        max: Math.max(...rvals),
        min: Math.min(...rvals),
        vals: rvals,
        colour: "rgba(255,0,0,0.7)"
      },
      {
        max: Math.max(...gvals),
        min: Math.min(...gvals),
        vals: gvals,
        colour: "rgba(0,255,0,0.7)"
      },
      {
        max: Math.max(...bvals),
        min: Math.min(...bvals),
        vals: bvals,
        colour: "rgba(0,0,255,0.7)"
      }
    ];

    // Draw each colour on top of video
    bars.forEach(bar =>
      drawBar(
        app.ctx,
        bar.max,
        bar.min,
        bar.vals,
        bar.colour,
        height,
        width / 255,
        height
      )
    );
  };

  // Skips to the next video
  app.playNext = () => {
    // If feature is disabled, don't do anything
    if (!app.autoplay) return;

    // Find the current video...
    let i = 0;
    for (; i < app.playlist.length; i++) {
      if (app.playlist[i].id === app.currentVideoId) {
        break;
      }
    }

    // ... and play the next or the first if current was the last video
    const { id } =
      i === app.playlist.length - 1 ? app.playlist[0] : app.playlist[i + 1];
    app.currentVideoId = id;
    app.getPlaylist();
  };

  // Displays search results for search in app bar
  app.getSearchResults = searchQuery => {
    // Delete the list
    const list = document.getElementById("search-results");
    if (list) {
      list.parentElement.removeChild(list);
    }

    if (!searchQuery) return;

    // Build the list anew
    let resultItems = "";
    app.playlist.forEach(video => {
      const { id, title, subtitle } = video;
      if (
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subtitle.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        resultItems += `
            <a class="list-group-item list-group-item-action search-list-result" data-id="${id}">
                ${title}
            </a>`;
      }
    });

    // Display a message if there were no results
    if (resultItems.length === 0) {
      resultItems += `
            <a class="list-group-item list-group-item-action">
            No videos found containing '${searchQuery}'.
            </a>`;
    }

    const results = `
        <div class="list-group" id="search-results">
            ${resultItems}
        </div>
    `;

    // Insert the list into the DOM and return the DOM element
    document.body.insertAdjacentHTML("beforeend", results);
    return document.getElementById("search-results");
  };

  // When page loads
  window.addEventListener("load", () => {
    // Keep track of state in app - in this case autoplay
    const autoplayElement = document.getElementById("autoplay");
    autoplayElement.addEventListener("click", () => {
      app.autoplay = !app.autoplay;
    });

    // Add download action to button
    const downloadButton = document.getElementById("download-frame");
    downloadButton.addEventListener("click", () => {
      app.downloadCurrentFrame();
    });

    // Allow user to activate / deactivate the display of the histogram
    const histogramCheckbox = document.getElementById("histogram");
    histogramCheckbox.addEventListener("click", () => {
      app.isHistogramActive = !app.isHistogramActive;
    });

    // Initialise app
    app.initialise();

    // Get the playlist and load the main video
    app.getPlaylist();

    // Trigger the play event on the (invisible) video
    app.playPauseButton = document.getElementById("play-pause");
    const playPauseCallback = () => {
      app.isPlaying = !app.isPlaying;
      app.playPauseButton.className = app.isPlaying ? "pause" : "play";
      try {
        app.isPlaying ? app.currentVideo.play() : app.currentVideo.pause();
      } catch (e) {
        app.error(e);
      }
    };

    app.canvas.addEventListener("click", playPauseCallback);
    app.playPauseButton.addEventListener("click", playPauseCallback);

    // Handle mute/unmute
    const muteUnmuteButton = document.getElementById("mute-unmute");
    muteUnmuteButton.addEventListener("click", () => {
      app.isMute = !app.isMute;
      app.currentVideo.muted = app.isMute;
      muteUnmuteButton.className = app.isMute ? "unmute" : "mute";
    });

    const searchBar = document.getElementById("search");
    searchBar.addEventListener("keyup", function() {
      // Append and style the list
      const list = app.getSearchResults(this.value);

      // If we have no query, we will have no list
      if (list) {
        list.style.top = searchBar.offsetTop + searchBar.offsetHeight + "px";
        list.style.left = searchBar.offsetLeft + "px";
        list.style.width = searchBar.offsetWidth + "px";
      }
    });

    // Prevent submit
    const searchButton = document.getElementById("search-button");
    searchButton.addEventListener("click", event => event.preventDefault());

    // Register a service worker for this to be a PWA
    if (typeof navigator.serviceWorker !== "undefined") {
      try {
        navigator.serviceWorker.register("ServiceWorker.js");
      } catch (e) {
        app.error(e);
      }
    }
  });

  // Save state upon user leaving page
  window.addEventListener("beforeunload", () => app.saveState());
})();

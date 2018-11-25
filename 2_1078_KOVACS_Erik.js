let app = {};

app.autoplay = true;

// This is where the fun is. It loads the videos and loads the first one in the list.
// Imperfect but functional 
// TODO:: if video is currently playing, hide it from the playlist, and add it back when another video is playing
app.getPlaylist = () => {
    // Get our drawing context
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    // This is our playlist in the DOM
    const playlistElement = document.getElementById('playlist');

    // Get the metadata JSON where we have data about the videos
    fetch('./media/metadata/metadata.json')
        .then(data => data.json())
        .then(data => {
            // Loop through the videos
            data.videos.forEach((video, i) => {
                const {title, subtitle, src, thumbnail} = video;
                
                // If we have our first video, load it
                if(i === 0) app.loadVideo(ctx, src);

                // Add videos to the playlist
                const playlistHtml = app.playlistEntryFactory(title, subtitle, thumbnail);
                playlistElement.insertAdjacentHTML('beforeend', playlistHtml);
            })
        });
}

// Template for a video in the playlist
app.playlistEntryFactory = (header, description, image) => {
    return `
    <div class="col-md-5" class="playlist-image-holder">
            <img class="card-text playlist-image" src="${image}"/>
            </div>
        <div class="card border-light mb-3 col-md-7" style="max-width: 20rem;">
        <div class="card-header">${header}</div>
        <div class="card-text">
            <p>${description}</p>
        </div>
    </div>`;
}

// Loads a video in the canvas
app.loadVideo = (ctx, src) => {
    let video = document.createElement("video");
    video.src = src;
    
    video.addEventListener('play', () => {
        // requestAnimationFrame is a better alternative for setTimeout because it syncs framerate to that detected by
        // browser - less skipped frames and z-tearing, really good for canvas stuff
        const step = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            requestAnimationFrame(step)
        };
        requestAnimationFrame(step);
    })

    // Trigger the play event on the (invisible) video
    canvas.addEventListener('click', () => {
        video.play();
    })
}

// Main 
window.addEventListener('load', () => {
    // Keep track of state in app - in this case autoplay
    const autoplayElement = document.getElementById('autoplay');
    autoplayElement.addEventListener('click', () => {
        app.autoplay = !app.autoplay;
    });
    
    app.getPlaylist();
})
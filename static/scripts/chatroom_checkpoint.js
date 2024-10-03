var audioMuted = false;
var videoDisplayed = false;

document.addEventListener('DOMContentLoaded', () => {
  var muteAudioInputElement = document.getElementById('mute_audio_input');
  var displayVideoInputElement = document.getElementById('display_video_input');
  var muteAudioButtonElement = document.getElementById('btn_audio_mute');
  var displayVideoButtonElement = document.getElementById('btn_video_display');
  var myVideo = document.getElementById('local_vid');

  const micLogo = document.getElementById('mic_logo');
  const vidLogo = document.getElementById('vid_logo');

  muteAudioButtonElement.addEventListener('click', () => {
    audioMuted = !audioMuted;
    let local_stream = myVideo.srcObject;
    local_stream.getAudioTracks().forEach((track) => {
      track.enabled = !audioMuted;
    });

    muteAudioInputElement.value = audioMuted ? '1' : '0';

    if (micLogo.classList.contains('fa-microphone')) {
      micLogo.classList.remove('fa-microphone');
      micLogo.classList.add('fa-microphone-slash');

      muteAudioButtonElement.style.backgroundColor = 'rgb(153, 32, 32)';
    } else {
      micLogo.classList.remove('fa-microphone-slash');
      micLogo.classList.add('fa-microphone');

      muteAudioButtonElement.style.backgroundColor = 'var(--btn-color-primary)';
    }
  });

  displayVideoButtonElement.addEventListener('click', () => {
    videoDisplayed = !videoDisplayed;
    let local_stream = myVideo.srcObject;
    local_stream.getVideoTracks().forEach((track) => {
      track.enabled = !videoDisplayed;
    });

    displayVideoInputElement.value = videoDisplayed ? '1' : '0';

    if (vidLogo.classList.contains('fa-video')) {
      vidLogo.classList.remove('fa-video');
      vidLogo.classList.add('fa-video-slash');

      displayVideoButtonElement.style.backgroundColor = 'rgb(153, 32, 32)';
    } else {
      vidLogo.classList.remove('fa-video-slash');
      vidLogo.classList.add('fa-video');

      displayVideoButtonElement.style.backgroundColor = 'var(--btn-color-primary)';
    }
  });

  startCamera();
});

var camera_allowed = false;
var mediaConstraints = {
  audio: true,
  video: {
    height: 360,
  },
};

function validate() {
  if (!camera_allowed) {
    alert('Tolong izinkan akses kamera dan mikrofon!');
  }

  return camera_allowed;
}

function startCamera() {
  navigator.mediaDevices
    .getUserMedia(mediaConstraints)
    .then((stream) => {
      document.getElementById('local_vid').srcObject = stream;
      camera_allowed = true;
    })
    .catch((error) => {
      console.log('Error! tidak bisa memulai video', error);
      document.getElementById('permission_alert').style.display = 'flex';
    });
}

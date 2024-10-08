var hostVideo;

document.addEventListener('DOMContentLoaded', (event) => {
  hostVideo = document.getElementById('host_vid');

  if (hostVideo) {
    hostVideo.onloadeddata = () => {
      console.log('W,H: ', hostVideo.videoWidth, ', ', hostVideo.videoHeight);
    };
  }

  var muteAudioBtn = document.getElementById('btn_audio_mute');
  var displayVideoBtn = document.getElementById('btn_video_display');
  var callEndBtn = document.getElementById('btn_end_call');

  const chatBtn = document.getElementById('btn_chat');
  const optionBtn = document.getElementById('btn_option');

  const micLogo = document.getElementById('mic_logo');
  const vidLogo = document.getElementById('vid_logo');

  if (muteAudioBtn && displayVideoBtn) {
    muteAudioBtn.addEventListener('click', () => {
      audioMuted = !audioMuted;
      setAudioMuteState(audioMuted);

      if (micLogo.classList.contains('fa-microphone')) {
        micLogo.classList.remove('fa-microphone');
        micLogo.classList.add('fa-microphone-slash');

        muteAudioBtn.style.backgroundColor = 'rgb(153, 32, 32)';
      } else {
        micLogo.classList.remove('fa-microphone-slash');
        micLogo.classList.add('fa-microphone');

        muteAudioBtn.style.backgroundColor = 'var(--btn-color-primary)';
      }
    });

    displayVideoBtn.addEventListener('click', () => {
      videoDisplayed = !videoDisplayed;
      setVideoDisplayState(videoDisplayed);

      if (vidLogo.classList.contains('fa-video')) {
        vidLogo.classList.remove('fa-video');
        vidLogo.classList.add('fa-video-slash');

        displayVideoBtn.style.backgroundColor = 'rgb(153, 32, 32)';
      } else {
        vidLogo.classList.remove('fa-video-slash');
        vidLogo.classList.add('fa-video');

        displayVideoBtn.style.backgroundColor = 'var(--btn-color-primary)';
      }
    });
  }

  callEndBtn.addEventListener('click', () => {
    window.location.replace('/r/leave/');
  });

  chatBtn.addEventListener('click', () => {
    const chatContainer = document.getElementById('chat-container');
    const chatNotify = document.getElementById('chat-notify');

    if (chatNotify.classList.contains('show-chat-notif')) {
      chatNotify.classList.remove('show-chat-notif');
      chatNotify.classList.add('hide-chat-notif');
    }

    if (!chatContainer.classList.contains('show-chat')) {
      chatContainer.classList.add('show-chat');
      chatContainer.classList.remove('hide-chat');
    } else {
      chatContainer.classList.remove('show-chat');
      chatContainer.classList.add('hide-chat');
    }
  });

  optionBtn.addEventListener('click', () => {});

  document.getElementById('room_link').innerHTML = `<span>${window.location.href}</span>`;
});

function addHostVideoElement(peer_id, display_name) {
  const videoContainer = document.getElementById('video_grid'); // Pastikan ini menunjuk ke video grid
  const videoItemDiv = document.createElement('div');
  const vidWrapperDiv = document.createElement('div');
  const newHostVideo = document.createElement('video');
  const displayNameDiv = document.createElement('div');

  // Setting attributes sesuai dengan struktur yang diinginkan
  videoItemDiv.id = `div_remote_vid_${peer_id}`;
  videoItemDiv.className = 'video-item neumorph-shadow';

  vidWrapperDiv.className = 'vid-wrapper';

  newHostVideo.id = 'host_vid';
  newHostVideo.autoplay = true;
  newHostVideo.muted = true; // Mute video host untuk participant

  displayNameDiv.className = 'display-name';
  displayNameDiv.innerText = `${display_name}`;

  // Menyusun elemen-elemen ke dalam struktur div
  vidWrapperDiv.appendChild(newHostVideo);
  vidWrapperDiv.appendChild(displayNameDiv);
  videoItemDiv.appendChild(vidWrapperDiv);
  videoContainer.appendChild(videoItemDiv);

  // Menyambungkan video host ke video element
  if (document.getElementById('host_vid').srcObject) {
    newHostVideo.srcObject = hostVideo.srcObject;
  }
}

function removeHostVideoElement(peer_id) {
  const hostVideoDiv = document.getElementById(`div_remote_vid_${peer_id}`);
  const videoContainer = document.getElementById('video_grid');

  if (hostVideoDiv) {
    // Menghapus elemen video host dan div wrappernya
    videoContainer.removeChild(hostVideoDiv);
  }
}

function setAudioMuteState(flag) {
  let local_stream = hostVideo.srcObject;

  local_stream.getAudioTracks().forEach((track) => {
    track.enabled = !flag;
  });
}

function setVideoDisplayState(flag) {
  let local_stream = hostVideo.srcObject;

  local_stream.getVideoTracks().forEach((track) => {
    track.enabled = !flag;
  });
}

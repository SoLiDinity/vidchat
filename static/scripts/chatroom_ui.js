var myVideo;

document.addEventListener('DOMContentLoaded', (event) => {
  myVideo = document.getElementById('local_vid');
  myVideo.onloadeddata = () => {
    console.log('W,H: ', myVideo.videoWidth, ', ', myVideo.videoHeight);
  };

  var muteAudioBtn = document.getElementById('btn_audio_mute');
  var displayVideoBtn = document.getElementById('btn_video_display');
  var callEndBtn = document.getElementById('btn_end_call');
  
  const chatBtn = document.getElementById('btn_chat')
  const optionBtn = document.getElementById('btn_option')

  const micLogo = document.getElementById('mic_logo');
  const vidLogo = document.getElementById('vid_logo');


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

  callEndBtn.addEventListener('click', () => {
    window.location.replace('/r/leave/');
  });

  chatBtn.addEventListener('click', () => {
    const chatContainer = document.getElementById('chat-container')

    if (!chatContainer.classList.contains('show-chat')) {
      chatContainer.classList.add('show-chat')
      chatContainer.classList.remove('hide-chat')
    } else {
      chatContainer.classList.remove('show-chat')
      chatContainer.classList.add('hide-chat')
    }
  })

  optionBtn.addEventListener('click', () => {

  })

  document.getElementById('room_link').innerHTML = `<span>${window.location.href}</span>`;
});

function makeVideoElement(element_id, display_name) {
  let wrapper_div = document.createElement('div');
  let vid_wrapper = document.createElement('div');
  let vid = document.createElement('video');
  let name_text = document.createElement('div');

  wrapper_div.id = 'div_' + element_id;
  vid.id = 'vid_' + element_id;

  wrapper_div.className = 'video-item neumorph-shadow';
  vid_wrapper.className = 'vid-wrapper';
  name_text.className = 'display-name';

  vid.autoplay = true;
  name_text.innerText = display_name;

  vid_wrapper.appendChild(vid);
  vid_wrapper.appendChild(name_text);
  wrapper_div.appendChild(vid_wrapper);

  return wrapper_div;
}

function addVideoElement(element_id, display_name) {
  document.getElementById('video_grid').appendChild(makeVideoElement(element_id, display_name));
}

function removeVideoElement(element_id) {
  let v = getVideoObj(element_id);
  if (v.srcObject) {
    v.srcObject.getTracks().forEach((track) => track.stop());
  }

  v.removeAttribute("srcObject");
  v.removeAttribute("src");

  document.getElementById('div_' + element_id).remove();
}

function getVideoObj(element_id) {
  return document.getElementById('vid_' + element_id);
}

function setAudioMuteState(flag) {
  let local_stream = myVideo.srcObject;

  local_stream.getAudioTracks().forEach((track) => {
    track.enabled = !flag;
  });
}

function setVideoDisplayState(flag) {
  let local_stream = myVideo.srcObject;

  local_stream.getVideoTracks().forEach((track) => {
    track.enabled = !flag;
  });
}

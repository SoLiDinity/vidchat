var myID;
var _peer_list = {};

var protocol = window.location.protocol;
var socket = io(protocol + '//' + document.domain + ':' + location.port, { autoConnect: false });

document.addEventListener('DOMContentLoaded', () => {
  startCamera();

  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value;
    socket.emit('send-message', { message });
    chatInput.value = '';
  });
});

var camera_allowed = false;
var mediaConstraints = {
  audio: true,
  video: {
    height: 360,
  },
};

function startCamera() {
  navigator.mediaDevices
    .getUserMedia(mediaConstraints)
    .then((stream) => {
      myVideo.srcObject = stream;
      camera_allowed = true;

      setAudioMuteState(audioMuted);
      setVideoDisplayState(videoDisplayed);

      socket.connect();
    })
    .catch((error) => {
      console.log('Error ketika mendapatkan user media: ', error);
      alert('Error! Tidak bisa mengakses kamera dan mikrofon');
    });
}

socket.on('connect', () => {
  console.log('socket connected');
  socket.emit('join-room', { room_id: myRoomID });
});

socket.on('user-connect', (data) => {
  console.log('user-connect ', data);

  let peer_id = data['sid'];
  let display_name = data['name'];

  _peer_list[peer_id] = undefined;

  addVideoElement(peer_id, display_name);
});

socket.on('my-sid', function (data) {
  myID = data.sid;
  console.log('My session ID: ' + myID);
});

socket.on('receive-message', (data) => {
  const isSelf = data.sid === myID;
  if (data.message && data.name) {
    addMessage(data.message, data.name, isSelf);
  }
});

socket.on('user-disconnect', (data) => {
  console.log('user-disconnect ', data);

  let peer_id = data['sid'];

  closeConnection(peer_id);
  removeVideoElement(peer_id);
});

socket.on('user-list', (data) => {
  console.log('user list received ', data);
  myID = data['my_id'];

  if ('list' in data) {
    let received_list = data['list'];
    for (peer_id in received_list) {
      display_name = received_list[peer_id];
      _peer_list[peer_id] = undefined;
      addVideoElement(peer_id, display_name);
    }
    start_webrtc();
  }
});

function addMessage(message, sender, isSelf) {
  const chatBox = document.getElementById('chat-box');
  const messageElement = document.createElement('div');

  const chatNotify = document.getElementById('chat-notify');

  if (isSelf) {
    messageElement.classList.add('sent-message');
  } else {
    messageElement.classList.add('received-message');

    if (!chatNotify.classList.contains('show-chat-notif')) {
      chatNotify.classList.remove('hide-chat-notif');
      chatNotify.classList.add('show-chat-notif');
    }
  }

  messageElement.innerHTML = `<strong>${sender}</strong> <p>${message}</p>`;

  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function closeConnection(peer_id) {
  if (peer_id in _peer_list) {
    _peer_list[peer_id].onicecandidate = null;
    _peer_list[peer_id].ontrack = null;
    _peer_list[peer_id].onnegotiationneeded = null;

    delete _peer_list[peer_id];
  }
}

function log_user_list() {
  for (let key in _peer_list) {
    console.log(`${key}: ${_peer_list[key]}`);
  }
}

// WebRTC Configuration

var CONFIG = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
  ],
};

function log_error(error) {
  console.log('Error: ', error);
}

function sendViaServer(data) {
  socket.emit('data', data);
}

socket.on('data', (msg) => {
  switch (msg['type']) {
    case 'offer':
      handleOfferMsg(msg);
      break;
    case 'answer':
      handleAnswerMsg(msg);
      break;
    case 'new-ice-candidate':
      handleNewICECandidateMsg(msg);
      break;
  }
});

function start_webrtc() {
  for (let peer_id in _peer_list) {
    invite(peer_id);
  }
}

function invite(peer_id) {
  if (_peer_list[peer_id]) {
    console.log('Error: Mencoba memulai koneksi yang sudah ada!');
  } else if (peer_id === myID) {
    console.log('Error: Mencoba memulai koneksi dengan diri sendiri!');
  } else {
    console.log(`Membuat koneksi peer untuk <${peer_id}>`);
    createPeerConnection(peer_id);

    let local_stream = myVideo.srcObject;
    local_stream.getTracks().forEach((track) => {
      _peer_list[peer_id].addTrack(track, local_stream);
    });
  }
}

function createPeerConnection(peer_id) {
  _peer_list[peer_id] = new RTCPeerConnection(CONFIG);

  _peer_list[peer_id].onicecandidate = (event) => {
    handleICECandidateEvent(event, peer_id);
  };

  _peer_list[peer_id].ontrack = (event) => {
    handleTrackEvent(event, peer_id);
  };

  _peer_list[peer_id].onnegotiationneeded = () => {
    handleNegotiationNeededEvent(peer_id);
  };
}

function handleNegotiationNeededEvent(peer_id) {
  _peer_list[peer_id]
    .createOffer()
    .then((offer) => {
      return _peer_list[peer_id].setLocalDescription(offer);
    })
    .then(() => {
      console.log(`Mengirim offer kepada <${peer_id}>`);
      sendViaServer({
        sender_id: myID,
        target_id: peer_id,
        type: 'offer',
        sdp: _peer_list[peer_id].localDescription,
      });
    })
    .catch(log_error);
}

function handleOfferMsg(msg) {
  peer_id = msg['sender_id'];

  console.log(`Offer diterima dari <${peer_id}>`);

  createPeerConnection(peer_id);
  let desc = new RTCSessionDescription(msg['sdp']);

  _peer_list[peer_id]
    .setRemoteDescription(desc)
    .then(() => {
      let local_stream = myVideo.srcObject;

      local_stream.getTracks().forEach((track) => {
        _peer_list[peer_id].addTrack(track, local_stream);
      });
    })
    .then(() => {
      return _peer_list[peer_id].createAnswer();
    })
    .then((answer) => {
      return _peer_list[peer_id].setLocalDescription(answer);
    })
    .then(() => {
      console.log(`Mengirim jawaban ke <${peer_id}>`);
      sendViaServer({
        sender_id: myID,
        target_id: peer_id,
        type: 'answer',
        sdp: _peer_list[peer_id].localDescription,
      });
    })
    .catch(log_error);
}

function handleAnswerMsg(msg) {
  peer_id = msg['sender_id'];
  console.log(`Jawaban diterima dari <${peer_id}>`);

  let desc = new RTCSessionDescription(msg['sdp']);
  _peer_list[peer_id].setRemoteDescription(desc);
}

function handleICECandidateEvent(event, peer_id) {
  if (event.candidate) {
    sendViaServer({
      sender_id: myID,
      target_id: peer_id,
      type: 'new-ice-candidate',
      candidate: event.candidate,
    });
  }
}

function handleNewICECandidateMsg(msg) {
  console.log(`ICE candidate received from <${peer_id}>`);
  var candidate = new RTCIceCandidate(msg.candidate);
  _peer_list[msg['sender_id']].addIceCandidate(candidate).catch(log_error);
}

function handleTrackEvent(event, peer_id) {
  console.log(`Track diterima dari <${peer_id}>`);

  if (event.streams) {
    getVideoObj(peer_id).srcObject = event.streams[0];
  }
}
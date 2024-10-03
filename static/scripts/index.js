function generateRandomText(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_$&@#';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

document.addEventListener('DOMContentLoaded', () => {
  const meetingRoomIDGeneratorBtn = document.getElementById('meet-id-generator-btn');
  const broadcastRoomIDGeneratorBtn = document.getElementById('broadcast-id-generator-btn');
  const meetIDField = document.getElementById('room_id');
  const broadcastIDField = document.getElementById('broadcast_id');

  meetingRoomIDGeneratorBtn.addEventListener('click', () => {
    meetIDField.value = generateRandomText(16);
  });

  broadcastRoomIDGeneratorBtn.addEventListener('click', () => {
    broadcastIDField.value = generateRandomText(16);
  });
});

from flask import Flask, render_template, request, redirect, url_for, session
from flask_socketio import SocketIO, emit, join_room

from engineio.payload import Payload
Payload.max_decode_packets = 200

app = Flask(__name__)
app.config['SECRET_KEY'] = "secret!"
socketio = SocketIO(app)

_users_in_room = {}
_users_in_broadcast = {}
_room_of_sid = {}
_name_of_sid = {}
_isHost_sid = {}
_host_of_broadcast = {}
_broadcast_of_sid = {}

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        room_id = request.form.get('room_id')
        broadcast_id = request.form.get('broadcast_id')
        
        if room_id:
            return redirect(url_for("entry_checkpoint", room_id=room_id))
        elif broadcast_id:
            if broadcast_id in _host_of_broadcast:
                return redirect(url_for("broadcast_participant_entry_checkpoint", broadcast_id=broadcast_id))
            else:
                return redirect(url_for("broadcast_host_entry_checkpoint", broadcast_id=broadcast_id))

    return render_template("index.html")

@app.route("/r/<string:room_id>/")
def enter_room(room_id):
    if room_id not in session:
        return redirect(url_for("entry_checkpoint", room_id=room_id))
    return render_template("chatroom.html", room_id=room_id, display_name=session[room_id]["name"], mute_audio=session[room_id]["mute_audio"], display_video=session[room_id]["display_video"])

@app.route("/r/<string:room_id>/checkpoint/", methods=["GET", "POST"])
def entry_checkpoint(room_id):
    if request.method == "POST":
        display_name = request.form['display_name']
        mute_audio = request.form['mute_audio']
        display_video = request.form['display_video']
        session[room_id] = {"name": display_name, "mute_audio": mute_audio, "display_video": display_video}
        return redirect(url_for("enter_room", room_id=room_id))
    return render_template("chatroom_checkpoint.html", room_id=room_id)

@app.route("/b/<string:broadcast_id>/", methods=["GET", "POST"])
def broadcast_participant_enter_room(broadcast_id):
    if broadcast_id not in session:
        return redirect(url_for("broadcast_participant_entry_checkpoint", broadcast_id=broadcast_id))    
    return render_template("broadcast_participant.html", broadcast_id=broadcast_id)

@app.route("/b/host/<string:broadcast_id>/", methods=["GET", "POST"])
def broadcast_host_enter_room(broadcast_id):
    if session.get(broadcast_id, {}).get("isHost", True):  # Cek jika pengguna adalah host
        return render_template("broadcast_host.html", broadcast_id=broadcast_id, display_name=session[broadcast_id]["name"], mute_audio=session[broadcast_id]["mute_audio"], display_video=session[broadcast_id]["display_video"], isHost=session[broadcast_id]["isHost"])
    return redirect(url_for("broadcast_participant_entry_checkpoint", broadcast_id=broadcast_id))
            
@app.route("/b/<string:broadcast_id>/checkpoint/", methods=["GET", "POST"])
def broadcast_participant_entry_checkpoint(broadcast_id):
    if request.method == "POST":
        display_name = request.form['display_name']
        session[broadcast_id] = {"name": display_name, "mute_audio": True, "display_video": False, "isHost": False}
        return redirect(url_for("broadcast_participant_enter_room", broadcast_id=broadcast_id))
    
    return render_template("broadcast_participant_checkpoint.html", broadcast_id=broadcast_id)



@app.route("/b/host/<string:broadcast_id>/checkpoint/", methods=["GET", "POST"])
def broadcast_host_entry_checkpoint(broadcast_id):
    if request.method == "POST":
        display_name = request.form['display_name']
        mute_audio = request.form['mute_audio']
        display_video = request.form['display_video']
        session[broadcast_id] = {"name": display_name, "mute_audio": mute_audio, "display_video": display_video, "isHost": True}
        _host_of_broadcast[broadcast_id] = display_name  
        return redirect(url_for("broadcast_host_enter_room", broadcast_id=broadcast_id))
    
    return render_template("broadcast_host_checkpoint.html", broadcast_id=broadcast_id)




@app.route("/get_role")
def get_role():
    broadcast_id = request.args.get('broadcast_id')
    is_host = session.get(broadcast_id, {}).get("isHost")
    name = session.get(broadcast_id, {}).get("name")
    return {
        "name": name,
        "isHost": is_host
    }

@app.route("/r/leave/")
def leave_room():
    return render_template("chatroom_exit.html");

@socketio.on("connect")
def on_connect():
    sid = request.sid
    emit('my-sid', {'sid': sid})
    print("Socket baru terkoneksi ", sid)

@socketio.on("join-room")
def on_join_room(data):
    sid = request.sid
    room_id = data["room_id"]
    display_name = session[room_id]["name"]
    
    join_room(room_id)
    _room_of_sid[sid] = room_id
    _name_of_sid[sid] = display_name
    
    print("[{}] Masuk ke ruangan: {} <SID: {}>".format(display_name, room_id, sid))
    emit("user-connect", {"sid": sid, "name": display_name}, broadcast=True, include_self=False, room=room_id)

    if room_id not in _users_in_room:
        _users_in_room[room_id] = [sid]
        emit("user-list", {"my_id": sid})
    else:
        usrlist = {u_id: _name_of_sid[u_id] for u_id in _users_in_room[room_id]}
        emit("user-list", {"list": usrlist, "my_id": sid})
        _users_in_room[room_id].append(sid)

@socketio.on("join-broadcast")
def on_join_broadcast(data):
    sid = request.sid
    broadcast_id = data["broadcast_id"]
    
    # Ambil nama dan status host dari session
    display_name = session[broadcast_id]["name"]
    isHost = session[broadcast_id]["isHost"]

    # Bergabung ke ruangan broadcast
    join_room(broadcast_id)
    _broadcast_of_sid[sid] = broadcast_id
    _name_of_sid[sid] = display_name
    _isHost_sid[sid] = isHost
    
    print(_name_of_sid)
    print(_isHost_sid)

    print(f"[{display_name} | isHost:{isHost}] Masuk ke siaran: {broadcast_id} <SID: {sid}>")

    # Emit to other users about the new user connecting
    emit("user-connect", {"sid": sid, "name": display_name, "isHost": isHost}, broadcast=True, include_self=False, room=broadcast_id)

    # Cek jika ini adalah pengguna pertama dalam siaran
    if broadcast_id not in _users_in_broadcast:
        _users_in_broadcast[broadcast_id] = {sid: isHost}  # Simpan pengguna dengan status host mereka
        emit("user-list", {"my_b_id": sid, "isHost": isHost})
        print(f"[USER LIST] First user in broadcast: {sid} is host: {isHost}")
    else:
        # Update daftar pengguna dengan semua pengguna saat ini dan status isHost mereka
        usrlist = {
            u_id: {
                "name": _name_of_sid[u_id],
                "isHost": _isHost_sid[u_id]
            }
            for u_id in _users_in_broadcast[broadcast_id] if u_id in _name_of_sid
        }
        
        # Emit daftar pengguna ke semua peserta
        emit("user-list", {"list": usrlist, "my_b_id": sid, "isHost": isHost})
        _users_in_broadcast[broadcast_id][sid] = isHost  # Tambahkan pengguna baru dengan status host mereka

        print(f"[USER LIST] Updated user list for broadcast {broadcast_id}: {usrlist}")



@socketio.on("send-message")
def handle_send_message_event(data):
    sid = request.sid
    if sid in _room_of_sid:
        room_id = _room_of_sid[sid]
        display_name = _name_of_sid[sid]
        
        message = {
            "room_id": room_id,
            "sid": sid,
            "name": display_name,
            "message": data["message"]
        }
        
        print(message)
        emit("receive-message", message, broadcast=True, room=room_id)
    elif sid in _broadcast_of_sid:
        broadcast_id = _broadcast_of_sid[sid]
        display_name = _name_of_sid[sid]
        
        message = {
            "broadcast_id": broadcast_id,
            "sid": sid,
            "name": display_name,
            "message": data["message"]
        }

        print(message)
        emit("receive-broadcast-message", message, broadcast=True, room=broadcast_id)

@socketio.on("disconnect")
def on_disconnect():
    sid = request.sid
    if sid in _room_of_sid:
        room_id = _room_of_sid[sid]
        display_name = _name_of_sid[sid]
        print("[{}] Meninggalkan ruangan: {}<{}>".format(room_id, display_name, sid))
        emit("user-disconnect", {"sid": sid}, broadcast=True, include_self=False, room=room_id)

        _users_in_room[room_id].remove(sid)
        if len(_users_in_room[room_id]) == 0:
            _users_in_room.pop(room_id)

        _room_of_sid.pop(sid)
        _name_of_sid.pop(sid)

    elif sid in _broadcast_of_sid:
        broadcast_id = _broadcast_of_sid[sid]
        display_name = _name_of_sid[sid]
        print("[{}] Meninggalkan siaran: {}<{}>".format(broadcast_id, display_name, sid))
        emit("user-disconnect", {"sid": sid}, broadcast=True, include_self=False, room=broadcast_id)

        _broadcast_of_sid.pop(sid)
        _name_of_sid.pop(sid)

@socketio.on("data")
def on_data(data):
    sender_sid = data['sender_id']
    target_sid = data['target_id']
    if sender_sid != request.sid:
        print("[Not supposed to happen!] request.sid and sender_id don't match!!!")

    if data["type"] != "new-ice-candidate":
        print('{} message from {} to {}'.format(data["type"], sender_sid, target_sid))
    
    socketio.emit('data', data, room=target_sid)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=9000, debug=True)

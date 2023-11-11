let onlineUsers = [];

module.exports = (socket, io) => {
  // user joins or opens the application
  socket.on('join', (user) => {
    socket.join(user);
    if (!onlineUsers.some((el) => el.userId === user)) {
      onlineUsers.push({ userId: user, socketId: socket?.id });
    }
    // send online users
    io.emit('get-online-users', onlineUsers);

    // send socket id
    io.emit('setup-socket', socket.id);
  });

  // socket disconnect
  socket.on('disconnect', () => {
    onlineUsers = onlineUsers.filter((el) => el.socketId !== socket.id);
    io.emit('get-online-users', onlineUsers);
  });

  // join a chat room
  socket.on('join-chat', (chat) => {
    console.log('join chat', chat);
    socket.join(chat);
  });

  // send and receive message
  socket.on('send-message', (message) => {
    console.log('send-message: ', message);
    const { chat } = message;
    if (!chat.users) return;
    chat?.users?.forEach((user) => {
      if (user?._id === message?.sender?._id) return;
      socket.in(user?._id).emit('receive-message', message);
      console.log('receive-message: ', message);
    });
  });

  // typing
  socket.on('typing', (conversation) => {
    console.log('someone is typing');
    socket.in(conversation).emit('typing');
  });

  // stop-typing
  socket.on('stop-typing', (conversation) => {
    console.log('someone is stopping typing');
    socket.in(conversation).emit('stop-typing');
  });

  // call
  socket.on('call-user', (data) => {
    const { userToCall, signal, from, name, picture } = data;
    const userSocket = onlineUsers?.find((el) => el.userId === userToCall);
    io.to(userSocket?.socketId).emit('call-user', {
      signal,
      from,
      name,
      picture,
    });
  });
};

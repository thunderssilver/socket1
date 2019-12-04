
var express = require('express');
var mysql = require('mysql');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);//const io=require('socket.io')(<port>);
var users = [];
////var nicknames= [];
//var us={}; 

var connections = [];
app.set('view engine','pug');
server.listen(process.env.PORT || 3000)
console.log('server running....')

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html')
});



var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "mydb"
});


app.get('/history',function(req,res){
  var sql = "Select * from stud";
  
  
  con.query(sql, function (err, rows,fields) {
    if (err) {

      console.log("err in q");
    }else{
    res.render('history',{title: 'User Details', 
items: rows})
    }  
  });
//con.end();
});


con.connect(function(err) {
  if (err){

    console.log("err");
  }
  console.log("Connected!");

});



//open connection with socketio(or)
//io.sockets.on(....)


// const nsp = io.of('/my-namespace');
// nsp.on('connection', function(socket){
//   console.log('someone connected');

io.on('connection', function(socket){
  connections.push(socket);
  console.log('connected: %s sockets connected', connections.length)
//disconnect
  socket.on('disconnect', function(data){

    /*
      if(!socket.nickname) return
      delete users[socket.nickname];
      update(User/Nick)names

    */
    users.splice(users.indexOf(socket.username), 1);
    updateUsernames();
    connections.splice(connections.indexOf(socket), 1);
    console.log("Disconnected: %s sockets connected", connections.length)
  });

  socket.on('new user', function(data, callback){
    callback(true);


    /*
    if(data in us){
      callback(false);
    }else{
  
    callback(true);
    socket.nickname=data;
    users[socket.nickename]=socket
    update(User/Nick)names
    }
    */
    socket.username = data;
    users.push(socket.username);
    updateUsernames()
  });

  function updateUsernames(){
    io.emit('get users', users);//io.sockets.emit(....)
  }

  //send message
    //listening for message
  socket.on('send message', function(data,callback){
    console.log(data);

    var sql = "INSERT INTO stud  VALUES (null,'"+socket.username+"','"+data+"')";
  
  
    con.query(sql, function (err, rows,fields) {
      if (err) {

      console.log("err in q");
      }
    });

    var msg=data.trim();
    if(msg.substr(0,3) === '/w '){
      //console.log('whisper');

      var msg=msg.substr(3);
      var ind=msg.indexOf(' ');
      if(ind !== -1){

        var name=msg.substr(0,ind);
        var msg=msg.substr(ind+1);

        if(name.includes(name)){
          console.log("whisper!");
          users[name].emit('whisper', {msg: msg, user:socket.username});
        }else{
          callback("Error! Enter a valid user");
        }
        
      }else{
          callback("Error! please enter a message for you whisper")
      }
    }else{
      io.sockets.emit('new message', {msg: data, user:socket.username});
    }
    
  })



  socket.on('typing',function(data){

    socket.broadcast.emit('typing',socket.username);
  });

})



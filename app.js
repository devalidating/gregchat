const http = require('http');
const fs = require('fs');
const url = require('url');
const port = 80;
const ws = require('websocket');
const cookieparse = require('cookie-parser');
const formidable = require('formidable');
const pagemanifest = {
	'404' : './404.html',
	'/' : './index.html',
	'/index.html' : './index.html',
	'/art' : './artpage.html',
	'/chat' : './gregchat.html',
	'/img' : './404.html',
	'/favicon.ico':'./faviconnormal.png',
	'/chat/favicon.ico':'./faviconnormal.png',
	'/chat/fav2.ico':'./faviconspecial.png',
	'/aprilfools':'./aprilfools.html',
	'/gregdrive':'./uploadphoto.html',
	'/upload':'./uploadform.html',
	'/artresume':'./ArtResume.html'
};
var last100 = [ ]
const typemanifest = {
	'./faviconnormal.png':'image/png',
	'./faviconspecial.png':'image/png',
	'./splash.png':'image/png'
}
var page  = function(query) {
	const myurl = url.parse(query);
	var temp = pagemanifest[myurl.pathname];
	if(temp==null) {
		//console.log('404-ed');
		temp=pagemanifest[404];
	}
	return temp;
}
page.getType =  function(query) {
	var output2 = typemanifest[query.pathname];
	if(output2==null){output2='text/html';}
	console.log(query);
	return output2;
}

var server = http.createServer((req, res) => {
		fs.readFile(page(req.url), function(err,data) {
		if(err) {console.log('error');}
		var temp3 = page.getType(req.url);
		var sessioncook = "uid="+Math.floor(Math.random()*1000000000);
		console.log(req.url);
		if(/^\/gregdrive/.test(req.url))
		{
			console.log("OKAYTHISWORKS");
			console.log(req.method);
			if(req.method=="GET")
			{
				res.writeHead(200, {'Content-Type':'text/html'});
				res.end(data);
			}
			if(req.method=="POST")
			{
				console.log("got post");
				res.writeHead(200, {'Content-Type':'text/plain'});
				if(req.url=="/gregdrive/getfiles")
				{
					console.log("searching for files");
					fs.readdir("./image/",function(erroo,files) {
						if(err) {
						
						}
						for(var i=0;i<files.length;i++)
						{
							res.write(files.path+"\n");

						}
						res.end();

					});
				}
			}
		}
		else if(req.url=="/chat")
		{
			res.writeHead(200, {'Content-Type':temp3, 'Set-Cookie':sessioncook});
			res.end(data);
		} else if (/^\/img/.test(req.url)) {
			switch(req.method) {
			case 'GET':
				var yooareel = url.parse(req.url,true).query;
				var imagename = yooareel.i;
				if(imagename==null) {imagename="null";}	
				var type = imagename.substring(imagename.indexOf("."));
				var contenttype = "image/"+type.substring(1);
				if(/^./.test(type)) {
					fs.readFile(("../image/"+imagename), function(erro,data2) {
						if(erro) {
							res.writeHead(404, {'Content-Type':'text/plain'});
							res.end("Image not found");
						} else {
							res.writeHead(200, {'Content-Type':contenttype});
							res.end(data2);
						}
				
					});
				} else {
				res.writeHead(404, {'Content-Type':'text/plain'});
				res.end("malformed url");
				}
			break;
			case 'POST':
				var form = new formidable.IncomingForm();
					form.parse(req, function(error3,fields,files) {
						console.log(req);
						var response = "Sucess! Image link at ";
						if(error3) {console.log("ERROR:  "+error3)}
						console.log("INFO:"+files);

						var oldpath = files.filetoupload.path;
						
						var realpath = getFileName(files.filetoupload.name);
						var newpath = './image/'+realpath;
						
						fs.rename(oldpath,newpath,function(error2) {
							if(error2) {res.write('Image Upload Failed\n'+error2);
							} else {
								response=response+"http://gregoryt.mooo.com/img?i="+realpath;
								res.write(response);
								
							} 
							res.end();
						});
					});
						
			break;
			}

		} else {
			res.writeHead(200, {'Content-Type':temp3});
			res.end(data);
		}
	});
});
function getFileName(tempname) {
	var mtype = tempname.substring(tempname.lastIndexOf("."))
	try {
		fs.accessSync(('./image/'+tempname),fs.F_OK);
		return  getFileName(Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)+mtype);
	} catch(error) {
		return tempname;
	}

}
var webSocketServer = ws.server;
server.listen(port);
var wsServer = new webSocketServer({ httpServer: server });
var clients =  [ ];
var waitingForAck = [ ];
var killroom = [ ];
wsServer.on('request',function(request){
  	console.log((new Date()) + ' Connection from origin '+ request.origin + '.');
	var connection = request.accept(null, request.origin); 
	var index=clients.push(connection) -1;
	for(var i=0;i<clients.length;i++) { clients[i].sendUTF('{ "usercount":"'+clients.length+'"}');}
	console.log((new Date()) + ' Connection accepted.');
	connection.on('message', function(message) {
		if (message.type === 'utf8') {
			var mess = JSON.parse(message.utf8Data);
			switch(mess.type)
			{
				case 'message':
					last100.push(mess);
					if(last100.length>100)
					{
						last100.shift();
					}
				for (var i=0; i < clients.length; i++) {
					clients[i].sendUTF('{ "type":"message", "content":"'+mess.content+'", "uid":"'+mess.uid+'", "time":"'+mess.time+'", "stack":"'+mess.stack+'"}');
					console.log(message.utf8Data+":||:"+mess.type);
					if(!waitingForAck.includes(clients[i])) {
						waitingForAck.push(clients[i]);
					}

				}
				break;
				case 'ack':
					var indice = waitingForAck.indexOf(connection);
					if(indice!=null) {waitingForAck.splice(indice,1);}
					indice = killroom.indexOf(connection);
					if(indice!=null) {killroom.indexOf(connection);}
				break;
				case 'heartbeat':
					connection.sendUTF('{ "type":"heartbeat" }');
					if(clients.indexOf(connection)==-1) { clients.push(connection);}
				break;
				case "history":
					for(var i=0;i<last100.length;i++)
					{
						if(Date.now()-last100[i].time>600000)
						{
						
							last100.splice(i,1);
							i--;
						} else {
							connection.sendUTF(JSON.stringify(last100[i]));
						}
					}
				break;
			}
		}
	});
	connection.on('close',function(connection) {
		clients.splice(index, 1);
		console.log('closed connection');
		for(var i=0;i<clients.length;i++) {clients[i].sendUTF('{ "usercount":"'+clients.length+'"}');}
	});
	
});
function rolling()
{
	console.log(clients.length+' clients connected');
	var i=0;

	i=0;
	for(var k=0;k<killroom.length;k++)
	{
	
		i++;
		if(clients.indexOf(killroom[k])!=-1)	
		{	clients[clients.indexOf(killroom[k])].sendUTF('{ "type":"command", "command":"startsocket()" }');;
			clients.splice(clients.indexOf(killroom[k]),1);
		}
		for(var l=0;l<clients.length;l++) { clients[l].sendUTF('{ "usercount":"'+clients.length+'" }');}
		killroom.splice(k,1);	

	}
	if(i!=0) {console.log('purged '+i+' clients');}
	i=0;
	for(var j=0;j<waitingForAck.length;j++)
	{
		killroom.push(waitingForAck[j]);
		waitingForAck.splice(j,1);
		i++;
	}
	if(i!=0) {console.log(i+' clients moved to killroom');}	
	clients.forEach(element => element.sendUTF('{ "usercount":"'+clients.length+'" }'));
}
setInterval(() =>rolling(),5000);

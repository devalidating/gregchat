const pagemanifest = {
	        '404' : './404.html',
	        '/' : './index.html',
	        '/index.html' : './index.html',
	        '/art' : './artpage.html',
	        '/chat' : './gregchat.html',
	        '/img' : './404.html'
};
const typemanifest = {
	
};
exports.getPage = function(path) {
		
	return pagemanifest[path];
}
exports.getType = function(path) {
	var temp = typemanifest[pagemanifest[path]];
	if(temp == null)
	{	
		temp='text/html';
	}
	if(path=='/img')
	{
		temp = 'image/jpg';
	}


}

let lastFilename;

function render(args) {
	if (!args) args = {};

	var file = window['file'];




	var cached = window['img'] && !args.src && !args.file;
	if (cached) {
		doRender();
	} else {
		window['img'] = new Image();
        window['img'].crossOrigin = 'Anonymous';
		window['img'].onload = doRender;

		var src = args.src;
		if (src) window['img'].src = src;
		else window['img'].src = file;
	}

	document.getElementById('canvas').style.opacity = '1';
}

function doRender() {

	var img = window['img'];

	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');	

	context.clearRect(0,0,600,600);
	// get info
	var nw = img.naturalWidth;
	var nh = img.naturalHeight;
	var na = nw/nh;

	// fit to canvas area
	var w,h,a;
	if (!zoom) zoom = 1;
	var cw = 600;
	var ch = 600;
	var ca = cw/ch;
	if (na>ca) {
		h = ch;
		w = h*na;
	} else {
		w = cw;
		h = w/na;
	}
	w *= zoom;
	h *= zoom;

    // draw clipping path
    context.beginPath();
    context.arc(300,300,300,0,2*Math.PI,false);
    context.clip();

	// draw background
	context.fillStyle=document.getElementById('bgSelector').value;
	context.fillRect(0,0,600,600)


    // draw image
    if (!origin) origin = { x:0, y: 0};
    context.drawImage(img,origin.x,origin.y,w,h);

    // draw border
    var cs = document.getElementById('colorSelector');
    var col;
    switch (cs.value) {
    	case 'red': col = '#FF0000'; break;
    	case 'green': col = '#00FF00'; break;
    	case 'yellow': col = '#FFFF00'; break;
    	case 'gray': col = '#808080'; break;
    }
    context.beginPath();
    context.arc(300,300,300,0,2*Math.PI,false);
    context.lineWidth = 30;
    context.strokeStyle = col;
    context.stroke();
}

function init() {
	var canvas = document.getElementById('canvas');

	canvas.addEventListener('mousedown',handleMouseDown);
	canvas.addEventListener('dragstart',nullify);
	canvas.addEventListener('mousewheel',handleMouseWheel);

	document.addEventListener('mouseup',handleMouseUp);
	document.addEventListener('mousemove',handleMouseMove);
}

function nullify(e) {
	e.preventDefault();
	return false;
}
function handleDragEnd(e) {
	return false;
}
function handleDragOver(e) {
	e.preventDefault();
	//console.error(e);
	return false;
}
function handleDrop(e) {
	e.preventDefault && e.preventDefault();
	this.className = '';

	var files = event.dataTransfer.files;
	window['files'] = files;
	var file = files[0];

	var fr = new FileReader();
	fr.onload = function() {
		window['file'] = fr.result;
		render();
	}
	fr.readAsDataURL(file);
	lastFilename = file.name;

	return false;
}

function save() {
	var canvas = document.getElementById("canvas");
	// window.open(canvas.toDataURL("image/png"));
	var link = document.getElementById('link');
	const filename = getFilename();
	link.setAttribute('download', filename);
	link.setAttribute('href', canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
	link.click();

	function getFilename() {
		if (!lastFilename) return 'token.png';
		if (lastFilename.lastIndexOf('.')<0) return `${lastFilename}.png`;
		if (lastFilename.substr(-4)==='.png') return lastFilename;
		return `${lastFilename}.png`;
	}
}
function load() {
	alert('ken is dumb');
	console.error('load() is deprecated. use loadFromURL, loadFromDisk, etc.');
}
function loadFromDisk(file) {
	if (!file) {
		var fi = document.getElementById('fileInput');
		fi.click();
	} else {
		var fr = new FileReader();
		fr.onload = function() {
			window['file'] = fr.result;
			render({file:true});
		}
		fr.readAsDataURL(file);
		lastFilename = file.name;		
	}
}
function loadFromURL(url,event) {
	window['evt'] = event;
	if (!url) {
		document.getElementById('loadFromURL').style.display = 'block';
	} else {
		console.info(event);

		// if not local, get by proxy
		if (url.indexOf(window.location.host)<0) {
			// url = '/proxy?url='+escape(url);
			url = `https://api.bertball.com/token?url=${escape(url)}`;
		}


		render({src:url});
		document.getElementById('loadFromURL').style.display = 'none';
	}

}

var origin = { x:0, y:0 };
var dragging = false;
var startCoords;
var zoom = 1;

function handleMouseDown(e) {
	dragging = true;
	startCoords = { x:e.x, y:e.y };
	startCoords.x -= origin.x;
	startCoords.y -= origin.y;
	// console.info('start');
}
function handleMouseUp() {
	dragging = false;
	// console.info('stop');
}
function handleMouseMove(e) {
	if (dragging) {
		var coords = { x:e.x, y:e.y };
		var delta = { x:e.x-startCoords.x, y:e.y-startCoords.y };
		origin = delta;
		render();
	}
}
function handleMouseWheel(e) {
	zoom += (0.0001 * e.wheelDelta);
	render();
	console.info(zoom);
	e.preventDefault();
	return false;
}
function handlePaste(element,event) {
	var url = element.value;
}

function g(id) {
	return document.getElementById(id);
}
function show(id) {
	return g(id).style.display='block';
}
function hide(id) {
	return g(id).style.display='none';
}

function saveToDropbox(args) {
	if (!args) args = {};

	if (!args.fileName) { 
		show('saveToDropboxModal');
		g('saveToDropbox_fileName').focus();
		return;
	}

	hide('saveToDropboxModal');


	// get canvas data
	var canvas = document.getElementById("canvas");
	var fileData = canvas.toDataURL("image/png");

	var url = 'saveToDropbox.php';
	var fileName = args.fileName || 'token'+Math.floor(Math.random()*1000000)+'.png';
	if (fileName.substr(-4) != '.png') fileName += '.png';
								
	var formData = new FormData();
	formData.append('fileData',fileData);
	formData.append('fileName',fileName);
	
	var xhr, upload;			
	xhr = new XMLHttpRequest();
	upload = xhr.upload;
	upload.xhr = xhr;
	xhr.onreadystatechange = function() {
		if (xhr.readyState==4) {
			if (xhr.status==200) {
				done(xhr.responseText);
			} else {
				error(xhr.responseText);
			}
		}
	};
	xhr.open('POST',url);
	xhr.send(formData);

	function done(responseText) {
		console.log('upload result: '+responseText);		
		alert('success');
	}

	function error(responseText) {
		console.error('upload error: '+responseText);
		alert('failure');
	}
}
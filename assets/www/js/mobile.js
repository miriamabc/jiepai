document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {

}
var GHM = {
	init: function(){
		//GHM.resetPageHeight();
		var value = window.localStorage.getItem("user");
		if (!value){
			$('#signup').fadeIn('fast');
		}else{
			$('#home').fadeIn('fast');
		}
		GHM.hashChange();
	},
	isLogin: function(){
		return Boolean(window.localStorage.getItem("user"));
	},
	resetPageHeight: function(){
		var screenH = $(window).height();
		$('.page').css({
			'height': screenH - 88
		})
	},
	getHash: function(){
		var para = window.location.href.toString().split('#')[1];
		if (!para) return false;
		var para1 = ( para.indexOf('=') > 0 )? para.split('=')[0] : para;
		var para2 = ( para.indexOf('=') > 0 )? para.split('=')[1] : '';
		return [para1, para2];
	},
	hashChange: function(){

	},
	resizeHeight : function(x, maxh){
		var pwidth = x.width;//图片等比例压缩后大小
		var pheight = x.height;
		if( x.height >= maxh){
			pheight = maxh;
			pwidth = (x.width * maxh) / x.height;
		}
		x.setAttribute('width', pwidth);
		x.setAttribute('height', pheight);
	}
};
GHM.define = {
	FOLDER_URL_PREFIX: 'http://guihua.me/mobile/books/folder/',
	BOOKSHELF_URL: 'http://guihua.me/mobile/books/',
	BOOK_URL_PREFIX: 'http://guihua.me/mobile/books/book/'
};
GHM.hash = {
	get: function(){
		// hash e.g. #book or #book=10
		var para = window.location.href.toString().split('#')[1];
		if (!para) return false;
		var scene = ( para.indexOf('=') > 0 )? para.split('=')[0] : para;
		var arg = ( para.indexOf('=') > 0 )? para.split('=')[1] : '';
		return [scene, arg];
	},
	set: function(hash){
		window.location = window.location.href.toString().split('#')[0] + hash;
	},
	change: function(){
		var scene = null;
		var arg = null;
		if (GHM.getHash()) {
			scene = GHM.getHash()[0];
			arg = GHM.getHash()[1];
		}
		console.log(scene,arg);
		$('.page:visible').fadeOut('fast');
		switch (scene) {
			case 'home':
				$('#home').fadeIn('fast');
				$('#global_header_l').html('');
				GHM.highlightFooterTabIcon('home');
				break;
			case 'books':
				GHM.page.books();
				GHM.highlightFooterTabIcon('books');
				break;
			case 'note':
				(function(){
					$('#global_header_l').html('');
					$('#note').fadeIn('fast');
					$('#global_header_r').html('<a id="post_note" href="#">发布</a>');
					changeFooterIconHover('note');
					$('#post_note').click(function(){
						if (!$('#selected_book')) alert('请选择关联的图书');
						$.post('/mobile/savenote/',{
							bookid: $('#selected_book').attr('data-id'),
							page: $('#note_rel_page').val(),
							cont: $('#note_cont').val(),
							photo: $('#note_rel_photo').attr('data-normal'),
							thumbnail: $('#note_rel_photo').attr('src')
						},'text')
							.success(function(){
								var url = window.location.href.toString().split('#')[0];
								window.location.href = url + '#book=' + $('#selected_book').attr('data-id');
							})
					})
				})();
				GHM.highlightFooterTabIcon('note');
				break;
			case 'folder':
				$.get('/mobile/books/folder/' + arg)
					.success(function(data){
						$('#folder').html(data)
							.fadeIn('fast');
						$('#global_header_l').html('<a href="#books">返回</a>');
						$('#folder img').one('load', function() {
							GHM.resizeHeight(this, 77);
						})
							.each(function() {
								if(this.complete) $(this).trigger('load');
							});
						//图片如果加载失败，重新加载
						$('#folder img').find('img').error(function() {
							this.src = this.src;
						});
						var myScroll = new iScroll('folder', { scrollbarClass: 'myScrollbar' });
					})
					.error(function(xhr){
						alert('网络错误');
						console.log(xhr.responseText);
					});
				GHM.highlightFooterTabIcon('books');
				break;
			case 'book':
				GHM.page.book(arg);
				GHM.highlightFooterTabIcon('books');
				break;
			case 'coffee':
				$('#global_header_l').html('');
				break;
			case 'profile':
				$('#global_header_l').html('');
				break;
		}
	}
};
GHM.page = {
	book: function(arg){
		$.get('/mobile/books/book/' + arg)
			.success(function(data){
				$('#global_header_l').html('');
				$('#book').html(data)
					.fadeIn('fast');
				GHM.resizePicByFixedHeight($('#book .desc img'), 77);
				//图片如果加载失败，重新加载
				var myScroll = new iScroll('book', { scrollbarClass: 'myScrollbar' });

			})
			.error(function(xhr){
				alert('网络错误');
				console.log(xhr.responseText);
			});
	},
	books: function(){
		$.get(GHM.define.BOOKSHELF_URL)
			.success(function(data){
				$('#global_header_l').html('');
				$('#mybook').html(data);
				$('#books').fadeIn('fast');
				var myScroll = new iScroll('books', { scrollbarClass: 'myScrollbar' });
			})
			.error(function(xhr){
				alert('网络错误');
				console.log(xhr.responseText);
			});
	}
};
GHM.resizePicByFixedHeight = function($pics, fixed_height){
	$pics.one('load', function() {
		//图片按高度等比例缩放
		var pwidth = this.width,
			pheight = this.height;
		if( this.height >= fixed_height){
			pheight = fixed_height;
			pwidth = (this.width * fixed_height) / this.height;
		}
		this.setAttribute('width', pwidth);
		this.setAttribute('height', pheight);
	})
		.each(function() { //解决从缓存中加载图片，不会触发resize事件的问题
			if(this.complete) $(this).trigger('load');
		});
};
GHM.highlightFooterTabIcon = function(page){
	$('#global_footer a').removeClass('hover');
	$('#global_footer a[href="#'+page+'"]').addClass('hover');
};

function onBarcodeScanSuccessed(text, format, type, metaData, content){
	var hash = GHM.getHash()[0]; // hash 第一个参数
	switch (hash){
		case 'note':
			if (unescape(type) == 'ISBN'){
				GHM.getCoverByISBN(unescape(content));
			}else{
				rexseeDialog.alert("您扫描的不是isbn条形码");
			}
			break;
		default:
			if (unescape(type) == 'ISBN'){
				GHM.addBookByIsbn(unescape(content));
			}else{
				rexseeDialog.alert("您扫描的不是isbn条形码");
			}
	}
}

function onBarcodeScanFailed(message){
}

function onTakePictureSuccessed(path){
	rexseeCamera.prepareUpload;
	rexseeUpload.uploadWithCallback('http://guihua.me/mobile/upload/?t=1', 'pic');
	//rexseeUpload.append('image');
}

function onUploadFinished(path, response){
	var hash = GHM.getHash()[0]; // hash 第一个参数
	switch (hash){
		default:
			$('.take_photo').html(response);
			$('.take_photo img').one('load', function() {
				GHM.resizeHeight(this, 68);
			})
				.each(function() {
					if(this.complete) $(this).trigger('load');
				});
			//图片如果加载失败，重新加载
			$('.take_photo img').find('img').error(function() {
				this.src = this.src;
			});
	}
}

function onUploadFileSelected(){
	rexseeUpload.uploadWithCallback('http://guihua.me/mobile/upload/?t=1', 'pic');
}

function onUploadProgressChanged(path, totalSize, uploadedSize){
	var hash = GHM.getHash()[0]; // hash 第一个参数
	switch (hash){
		default:
			if (totalSize == 1){
				$('.take_photo').html('<div style="line-height:70px;text-align:center;">正在连接...</div>');
			}else{
				$('.take_photo').html('<div style="line-height:70px;text-align:center;">已上传'+Math.round(parseInt(uploadedSize)*100/parseInt(totalSize))+'%</div>');
				if (totalSize == uploadedSize){
					$('.take_photo').html('<div style="line-height:70px;text-align:center;">处理中...</div>');
				}
			}
	}
}

function onUploadTimeout(path, timeout){
	alert('timeout');
}
$('.barcode').click(function(e){
	e.preventDefault();
	rexseeBarcode.start(true,true,true);
});

$('.camera').click(function(e){
	e.preventDefault();
	rexseeCamera.takePicture();
});

$('.gallery').click(function(e){
	e.preventDefault();
	rexseeUpload.select('image');
});

$('#mybook img').one('load', function() {
	GHM.resizeHeight(this, 77);
})
	.each(function() {
		if(this.complete) $(this).trigger('load');
	});
//图片如果加载失败，重新加载
$('#mybook img').find('img').error(function() {
	this.src = this.src;
});

GHM.init();

$(window).bind('hashchange', function() {
	console.log(1);
	GHM.hash.change();
});
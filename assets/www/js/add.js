function Unit(){
	this.id = '';
	this.doubanID = '';
	this.cover = '';
	this.title = '';
}
var overElementID = '';//鼠标滑过的单元ID
var overFolderID = '';//鼠标滑过的文件夹ID
var selectElementID = [];//鼠标选中的单元ID列表
var Guihuame = {
	folderProperty: [], //三个字段，当打开folder面板时，用来记载folder的id，名称，总数
	hidePopup: function($t){
		/*
		 隐藏需要关闭的浮出层
		 */
		$('.layer').hide('fast');
		$t.parents('.popup').fadeOut('slow');
	},
	delUnit: function($t){
		/*
		 删除列表中指定单元
		 $t 为目标单元
		 */
		var $li = $t.parents('li');
		Guihuame.openTipPopup('删除中...');
		$.post('/api/book/del/' + overElementID + '/', 'text')
			.success(function(r){
				if (r == 'success'){
					Guihuame.closeTipPopup();
					$li.hide('slow');
				} else {
					Guihuame.openAndCloseTipPopupSoon('系统出错！');
				}
			})
			.error(function (xhr) {
				Guihuame.openAndCloseTipPopupSoon('网络连接错误，请稍候再试！');
				console.log(xhr.responseText);
			});
	},
	multiSelectUnits: function($a, scene){
		/*
		 批量选择列表中的单元，目前主要用来批量移入文件夹
		 */
		var $li = $a.parent(),
			bookid = $a.attr('id').split('_')[1],
			sum = selectElementID.length;
		// 将所有选中的元素，都写到一个全局数组变量中，然后再根据这个变量的长度，来确定是否要高亮文件夹
		// 再加入数组之前，先判断数组是否为空，为空的话，就需要先高亮文件夹
		if (!sum) {
			if (scene == 'root'){
				$('.container .folder').each(function(){
					$(this).find('a:first').addClass('move_target')
						.after('<a href="" class="move_tip" style="display: none;">点此<br />放入<br />||<br /><span>V</span></a>');
					$(this).find('.move_tip').fadeIn('slow');
				});
			}else{
				Guihuame.moveFolderNodes('goto_folder_panel');
			}
		}
		// 对于同一个单元，第一次点击为选中，第二次点击为取消选中，所以要分别增加和移除
		if ($li.attr('class').indexOf('selected') > 0){
			$li.removeClass('selected');
			selectElementID.splice(selectElementID.indexOf(bookid), 1);
			sum -= 1;
		}else{
			$li.addClass('selected');
			selectElementID.push(bookid);
			sum += 1;
		}
		// 数组操作完成后，如果数组为空，则表明当前无选中，应该把文件夹高亮取消
		if (!sum) {
			if (scene == 'root'){
				$('.container .folder').each(function(){
					$(this).find('a:first').removeClass('move_target');
					$(this).find('.move_tip').remove();
				});
			}else{
				Guihuame.moveFolderNodes('goback_container');
			}
		}
	},
	moveFolderNodes: function(action){
		switch (action){
			case 'goto_folder_panel':
				(function(){
					var $from = $('.container .shelf:first'),
						$to = $('#folder_shelf .shelf:first'),
						not_id = Guihuame.folderProperty[0];
					$from.find('.folder').appendTo($to);
					$to.find('.folder[data-id='+not_id+']').hide();
					$to.find('.folder:visible').first().addClass('clear_left');
					$to.find('.folder').each(function(){
						$(this).find('a:first').addClass('move_target')
							.after('<a href="" class="move_tip" style="display: none;">点此<br />放入<br />||<br /><span>V</span></a>');
						$(this).find('.move_tip').fadeIn('slow');
					});
				})();
				break;
			case 'goback_container':
				(function(){
					var $from = $('#folder_shelf .shelf:first'),
						$to = $('.container .shelf:first'),
						not_id = Guihuame.folderProperty[0];
					$from.find('.folder').each(function(){
						$(this).removeClass('selected');
						$(this).find('a:first').removeClass('move_target');
						$(this).find('.move_tip').remove();
					});
					selectElementID = [];
					$from.find('.folder:visible').first().removeClass('clear_left');
					$from.find('.folder[data-id='+not_id+']').show();
					$from.find('.folder').prependTo($to);
				})();
				break;
		}
		Guihuame.resizeScrollBar();
	},
	resizeScrollBar: function(){
		if ($('.lb-content')[0]) {
			$('#folder_shelf').lionbars({
				'resize': true
			});
		}
	},
	modifyFolderName: function(){
		var $title = $('#folder_panel header h3'),
			old_name = Guihuame.folderProperty[1],
			modify_link = $('.edit').html(),
			submit_link = '<a href="" id="modify_folder_submit">确定</a>&nbsp;&nbsp;<a href="" id="modify_folder_cancel">取消</a>';
		var width = $title.width;
		var input = '<input type="text" class="folder_name" placeholder="输入新的文件夹名称" value="'+old_name+'" style="width:'+width+'" />';
		$title.html(input);
		$('.edit').html(submit_link);
		$('.folder_name').focus();
		// 用户发起名称修改时，再加上事件绑定，以节省性能，共绑定三个事件，一个确定、一个取消，一个回车确定
		$('#modify_folder_submit').click(function(e){
			e.preventDefault();
			var new_name = $('.folder_name').val();
			if (new_name && (new_name != old_name)) {
				Guihuame.openTipPopup('更改中...');
				// 该ajax请求会返回修改成功的名称
				$.post('/api/book/changefolder/' + Guihuame.folderProperty[0] +'/'+ encodeURIComponent(new_name) + '/','text')
					.success(function(data){
						if (data == 'has'){
							Guihuame.openAndCloseTipPopupSoon('您已经有以此命名的文件夹！');
							$('.folder_name').val('');
							$('.folder_name').focus();
						} else {
							Guihuame.closeTipPopup();
							Guihuame.folderProperty[1] = data;
							$title.html(Guihuame.folderProperty[1] + '（' + Guihuame.folderProperty[2] + '）');
							$('.edit').html(modify_link);
							// 解除事件绑定
							$('#modify_folder_submit').off('click');
						}
					})
					.error(function (xhr) {
						Guihuame.openAndCloseTipPopupSoon('网络连接错误，请稍候再试！');
						console.log(xhr.responseText)
					});
			}else{
				Guihuame.openAndCloseTipPopupSoon('您没有输入不同于现在的名称');
			}
		});
		$('#modify_folder_cancel').click(function(e){
			e.preventDefault();
			$title.html(Guihuame.folderProperty[1] + '（' + Guihuame.folderProperty[2] + '）');
			$('.edit').html(modify_link);
			// 解除事件绑定
			$('#modify_folder_submit').off('click');
			$('#modify_folder_cancel').off('click');
		});
		$('.folder_name').keydown(function(e){
			if (e.keyCode == '13'){ //enter
				$('#modify_folder_submit').click();
			}
		});
	},
	moveUnitsToFolder: function($a, scene){
		Guihuame.openTipPopup('移动中...');
		var folderid = $a.parent().attr('id').split('_')[1],
			source_folder_id = 0;
		if (scene == 'folder'){
			source_folder_id = Guihuame.folderProperty[0];
		}
		$.post('/api/book/move/' + selectElementID.join('_') + '/' + folderid + '/' + source_folder_id + '/', 'text')
			.success(function(r){
				var target_preview = r.split('|')[0],
					source_preview = r.split('|')[1];
				Guihuame.closeTipPopup();
				$a.parent().find('.folder_preview').find('ul').html(target_preview);
				$('.selected').each(function(){
					$(this).removeClass('selected');
					$(this).hide('slow');
				});
				selectElementID = [];
				$('.folder').each(function(){
					$(this).find('a').removeClass('move_target');
					$(this).find('.move_tip').remove();
				});
				if (scene == 'folder') {
					$('.folder[data-id='+Guihuame.folderProperty[0]+']').find('.folder_preview').find('ul').html(source_preview);
					Guihuame.moveFolderNodes('goback_container');
				}
			})
			.error(function (xhr) {
				Guihuame.openAndCloseTipPopupSoon('移动失败！');
				console.log(xhr.responseText)
			});
	},
	openFolderPanel: function($a){
		/*
		 	启动文件夹面板，根据folder id，获取folder文件里面的所有单元，python返回<ul>代码块
		 */
		var folder_id = $a.parent().attr('data-id');
		popup($('#folder_panel'));
		$.get('/api/book/getfolderCont/' + folder_id + '/')
			.success(function(data){
				$('#folder_shelf').attr('style','');
				$('#folder_shelf').html('<div class="clr"></div>')
					.prepend(data);
				$('#folder_shelf').lionbars();
				//根据返回的代码，初始化folderProperty信息
				Guihuame.folderProperty = [$('#folder_shelf .shelf').attr('data-id'), $('#folder_shelf .shelf').attr('data-name'), $('#folder_shelf .shelf').attr('data-sum')];
				//修改模块
				$('#folder_panel header h3').html(Guihuame.folderProperty[1] +'（' + Guihuame.folderProperty[2] + '）');
				$('#folder_panel .closePopup').click(function(){
					//点击关闭时追加的操作，包括将folder节点移回去
					if (selectElementID.length){
						Guihuame.moveFolderNodes('goback_container');
					}
				})
			})
			.error(function (xhr) {
				Guihuame.openAndCloseTipPopupSoon('获取失败！');
				console.log(xhr.responseText);
			});
	},
	openTipPopup: function(){
		var $t = $('.popup_tip');
		if (arguments[0]){
			$('.processTip').html(arguments[0]);
		}
		if ($t.css('display') == 'none'){
			console.log($t.css('display'));
			var screenW = $(window).width();
			var elementW = $t.width();
			var left = (screenW - elementW)/2;
			left = left > 0 ? left.toString() + 'px' : '0';
			$t.css({
				'left': left
			});
			$t.fadeIn('fast');
		}
	},
	closeTipPopup: function(){
		var $t = $('.popup_tip');
		if (arguments[0]){
			console.log(arguments[0]);
			setTimeout(function(){
				$t.fadeOut('fast');
			}, arguments[0]);
		}else{
			$t.fadeOut('fast');
		}
	},
	openAndCloseTipPopupSoon: function(){
		if (arguments[0]){
			Guihuame.openTipPopup(arguments[0]);
		}else{
			Guihuame.openTipPopup();
		}
		Guihuame.closeTipPopup(1000);

	}
};
$('#searchbar').mouseenter(function(){
	$('#searchbar').animate({
		width:'165px'
	},function(){
		$('#kw').focus();
	});
})
	.mouseleave(function(){
		$('#searchbar').animate({
			width:'130px'
		},'1000',function(){
			$('#kw').blur();
		});
	});
function popup($e){
	if ($e.css('display') != 'none'){
		$('.layer').hide('fast');
		$e.fadeOut('fast');
	}else{
		var screenW = $(window).width();
		var scrrenH = $(window).height();
		var elementW = $e.width();
		var elementH = $e.height();
		var top = (scrrenH - elementH)/2;
		top = top > 0 ? top.toString() + 'px' : '25px';
		var left = (screenW - elementW)/2;
		left = left > 0 ? left.toString() + 'px' : '0';
		$e.css({
			'top': top,
			'left': left
		});
		$('.layer').show('fast');
		$e.fadeIn('fast');
	}
}
function insertShelf(cont){
	if ($('#myshelf li:first')[0]){
		$('#myshelf li:first').before(cont);
	}else{
		$('#myshelf').html(cont);
	}
}
function insertShelfAfterFolders(cont){
	if ($('#myshelf .folder')[0]){
		$('#myshelf .folder:last').after(cont);
	}else{
		$('#myshelf').prepend(cont);
	}
}
$(document).on('click', function(e){
	var $t = $(e.target);
	switch(true){
		case $t.attr('class') == 'closePopup':// close popup
			e.preventDefault();
			Guihuame.hidePopup($t);
			break;
		case $t.attr('id') == 'addFolder'://add folder popup
			e.preventDefault();
			popup($('#folderPopup'));
			$('#newFolder').focus();
			break;
		case $t.attr('id') == 'addFolderAjax'://add folder
			e.preventDefault();
			(function(){
				var name = $('#newFolder').val();
				if (name) {
					Guihuame.openTipPopup('新建中...');
					$.post('/api/book/addfolder/' + encodeURIComponent(name) + '/','text')
						.success(function(r){
							if (r == 'has'){
								Guihuame.openAndCloseTipPopupSoon('您已经有了该文件夹！');
								$('#newFolder').val('');
								$('#newFolder').focus();
							} else {
								Guihuame.closeTipPopup();
								popup($('#folderPopup'));
								insertShelf(r);
								if (selectElementID.length != 0){
									$('.folder:first').find('a:first').addClass('move_target')
										.after('<a href="" class="move_tip" style="display: none;">点此<br />放入<br />||<br /><span>V</span></a>');
									$('.folder:first').find('.move_tip').fadeIn('slow');
								}
								$('#newFolder').val('');
							}
						})
						.error(function (xhr) {
							Guihuame.openAndCloseTipPopupSoon('添加失败！');
							console.log(xhr.responseText)
						});
				}else{
					Guihuame.openAndCloseTipPopupSoon('您没有输入名称');
				}

			})();
			break;
		case $t.attr('id') == 'modify_folder'://modify folder popup
			e.preventDefault();
			Guihuame.modifyFolderName();
			break;
		case $t.attr('id') == 'search'://search
			e.preventDefault();
			(function(){
				var q = $('#kw').attr('value');
				if (!q){
					Guihuame.openAndCloseTipPopupSoon('您需要输入关键词');
				}else{
					$('#kw').focus();
					Guihuame.openTipPopup('搜索中');
					searchBooks(q, '1', '8');
				}
			})();
			break;
		case $t.parent().attr('class') == 'add'://add book
			e.preventDefault();
			(function(){
				Guihuame.openTipPopup('添加中...');
				var currentAdd = new Unit();
				currentAdd.doubanID = $t.parent().attr('href').match(/\d+/)[0];
				currentAdd.cover = $t.parent().find('img').attr('src');
				currentAdd.title = $t.parent().find('img').attr('title');
				$.post('/api/book/add/',{
					'id':currentAdd.doubanID,
					'title': currentAdd.title,
					'cover': currentAdd.cover
				},'text')
					.success(function(r){
						if (r == 'has'){
							Guihuame.openAndCloseTipPopupSoon('您已经添加该书！');
							$('#kw').focus();
						} else {
							Guihuame.closeTipPopup();
							$t.parents('li').hide('slow');
							insertShelfAfterFolders(r);
							$('.container .unit:first').show('slow');
							$('#kw').attr('value','')
								.focus();
						}
					})
					.error(function (xhr) {
						Guihuame.openAndCloseTipPopupSoon('添加失败！');
						console.log(xhr.responseText)
					});
			})();
			break;
		case $t.attr('class') == 'del'://del book
			e.preventDefault();
			Guihuame.delUnit($t);
			break;
		case $t.attr('class') == 'delFolder'://del folder
			e.preventDefault();
			(function(){
				var del_id = overFolderID;
				$('#del_folder_only').click(function(e){
					e.preventDefault();
					Guihuame.openTipPopup('删除中...');
					$.post('/api/book/delfolder/' + del_id + '/f/', 'text')
						.success(function(r){
							Guihuame.closeTipPopup();
							$('#folder_'+del_id).hide('slow');
							$('.container .shelf').find('.folder:last').after(r);
							popup($('#delPopup'));
							$('#del_folder_only').off('click');
							$('#del_folder_all').off('click');
						})
						.error(function (xhr) {
							Guihuame.openAndCloseTipPopupSoon('删除失败！');
							console.log(xhr.responseText)
						});
				});
				$('#del_folder_all').click(function(e){
					e.preventDefault();
					Guihuame.openTipPopup('删除中...');
					$.post('/api/book/delfolder/' + overFolderID + '/f_b/', 'text')
						.success(function(r){
							Guihuame.closeTipPopup();
							$('#folder_'+del_id).hide('slow');
							popup($('#delPopup'));
							$('#del_folder_only').off('click');
							$('#del_folder_all').off('click');
						})
						.error(function (xhr) {
							Guihuame.openAndCloseTipPopupSoon('删除失败！');
							console.log(xhr.responseText)
						});
				});
				popup($('#delPopup'));
			})();
			break;
		case ($t.parent().attr('class') == 'existBook') || ($t.attr('class') == 'existBook')://select book
			e.preventDefault();
			(function(){
				//事件发生所在标签可能不同，需要找到a标签
				var $a,
					scene;
				if ($t.parent().attr('class') == 'existBook') {
					$a = $t.parent();
				}else{
					$a = $t;
				}
				//事件场景可能发生在根目录或者文件夹中，需要有不同的处理手段
				if ($a.parent().parent().attr('data-scene') == 'folder') {
					scene = 'folder';
				}else{
					scene = 'root';
				}
				Guihuame.multiSelectUnits($a, scene);
			})();
			break;
        case $t.attr('class') == 'move_tip' || $t.parent().attr('class') == 'move_tip': //move folder
            e.preventDefault();
            (function(){
				//事件发生所在标签可能不同，需要找到a标签
                var $a,
					scene;
                if ($t.parent().attr('class') == 'move_tip') {
                    $a = $t.parent();
                }else{
                    $a = $t;
                }
				//事件场景可能发生在根目录或者文件夹中，需要有不同的处理手段
				if ($a.parent().parent().attr('data-scene') == 'folder') {
					scene = 'folder';
				}else{
					scene = 'root';
				}
				Guihuame.moveUnitsToFolder($a, scene);
            })();
			break;
		case $t.attr('class') == 'folder_layer': //open the folder panel
			e.preventDefault();
			Guihuame.openFolderPanel($t);
			break;
	}
});
$(document).on('mouseenter', '.unit', function(e){
	// 鼠标移到某个单元上
    if (!$(this).find('.del')[0]) {
        $(this).append($('#panel').html());
    }
    overElementID = $(this).find('.existBook').attr('id').split('_')[1];
    $(this).find('.del').fadeIn('fast');
})
	.on('mouseleave', '.unit', function(e){
		// 鼠标移出某个单元上
        $(this).find('.del').fadeOut('fast');
	});
$(document).on('mouseenter', '.folder', function(e){
    // 鼠标移到某个单元上
    if (!$(this).find('.delFolder')[0]) {
        $(this).append($('#panelForFolder').html());
    }
    overFolderID = $(this).attr('id').split('_')[1];
    $(this).find('.delFolder').fadeIn('fast');
})
    .on('mouseleave', '.folder', function(e){
        // 鼠标移出某个单元上
        $(this).parent().find('.delFolder').fadeOut('fast');
    });
function searchBooks(q, n, step){
	$.getJSON('/api/book/search/'+encodeURIComponent(q)+'/'+ n +'/')
		.success(function(data){
			var total = data['total'];
			var list = data['result'];
			var ul = '';
			$.each(list,function(){
				var li = '<li><a class="add" href="'+this['url']+'" ><img src="' + this['cover'] + '"width="66" height="96" title="' + this['title'] + '" /></img><span>' + this['title'] + '</span></a></li>';
				ul = ul + li;
			});
			var reshtml = '';
			reshtml = ['<a href="" id="closeSearch">×</a><p>以下为搜索结果第',
				Math.ceil(parseInt(n)/parseInt(step)),
				'页，点标题添加，点封面去豆瓣查看详情，<a href="" id="presearch">上页</a>，<a href="" id="nextsearch">下页</a>，<a href="http://book.douban.com/subject_search?search_text=',
				q,
				'&cat=1001">搜豆瓣</a></p><ul class="shelf">',
				ul,
				'</ul><div class="clr"></div>'].join('');
			$('#searchlist')[0].innerHTML = reshtml;
			Guihuame.closeTipPopup();
			$('#searchlist').show('slow');
			$('#search').attr('value','重新搜索');
			$('#closeSearch').click(function(e){
				e.preventDefault();
				$('#searchlist').hide('slow');
				$('#kw').attr('value','');
			});
			$('#kw').focus();
			$('#nextsearch').click(function(){
				var np = parseInt(n) + parseInt(step);
				if (np < total){
					searchBooks(q, np.toString(), step);
					$('#kw').focus();
					return false;
				}else{
					Guihuame.openAndCloseTipPopupSoon('最后一页了！');
					$('#kw').focus();
					return false;
				}

			});
			$('#presearch').click(function(){
				var pp = parseInt(n) - parseInt(step);
				if (pp > 0){
					searchBooks(q, pp.toString(), step);
					$('#kw').focus();
					return false;
				}else{
					Guihuame.openAndCloseTipPopupSoon('这是第一页！');
					$('#kw').focus();
					return false;
				}

			})
		})
		.error(function (xhr) {
			Guihuame.openAndCloseTipPopupSoon('搜索失败！');
			console.log(xhr.responseText);
		});
}
$('#kw').keydown(function(e){
	if (e.keyCode == '13'){ //enter
		$('#search').click();
		$('#kw').focus();
	}
});
$('#newFolder').keydown(function(e){
	if (e.keyCode == '13'){ //enter
		$('#addFolderAjax').click();
	}
});
$(document).keydown(function(e){
	if (e.keyCode == '27'){ //enter
		$('.closePopup').click();
	}
});
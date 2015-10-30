var fs = require('fs');
var path = require('path');

var passData = path.join('C:', 'PassKeeper', 'data.dat');
var verData = path.join('C:', 'PassKeeper', 'Verify.dat');
var dataDir = path.join('C:', 'PassKeeper');
// Create dir & files.
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir);
	createFile();
} else {
	createFile();
}

function createFile() {
	if (!fs.existsSync(passData)) {
		fs.openSync(passData, 'w+');
		fs.writeFileSync(passData, 'U2FsdGVkX1/IiGxZmy2B7v39Odl9kxyrsanZqTIgE7S5+wyLiw9eHEE7h6vLPdN8U6N/vtr5AlPG5NfXtg8AFkhmK4h2fXnB8Ro3IegVpQw=');
	}
	if (!fs.existsSync(verData)) {
		fs.openSync(verData, 'w+');
		fs.writeFileSync(verData, 'U2FsdGVkX18ygWe8JB+VZ2xI5/oYKBUk9nxD0H9EnkiVDxeExGNmk5tsBePBlHJL');
	}
}
 
function encode(data,key){
	var secret = key || "asdhjwheru*asd123&123";
    var crypted = CryptoJS.AES.encrypt(data, secret);
    console.log(crypted);
    return crypted;
}  

function decode(data,key){
	var secret = key || "asdhjwheru*asd123&123";
	var decrypted = CryptoJS.AES.decrypt(data,secret).toString(CryptoJS.enc.Utf8);
    return decrypted;
}  

$(function() {
				Boxlayout.init();
			});

// $("#cl-login").click(function() {
// 	$("#bl-login").addClass("bl-login");
// });

$("#bl-login").keydown(function(event) {
	if (event.keyCode == 13) {
		checkPwd();
	}
});

var clipboard = new Clipboard('.am-icon-clipboard');
clipboard.on('success', function(e) {
	e.clearSelection();
	iosOverlay({
		text: "Copied!",
		duration: 1000,
		icon: ""
	});
});

function didRegister() {
	// 读取Verify并解析json数据
	// 判定是否为NULL，是则弹出初始密码设置窗口，否则显示密码输入页面
	// 同步读取
	var data = fs.readFileSync(verData);
	data = decode(data.toString(), "");

	var obj = JSON.parse(data);
	if (obj.password === "ThisIsInitPwd") {
		// Modal to register window.
		$("#hint").removeClass("am-hide");
	} else {
		$("#lg-hint").removeClass("am-hide");
	}
}

function setPwd(password) {
	var str = '{"password":"' + password + '"}';
	str = encode(str, "");
	fs.writeFileSync(verData, str);
}

function changePwd() {
	var newPwd = $("#changePwd").val();
	if (newPwd == "") {
		iosOverlay({
		text: "Failure!",
		duration: 1000,
		icon: ""
		});
	} else {
		setPwd(newPwd);
		$("#changePwd").val("");
		iosOverlay({
			text: "Success!",
			duration: 1000,
			icon: ""
		});
	}
}

function checkPwd() {
	var data = fs.readFileSync(verData);
	data = decode(data.toString(), "");
	var obj = JSON.parse(data);
	var pwd = $("#pwd").val();
	// 如果从未设置过密码则进行密码设置
	if (obj.password === "ThisIsInitPwd" && pwd != "") {
		setPwd(pwd);
		data = fs.readFileSync(verData);
		data = decode(data.toString(), "");
		obj = JSON.parse(data);
	}
	if (obj.password === pwd) {
		// Login successful
		$("#bl-main").removeClass("bl-expand-item");
		$("#bl-login").removeClass("bl-expand bl-expand-top");
		$("#bl-login").addClass("bl-login");
		// 显示账户列表
		showPwdList();
	} else {
		// Warning
		// 添加延时执行，当shake完毕之后再执行remove
		$("#lg-field").addClass("am-animation-shake");
		var t = setTimeout(function() {
			$("#lg-field").removeClass("am-animation-shake");
			clearTimeout(t);}, 500);
	}
}

function showPwdList() {
	// 获取数据数组
	var pwdList = readPwdList();
	// 处理单条数据的展示
	for (var item in pwdList) {
		if (pwdList[item] == "") {
			continue
		}
		var data = decode(pwdList[item], '');
		var obj = JSON.parse(data);
		var str = ['<li class="item">',
					'<span class="am-text-sm am-text-truncate">' + obj.tag +'</span> <br>',
					'<div class="am-g am-text-left">',
					'<i class="am-icon-user am-u-sm-2"></i>',
					'<p class="itemText am-u-sm-8 am-text-truncate">' + obj.account + '</p>',
					'<i class="am-icon-trash am-u-sm-1" value="' + item + '"></i>',
					'</div> <br>',
					'<div class="am-g am-text-left">',
					'<i class="am-icon-lock am-u-sm-2"></i>',
					'<p class="itemText am-u-sm-8">••••••••</p>',
					'<i class="am-icon-clipboard am-u-sm-1"}" data-clipboard-text="' + obj.password + '"></i>',
					'</div></li>'].join("");
		$("#items").append(str);
	}

	$(".am-icon-clipboard").mouseover(function() {
		$(this).popover({
			content: "Copy",
			trigger: "hover"
		})
	});

	$(".am-icon-trash").mouseover(function() {
		$(this).popover({
			content: "Delete",
			trigger: "hover"
		})
	});

	$(".am-icon-trash").click(function() {
		var item = $(this).attr("value");
		delAcc(item);
		$(this).parents("li.item").fadeOut(500);
		setTimeout(function(){
			$(this).parents("li.item").remove();
		}, 1000);
		iosOverlay({
			text: "Deleted!",
			duration: 1000,
			icon: ""
		});
	});
}

function readPwdList() {
	// 同步读取数据
	var data = fs.readFileSync(passData).toString();
	var accList = new Array();
	accList = data.split("\r");
	return accList;
}

function writePwdList() {
	// 新添加内容的处理
	var data = "";
	var newData = $("#addPwdForm").serializeArray();

	if (newData[0].value == "" || newData[1].value == "" || newData[2].value == "") {
		return;
	}

	data = ['\r{"' + newData[0].name + '":"' + newData[0].value + '", ',
			'"' + newData[1].name + '":"' + newData[1].value + '", ',
			'"' + newData[2].name + '":"' + newData[2].value,
			 '"}'].join("");
	// Encrypt
	data = '\r' + encode(data, '');
	// 追加模式打开文件写入数据
	fs.open(passData, 'a', function(err, fd) {
		if (err) {return console.error(err);}
		// 追加至文件尾部
		fs.appendFileSync(passData, data);
		// 关闭文件
		fs.closeSync(fd);
	});
	// 添加成功提示
	iosOverlay({
		text: "Success!",
		duration: 1000,
		icon: ""
	});
	// 清空表单
	$(':input','#addPwdForm')  
	 .not(':button, :submit, :reset, :hidden')  
	 .val('') 
	 .removeAttr('checked')
	 .removeAttr('selected');

	var t = setTimeout(function() {
		$("#items").empty();
		showPwdList();
		clearTimeout(t);
	}, 1000);
}

function delAcc(item) {
	var dataList = readPwdList();
	dataList.splice(item, 1);
	var data = "";
	for (var i in dataList) {
		if (dataList[i] == "") {continue}
		data = data + dataList[i] + '\r';
	}
	console.log(data);
	fs.writeFileSync(passData, data);
	var t = setTimeout(function() {
		$("#items").empty();
		showPwdList();
		clearTimeout(t);
	}, 1000);
}

didRegister();
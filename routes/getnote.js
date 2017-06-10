var express = require('express');
var Markdown = require('markdown-to-html').Markdown;
var router = express.Router();
var fs = require('fs');
// Middleware
// Md
// pdf
// return
function markdown2html(path, res){
	var result = '';
	let md = new Markdown();
	var opts = {title: 'File $BASENAME in $DIRNAME'};
	// var opts
	console.log("[*] Start converting",path,"into html");
	md.setEncoding('UTF8');
	md.on('end',function(){
		console.log("[+] Finish parsing",path,"into html");
	});
	md.render(path,opts,function(err){
		if(err){
			console.log("[-] Error in parsing",path,"into html");
			console.log(">>>",err);
			// Better err msg
			return "Error detected!";
		}
		// md.pipe(process.stdout);
		md.pipe(res);
	})
}
function pdf2html(path){
	return;
}


router.get('/:subject/:note',function(req,res,next){
	console.log('[*] Request note:',req.params.subject,req.params.note);
	let filedir = (new Array('CommonNote-note',req.params.subject, req.params.note)).join("/");
	fs.readFile(filedir+"/info.json",function(err, data){
		if(err){
			// Handle note error
			switch(err.code){
				case 'ENOENT':
					console.log("[-] Invalid note, Check git pull request");
					break;
				default:
					console.log("[-] Error:",err);
					break;
			}
			res.render('noteErr',{title:err.code, err:err});
		}
		// Set header
		res.set('Content-Type', 'text/plain;charset=utf-8');


		let info = JSON.parse(data);
		switch(info.notetype.toLowerCase()){
			case "pdf":
				var content = pdf2html();
				console.log("[+] Request",info.title,"successfully in pdf form");
				break;
			case "markdown":
				var content = markdown2html(filedir+"/content.md",res);
				console.log("[+] Request",info.title,"successfully in markdown form");
				break;
			default:
				// Not support filetype
				res.render('noteErr',{title:"Not support filetype",err:""})
				break;
		}
	})
})
module.exports = router;
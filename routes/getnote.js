var express = require('express');
var Markdown = require('markdown-to-html').Markdown;
var router = express.Router();
var fs = require('fs');
// Middleware
// Md
// pdf
// return
function markdown2html(path, res, opt, next){
	let skip = next;
	let md = new Markdown();
	let opts = {};
	// var opts
	console.log("[*] Start converting",path,"into html");
	md.setEncoding('UTF8');
	md.on('end',function(){
		console.log("[+] Finish parsing",path,"into html");
		console.log(skip);
		if(!opt){
			// Not Final ?
			skip('route');
		}
	});
	md.render(path,opts,function(err){
		if(err){
			console.log("[-] Error in parsing",path,"into html:");
			console.log(err);
		}
		else{
		// opt: Whether end transmit or not
			md.pipe(res,{end:opt});
		}
	})
}
function pdf2html(path,res,info){
	res.send(["<h2>",info.title,"</h2>","By",info.author,"<a src='mailto:",info.email,"'>Email</a>","<object data='",path,"' type='application/pdf' width=100% height=100%>\
		<p>This browser does not support inline PDFs. Please download the PDF to view it: \
		<a href='",path,"'>Download PDF</a></p></object>"].join(" "));
}
var getintro = function(req,res,next){
	res.set('Content-Type', 'text/plain;charset=utf-8');
	// Get intro
	console.log('[*] Request note:',req.params.subject,req.params.note);
	let filedir = (new Array('CommonNote-note',req.params.subject, req.params.note)).join("/");
	// Load basic intro about note and author
	fs.readFile(filedir+"/intro.md",function(err,data){
		if(err){
			// Unable to load intro
			switch(err.code){
				case 'ENOENT':
					console.log("[-] Unable to find intro, switch to automatic generation...");
					break;
				default:
					console.log("[-] Unknown Error, switch to automatic generation...");
					break;
			}
			next();
		}
		markdown2html(filedir+"/intro.md",res,false,next);
	});
}
var genintro = function(req,res,next){
	// Automatically generate intro text
	let filedir = (new Array('CommonNote-note',req.params.subject, req.params.note)).join("/");
	fs.readFile(filedir+"/info.json",function(err,data){
		if(err){
			// Unable to load info
			switch(err.code){
				case 'ENOENT':
					console.log("[-] Unable to find info, automatic generation failed");
					break;
				default:
					console.log("[-] info.json Error, automatic generation failed:",err);
					break;
			}
			next();
		}
		let newintro = filedir+"/intro.md";
		let introwriter = fs.createWriteStream(newintro);
		let info = JSON.parse(data);
		introwriter.write("This is "+info.title+" by "+info.author+". Version: "+info.publish[info.publish.length-1].ver,'UTF8');
		introwriter.end();
		introwriter.on('finish',function(){
			console.log("[+] Finish automatically generating intro.md");
			markdown2html(newintro,res,false,next);
		});
		introwriter.on('error',function(err){
			console.log("[-] info.json Error, automatic generation failed:",err);
			next();
		});
	
	});
}

var parser = function(req,res,next){
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

			let info = JSON.parse(data);
			// Set header
			

			

				switch(info.notetype.toLowerCase()){
					case "pdf":
						pdf2html(filedir+"/content.pdf",res,true);
						console.log("[+] Request",info.title,"successfully in pdf form");
						break;
					case "markdown":
						markdown2html(filedir+"/content.md",res,true);
						console.log("[+] Request",info.title,"successfully in markdown form");
						break;
					default:
						// Not support filetype
						res.render('noteErr',{title:"Not support filetype",err:""})
						break;
			}

		});
}

// Middleware 1 intro. 2 content
router.get('/:subject/:note',getintro,genintro);
router.get('/:subject/:note',parser);

module.exports = router;
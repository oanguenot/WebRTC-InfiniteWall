(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    definition(module.exports, localRequire(name), module);
    var exports = cache[name] = module.exports;
    return exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path];
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex];
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
require.register("application", function(exports, require, module) {
// Application bootstrapper.
Application = {
    initialize: function() {
        
        var HomeView = require('views/home_view'),
        	MainView = require('views/main_view'),
        	Router   = require('lib/router');

        this.homeView = new HomeView();
        this.mainView = new MainView();
        this.router   = new Router();
        
        if (typeof Object.freeze === 'function') Object.freeze(this)
        
    },

	route: function(route) {
	    this.router.navigate(route, {trigger:true});
	}
}

module.exports = Application;

});

;require.register("initialize", function(exports, require, module) {
var application = require('application')

$(function() {
    application.initialize()
    Backbone.history.start()
})

});

;require.register("lib/me", function(exports, require, module) {
var Participant = require('../models/participant'),
	Conference = require('../models/conference');

var me = new Participant(),
	conference = new Conference();

var _mode = "connivence";

me.on('change', function(model) {
	Backbone.Mediator.publish('me:changed', model);
});

module.exports = {
	
	setInfo: function(nickname, hasAudio, hasVideo) {
		me.set({hasAudio: hasAudio, hasVideo: hasVideo, nickname: nickname});
	},

	setConference: function(info) {
		conference.set({title: info.conferenceTitle, room: info.conferenceCode});
	},

	getConference: function() {
		return conference;
	},

	getConferenceTitle: function() {
		return conference.get('title');
	},

	getConferenceCode: function() {
		return conference.get('room');
	},

	setId: function(id) {
		me.set({id: id});
	},

	nickname: function() {
		return me.get('nickname');
	},

	hasAudio: function() {
		return me.get('hasAudio');
	},

	hasVideo: function() {
		return me.get('hasVideo');
	},

	shouldCreateNewConference: function() {
		return (conference.get('room').length === 0 ? true : false);
	},

	setMode: function(mode) {
		_mode = mode;
	},

	getMode: function() {
		return _mode;
	},

	createNewConference: function() {
		$.ajax({
			url: "/conference",
			type: "POST",
			data: {
				title: conference.get('title')
			}
		}).done(function ( data ) {
			conference.set(data);
		}).fail(function ( data ) {
			console.log("ERROR:", data);
		});
	},

	joinExistingConference: function(code) {
		$.ajax({
			url: "/conference/" + code,
			type: "GET",
		}).done(function ( data ) {
			conference.set({'id': data.id, 'title': data.title});
		}).fail(function ( data ) {
			console.log("ERROR:", data);
		});
	},

	createOrJoinConferenceByID: function(roomID, conferenceName) {
		$.ajax({
			url: "/conference/" + roomID,
			type: "POST",
			data: {
				title: conferenceName
			}
		}).done(function ( data ) {
			console.log("coucou");
			conference.set(data);
		}).fail(function ( data ) {
			console.log("ERROR:", data);
		});
	}

};


});

;require.register("lib/media", function(exports, require, module) {
Sonotone.debug = true;
Sonotone.enableSTUN = true;

/*
Sonotone.STUN = {
    iceServers: [
		{
    		url: "stun:stun.l.google.com:19302"
    	}, 
    	{
            url: "turn:numb.viagenie.ca", credential: "oanguenot", username: "oanguenot%40gmail.com"
        }
    ]
};
*/

var io = null;

var sono = new Sonotone.IO(new Date().getTime());

sono.localMedia().on('onLocalVideoStreamStarted', function onLocalStreamStarted(stream) {
	Backbone.Mediator.publish('media:localStreamStarted', stream, Sonotone.ID);
}, this);

sono.localMedia().on('onLocalVideoStreamEnded', function onLocalStreamEnded() {

}, this);

sono.localMedia().on('onLocalVideoStreamError', function onLocalStreamError() {

}, this);

sono.remoteMedia().on('onRemoteStreamStarted', function onRemoteStreamStarted(id) {
	Backbone.Mediator.publish('media:remoteVideoON', id);
}, this);

sono.remoteMedia().on('onRemoteStreamEnded', function onRemoteStreamEnded(id) {
	Backbone.Mediator.publish('media:remoteVideoOFF', id);
}, this);

sono.on('onPeerConnected', function onPeerConnected(data) {
	Backbone.Mediator.publish('media:participantConnected', data.id, data.caps);
}, this);

sono.on('onPeerDisconnected', function onPeerDisconnected(id) {
	Backbone.Mediator.publish('media:participantDisconnected', id);
}, this);

sono.on('onPeerChat', function onPeerChat(data) {
	Backbone.Mediator.publish('media:participantMessage', data.id, data.content);
}, this);

sono.on('onPeerAlreadyConnected', function onPeerAlreadyConnected(data){
	Backbone.Mediator.publish('media:participantAlreadyConnected', data.id, data.caps);
}, this);

sono.on('onCallOffered', function onCallOffered(id){
	Backbone.Mediator.publish('media:onCallOffered', id);
}, this);

sono.on('onCallAnswered', function onCallAnswered(id){
	Backbone.Mediator.publish('media:onCallAnswered', id);
}, this);

module.exports = {

	acquireCamera: function(withAudio, withVideo) {
		var constraints = {
            audio: withAudio,
            video: withVideo,
            format: 'qvga'
        };

        sono.localMedia().acquire(constraints);
	},

	acquireScreen: function() {
		sono.localMedia().acquireScreen();
	},

	renderLocalStream: function(HTMLElement) {
		sono.localMedia().renderVideoStream(HTMLElement);
	},

	connectToServer: function(caps, room) {

		sono.transport('websocket', {host: window.location.hostname, port: null});

		sono.transport().on('onReady', function onReady() {

		}, this);

		sono.transport().on('onClose', function onClose() {

		}, this);

		sono.transport().on('onError', function onError() {

		}, this)

		sono.transport().connect(caps, room);
	},

	callParticipant: function(id, hasRemoteDataChannel) {
		sono.call(id, hasRemoteDataChannel);
	},

	answerParticipant: function(id, hasRemoteDataChannel) {
		sono.answer(id, hasRemoteDataChannel);
	},

	displayParticipantVideo: function(HTMLElement, id) {
		sono.remoteMedia().renderStream(HTMLElement, id);
	},

	sendMessage: function(message) {
		sono.sendChatMessage(message);
	},

	sendData: function(msg, callee) {
		sono.sendMessageUsingChannel(msg, callee);
	},

	getCapabilities: function() {
		return sono.capabilities();
	},

	isMe: function(id) {
		return (id === sono.ID ? true: false);
	}

};
});

;require.register("lib/router", function(exports, require, module) {
var application = require('application'),
    me = require('./me');


function getQueryParams(qs) {
    qs = qs.split("+").join(" ");

    var params = {}, tokens = true, re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens) {
        tokens = re.exec(qs);
        if (tokens) {
            params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
        }
    }

    return params;
};

Backbone.Mediator.subscribe('goto', function(route) {
    application.route(route);
});

module.exports = Backbone.Router.extend({
    routes: {
        '': 'home',
        'join?:querystring': 'onParticipantJoin',
        'mainPage': 'mainPage'
    },
    
    home: function() {
        $('body').html(application.homeView.render().el);
    },

    mainPage: function() {
    	$('body').html(application.mainView.render().el);
    },

    onParticipantJoin: function() {
        var url = window.location.hash.substr(5);

        params = getQueryParams(url);

        $('body').html(application.homeView.render().el);

        application.homeView.setRoom(params.room);
        
    }
});

});

;require.register("lib/view_helper", function(exports, require, module) {
// Put handlebars.js helpers here

});

;require.register("models/collection", function(exports, require, module) {
// Base class for all collections
module.exports = Backbone.Collection.extend({
    
})

});

;require.register("models/conference", function(exports, require, module) {
module.exports = Backbone.Model.extend({
    
	defaults: {
        id: '',
        room: '',
        title: ''
    },

    initialize: function(){
    }

});
});

;require.register("models/im", function(exports, require, module) {
var Message = require('./message');

module.exports = Backbone.Collection.extend({
	model: Message
});
});

;require.register("models/message", function(exports, require, module) {
module.exports = Backbone.Model.extend({
    
	defaults: {
        time: new Date(),
        issuer: '',
        content: ''
    },

    initialize: function(){
    }

});
});

;require.register("models/model", function(exports, require, module) {
// Base class for all models
module.exports = Backbone.Model.extend({
    
})

});

;require.register("models/participant", function(exports, require, module) {
module.exports = Backbone.Model.extend({
    
	defaults: {
        id: '',
        hasAudio: false,
        hasvideo: false,
        nickname: '',
        size:'participant',
        date: new Date(),
    },

    initialize: function(){
    }

});
});

;require.register("server/config", function(exports, require, module) {
//var dbHost= 'mongo.onmodulus.net';
//var dbName= 'patuP8at';
//var dbUser= 'crock';
//var dbPass= 'crock';

var dbConfig = {
    dbUser      : 'crock',
    dbPass      : 'crock',
    dbPort      : 27017,
    dbHost      : 'mongo.onmodulus.net',
    dbName      : 'patuP8at'
};
/*
var dbConfig = {
    dbUser      : "",
    dbPass      : "",
    dbPort      : 27017,
    dbHost      : 'localhost',
    dbName      : 'connivence'
};
*/

exports.cfg = function() {
    return dbConfig;
};


});

;require.register("server/connection", function(exports, require, module) {

console.log ("[CONNECTION::Start");

//var io = require('socket.io'); 
var sockets = null;
var connections = [];

var connected = [];

var conferences = {};

var _getConferenceByRoom = function _getConferenceByRoom(code) {
	
	if(code in conferences){
		return {
			title : conferences[code].title,
			id: conferences[code].id,
			room: conferences[code].room
		};
	}
	else {
		return null;
	}
}

var _addNewConference = function _addNewConference(title) {

	var conference = {
		title : title,
		id: new Date().getTime(),
		room: Math.floor(Math.random() * 1000) + '-' + Math.floor(Math.random() * 1000)
	}

	console.log("[CONNECTION::Add new room:" + conference.room + " | " + conference.title);

	conferences[conference.room] = {
		connections : [],
		title: conference.title,
		id: conference.id,
		room: conference.room
	};

	return conference;
};

var _createOrJoinConference = function _createOrJoinConference(title, roomID) {

	if( roomID in conferences) {
		
		return {
			title : conferences[roomID].title,
			id: conferences[roomID].id,
			room: conferences[roomID].room
		};
	}
	else {

		var conference = {
			title : title,
			id: new Date().getTime(),
			room: roomID
		};

		conferences[conference.room] = {
			connections : [],
			title: conference.title,
			id: conference.id,
			room: conference.room
		};

		return conference;
	}
}

var _startServer = function _startServer(wsServer) {

	wsServer.on('request', function(request) {
		var connection = request.accept(null, request.origin);

		//connections.push({id: '', socket: connection});

    	//console.log("New peer connected");

    	// This is the most important callback for us, we'll handle
    	// all messages from users here.
    	connection.on('message', function(evt) {
        	
        	if (evt.type === 'utf8') {
		
        		var msg = JSON.parse(evt.utf8Data);
            
            	var caller = msg.caller;
            	var room = msg.room;
            	var currentRoom = conferences[room];

            	//console.log("RECEIVED from <" + caller + ">:" + evt.utf8Data);

	            if(msg.data.type === "join") {

	            	// Assign the socket to the correct room
	            	// Todo remove the connection from this temp array
	            	//for (var i=0;i<connections.length;i++) {
	            		//if(connections[i].socket === connection) {
	            			conferences[room].connections.push({id: caller, socket: connection, caps: msg.data.caps});
	            			console.log("<"+ caller + "> has entered room <"+ room + ">");
	            			//connections[i] = null;
	            			//delete connections[i];
	            			console.log("store in connected:" + room);
	            			connected.push({socket: connection, room: room, id: caller});
	            			//break;
	            		//}
	            	//}

	            	// Alert others peers
	                for (var i=0;i<currentRoom.connections.length;i++) {
	                    // Associate Socket <-> ID
	                    if(currentRoom.connections[i].socket === connection) {
	                        /*
	                        //console.log("old id:" + connections[i].id);
	                        connections[i].id = caller;
	                        //store capabilities
	                        connections[i].caps = msg.data.caps;
	                        console.log("<"+ caller + "> has been associated to a socket");
	                        */
	                    }
	                    // Send information about other peer connected
	                    else {
	                        console.log("Inform <" + currentRoom.connections[i].id + "> about new peer <" + caller + ">");
	                        currentRoom.connections[i].socket.send(evt.utf8Data);

	                        console.log("Inform <" + caller + "> about connected <" + currentRoom.connections[i].id + ">");

	                        // Send to this peer all others connections
	                        var msg = {
	                            data: {
	                                type: 'already_joined',
	                                caps: currentRoom.connections[i].caps
	                            },
	                            callee: caller,
	                            caller: currentRoom.connections[i].id
	                        };

	                        connection.send(JSON.stringify(msg));
	                    }
	                }

	            } else {
	            	// Send a message to only one peer
	            	if(msg.callee !== "all") {
	                    for (var i = 0;i < currentRoom.connections.length; i++) {
	                        //console.log("Connections:" + connections[i].id);
	                        if(currentRoom.connections[i].id === msg.callee) {
	                            console.log("Send message <" + msg.data.type + "> to <" + currentRoom.connections[i].id + "> in room <" + room + ">");
	                            currentRoom.connections[i].socket.send(evt.utf8Data);
	                        }
	                     }
	                }
	                // Send a message to all peer
	                else {
	                    for (var i = 0;i < currentRoom.connections.length; i++) {
	                        // Except me
	                        if(currentRoom.connections[i].socket !== connection) {
	                            console.log("Send message <" + msg.data.type + "> to <" + currentRoom.connections[i].id + "> in room <" + room + ">");
	                            currentRoom.connections[i].socket.send(evt.utf8Data);
	                        }
	                        else {
	                        	if(msg.data.type === "chat") {
	                        		console.log("Send message <" + msg.data.type + "> back to <" + currentRoom.connections[i].id + "> (me) in room <" + room + ">");
	                        		currentRoom.connections[i].socket.send(evt.utf8Data);
	                        	}
	                        }
	                    }
	                }
            	}
            }
        	else {
          		//console.log("RECEIVED OTHER:" + evt.binaryData);
        	}	
		});

		// TODO: A adapter pour supprimer la connection dans la bonne room!!!!!
		connection.on('close', function() {
			console.log("bye bye peer");

			var index = -1;
			var room = '';

	        for (var i = 0;i < connected.length; i++) {
	            if(connected[i].socket === connection) {
	                index = i;
	               room = connected[i].room;
	            }
	        }

	        if(index > -1) {
	            console.log("remove item:" + index);
	            var old = connected.splice(index, 1);

	            var conference = conferences[room];

	            var index = -1;

	            //Inform others peers that are in the same conference about the disconnection
	            for (var i = 0; i < conference.connections.length; i++) {
	                if(conference.connections[i].socket !== connection) {

	                    var toSend = {
	                        data: {
	                            type:'release'
	                        },
	                        callee: 'all',
	                        caller:old[0].id
	                    };
	                    conference.connections[i].socket.send(JSON.stringify(toSend));
	                }
	                else {
	                	index = i;
	                }
	            }

	            // Remove from the room
	            conference.connections.splice(index, 1);
	        }
		});

	});

	wsServer.on('close', function(request) {


	});
	

};

exports.startWebSocketServer = function(server) {
	_startServer(server);
};

exports.addNewConference = function(title) {
	return (_addNewConference(title));
};

exports.getConferenceByRoom = function(code) {
	return (_getConferenceByRoom(code));
};

exports.createOrJoinConference = function(title, code) {
	return (_createOrJoinConference(title, code));
}


});

;require.register("server/dbManager", function(exports, require, module) {
var crypto       = require('crypto');
var MongoDB      = require('mongodb').Db;
var Server       = require('mongodb').Server;
var ObjectID     = require('mongodb').ObjectID;
//var moment       = require('moment');

var config       = require('./config');

console.log ("[DB-MANAGER]::Start");

var db = new MongoDB(config.cfg().dbName, new Server(config.cfg().dbHost, config.cfg().dbPort, {auto_reconnect: true}), {w: 1});
    db.open(function(e, d){
    if (e) {
        console.log(e);
    }   else{
        console.log('connected to database :: ' + config.cfg().dbName);

        if(config.cfg().dbUser.length > 0) {
            db.authenticate(config.cfg().dbUser, config.cfg().dbPass, function(e, d){
                if(e) {
                    console.log('Error using :: ' + config.cfg().dbUser);
                    console.log(e);
                }
                else {
                    console.log('logged with :: ' + config.cfg().dbUser);
                }
            });
        }
    }
});

/*
var accounts = db.collection('accounts'),
    topics = db.collection('topics'),
    notes = db.collection('notes'),
    subscriptions = db.collection('subscriptions');
*/
/* ---------------------------------------------------------- Account part ------------------------------------------*/



});

;require.register("server/router", function(exports, require, module) {
//var db = require('./dbManager'),
var cnx = require('./connection');

module.exports = function(server, app) {

    console.log ("[SERVER-ROUTER]::Start");
    cnx.startWebSocketServer(server);


    /* REST API */

    app.post('/conference', function(req, res){
        console.log("[SERVER-ROUTER]:: Create a new room " +  req.param('title'));

        var conf = cnx.addNewConference(req.param('title'));

        res.send(conf, 201);
    });

    // FOR PINGME
    app.post('/conference/:code', function(req, res){
        console.log("[SERVER-ROUTER]:: Create or join new room for PINGME " +  req.param('code'));

        var conference = cnx.createOrJoinConference(req.param('title'), req.param('code'));

        res.send(conference, 200);
    });

	app.get('/conference/:code', function(req, res){

		var code = req.param('code');

        console.log("[SERVER-ROUTER]:: Get information on existing room " + code );
        
        var conference = cnx.getConferenceByRoom(code)

        if(conference) {
        	res.send(conference, 200);
        }
        else {
        	res.send("not-found", 404);
        }
    });

};

});

;require.register("views/home_view", function(exports, require, module) {
var View     = require('./view'),
  	template = require('./templates/home'),
    me = require('../lib/me');

var isNicknameReady = false,
    nickname = '';

var isConferenceNameReady = false,
    conferenceTitle = '';

var isConferenceCodeReady = false,
    conferenceCode = '';

var selectedCapability = "full";

module.exports = View.extend({

    id: 'home-view',
    template: template,

    events: {
        'keyup #inputNickname'      : 'onNicknameChanged',
        'keyup #inputCode'          : 'onCodeChanged',
        'keyup #inputTitle'         : 'onTitleChanged',

        'click .capabilitySelector' : 'onCapabilityChange',
        'click .filterCapability'   : 'onCapabilityClick',

        'click #joinExistingButton' : 'onJoinExistingConference',
        'click #joinNewButton'      : 'onJoinNewConference'
    },

/*
    subscriptions: {
        'media:localStreamStarted': 'onLocalMediaStarted'
    },
*/

    initialize: function() {
        this.listenTo(me.getConference(), 'change:id', this.onConferenceIDChange);
    },

    afterRender: function(){
    	//media.acquireCamera();
    },

/*
    onLocalMediaStarted: function(stream) {
    	media.renderStream(this.$('#local-video')[0]);
        isMediaReady = true;
        this.updateJoinButton();
    },
*/

    onJoinRequest: function(e) {
        e.preventDefault();
        
        
    },

    onNicknameChanged: function() {
        nickname = this.$('#inputNickname').val();

        if(nickname.length > 0) {
            isNicknameReady = true;
        }
        else {
            isNicknameReady = false;
        }
        this.updateJoinButton();
    },

    onCodeChanged: function() {
        conferenceCode = this.$('#inputCode').val();

         if(conferenceCode.length > 0) {
            isConferenceCodeReady = true;
        }
        else {
            isConferenceCodeReady = false;
        }
        this.updateJoinButton();
    },

    onTitleChanged: function() {
        conferenceTitle= this.$('#inputTitle').val();

         if(conferenceTitle.length > 0) {
            isConferenceNameReady = true;
        }
        else {
            isConferenceNameReady = false;
        }
        this.updateJoinButton();
    },

    updateJoinButton: function() {
        if(isNicknameReady && isConferenceNameReady) {
            this.$('#joinNewButton').removeAttr("disabled");
        }
        else {
            this.$('#joinNewButton').attr("disabled", "disabled");
        }

        if(isNicknameReady && isConferenceCodeReady) {
            this.$('#joinExistingButton').removeAttr("disabled");
        }
        else {
            this.$('#joinExistingButton').attr("disabled", "disabled");
        }

    },

    onCapabilityChange: function(e) {
        e.preventDefault();

        this.$('.l-' + selectedCapability).removeClass('selected');

        selectedCapability = e.currentTarget.attributes[1].nodeValue;
        this.$('.l-' + selectedCapability).addClass('selected');
        var text = this.$('.' + selectedCapability).attr('data-text');

        this.$('.selectedCapability').text(text);
        this.$('.selectedCapability').attr('data-capabilities', selectedCapability);
    },

    onCapabilityClick: function(e) {
        e.preventDefault();
    },

    onJoinExistingConference: function(e) {
        e.preventDefault();
        this.goToConference(true);
        
    },

    onJoinNewConference: function(e) {
        e.preventDefault();
        this.goToConference(false);
    },

    goToConference: function(existingConference) {
        var hasAudio = (selectedCapability === 'full' || selectedCapability === 'audio');
        var hasVideo = (selectedCapability === 'full' || selectedCapability === 'video');

        var conferenceInfo = {
            isNewConference: !existingConference,
            conferenceCode: existingConference ? conferenceCode : '',
            conferenceTitle: existingConference ? '' : conferenceTitle
        };

        me.setInfo(nickname, hasAudio, hasVideo);
        me.setConference(conferenceInfo);

        if(existingConference) {
            me.joinExistingConference(me.getConferenceCode());
        }
        else {
            me.createNewConference(me.getConferenceTitle());
        }

    },

    onConferenceIDChange: function() {
        Backbone.Mediator.publish('goto', 'mainPage');
    },

    setRoom: function(room) {
        this.$('#inputCode').val(room);
        this.$('#inputTitle').prop('disabled', true);
        isConferenceCodeReady = true;
        conferenceCode = room;
    }
});

});

;require.register("views/local", function(exports, require, module) {
var View     = require('./view');

var timeoutID = -1;

module.exports = View.extend({

	className: "participant",

	template: require('./templates/local'),

    local: null,

	events: {
	},

	subscriptions: {

    },

    initialize: function(options) {
        local = options.participant;
	},

	afterRender: function(){
		$(this.el).attr('id', this.options.participant.id);
	},

	getRenderData: function(){
        return {
            id: this.options.participant.id,
            title: this.options.participant.title
        };
    },

    displayMessage: function(message) {
    	var that = this;

    	this.$('.participant-nickname').fadeOut(function() {
  			$(this).text(message).fadeIn();
		});

    	//this.$('.me-nickname').text(message);
    	this.$('.participant-nickname').attr('title', message);

    	clearTimeout(timeoutID);

    	timeoutID = setTimeout(function() {
			that.$('.participant-nickname').text(that.options.participant.title);
    		that.$('.participant-nickname').attr('title', that.options.participant.title);    		
    	}, 10000);
    },

    getLocal: function() {
        return this.local;
    }



});	

});

;require.register("views/main_view", function(exports, require, module) {
var View     = require('./view'),
	media	 = require('../lib/media'),
    me       = require('../lib/me'),
    Participant = require('./participant'),
    Stage = require('./stage'),
    Local = require('./local'),
    IM = require('../models/im'),
    Message = require('../models/message'),
    MessageUI = require('./message');

var listOfParticipants = {};

var participantsCaps = {};

var participantOnStageID = null;
var participantOnStage = null;
var participantLocal = null;

var test_id = null;

var im = new IM();

var full = false;

module.exports = View.extend({
	id: 'main-view',

    className: 'main-view',

	template: require('./templates/main'),

	events: {
        'click .inviteButton': 'onInvitation' 
	},

	subscriptions: {
        'media:participantConnected': 'onParticipantConnected',
        'media:participantAlreadyConnected': 'onParticipantAlreadyConnected',
        'media:participantDisconnected': 'onRemoteVideoEnded',
        'media:onCallOffered': 'onCallOffered',
        'media:remoteVideoON': 'onRemoteVideoReceived',
        'media:localStreamStarted': 'onLocalMediaStarted',
    },

	initialize: function() {
        this.listenTo(me.getConference(), 'change:title', this.onConferenceTitleChange);
	},

	afterRender: function(){
        this.$('.participants').css('height', 'calc(100% - 45px)');
        $('body').css('background-color', '#000');

        media.acquireCamera(me.hasAudio(), me.hasVideo());
        this.updateConferenceTitle();
	},

	getRenderData: function(){
    },

    onParticipantConnected: function(id, caps) {

        //Store participants capabilities
        participantsCaps[id] = caps;

        // Display this participant
        this._addNewParticipantElement(id, caps.nickname);
    },

    onParticipantAlreadyConnected: function (id, caps) {
        // Store participants capabilities
        participantsCaps[id] = caps;

        // Display this participant
    	this._addNewParticipantElement(id, caps.nickname);

    	// Call this participant
    	media.callParticipant(id, caps.mediaCaps.canShareData || false);
    },

    onParticipantDisconnected: function(id) {

    },

    _addExistingParticipantOnList: function(participant) {

        listOfParticipants[participant.id] = new Participant({ participant: participant, media: media}).render();

        this.$('#participants').append(listOfParticipants[participant.id].el);

        listOfParticipants[participant.id].displayVideo();
    },

    _addNewParticipantElement: function(id, nickname, isLocal) {

        var participant = {
            id: id,
            title: nickname,
            //isLocal: isLocal || false
        };

        listOfParticipants[id] = new Participant({ participant: participant, media: media}).render();

        this.$('#participants').append(listOfParticipants[id].el);

        if(isLocal) {
            listOfParticipants[id].displayLocalVideo();
        }

        this.updateWallAccordingToParticipantNumber();
    },

    onCallOffered: function(id) {
    	media.answerParticipant(id, participantsCaps[id].mediaCaps.canShareData || false);
    },

    updateWallAccordingToParticipantNumber: function() {

        var list = this.$('.participant');

        var width,
            height;

        var l = list.length;

        if(l == 1) {
            width = '100%';
            height = '100%';
        }
        else if(l == 2) {
            width = '50%';
            height = '100%';
        }
        else if (l <= 4) {
            width = '50%';
            height = '50%';
        }
        else if (l <= 6) {
            width = '33.33%';
            height = '50%';
        }
        else if (l <= 9) {
            width = '33.33%';
            height = '33.33%';
        }
        else if (l <= 12) {
            width = '25%';
            height = '33.33%';
        }
        else if(l <= 16) {
            width = '25%';
            height = '25%';
        }
        else if(l <= 25) {
            width = '20%';
            height = '20%';
        }

        for (var i = 0;i < list.length; i++) {
            list.css('width', width );
            list.css('height', height);
        }
    },

    onRemoteVideoReceived: function(id) {
        listOfParticipants[id].displayVideo();
    },

    onRemoteVideoEnded: function(id) {

        // Remove participant from the array of caps
        participantsCaps[id] = null;
        delete participantsCaps[id];

        listOfParticipants[id].dispose();
        listOfParticipants[id] = null;
        delete listOfParticipants[id];

        this.updateWallAccordingToParticipantNumber();        
    },

    onLocalMediaStarted: function(stream, id) {

        var caps = {
            nickname: me.nickname(),
            audio: me.hasAudio(),
            video: me.hasVideo(),
            mediaCaps: media.getCapabilities()
        };

        this._addNewParticipantElement(id, caps.nickname, true);

        media.connectToServer(caps, me.getConferenceCode());
    },

    onConferenceTitleChange: function(data) {
        this.$('.title').text(me.getConferenceTitle() + ' (' + me.getConferenceCode() + ')');
    },

    updateConferenceTitle: function() {
        this.$('.title').text(me.getConferenceTitle() + ' (' + me.getConferenceCode() + ')');
    },

    onInvitation: function() {

        var title = "Invitation to join the " + me.getConferenceTitle() + " conference"

        var body = "Hi,\n\nYou are invited to join the following conference: " + me.getConferenceTitle() + "\n\n" 
        + "Click on the link to join it: " 
        + document.location.origin + "#join?room=" + me.getConferenceCode() + "\n\n" 
        + "Have fun,\n" 
        + "Infinite Wall,\nAlcatel-Lucent Enterprise"; 

        var mailto_link = 'mailto:'+'?subject='+title+'&body='+escape(body);

        window.location.href=mailto_link; 
    }

});	
});

;require.register("views/message", function(exports, require, module) {
var View     = require('./view');

module.exports = View.extend({

	tagName: "li",

    className: "message",

	template: require('./templates/message'),

	events: {
	},

	subscriptions: {

    },

    initialize: function(options) {
	},

	afterRender: function(){
	},

	getRenderData: function(){
        return {
            time: moment(this.model.get('time')).format("HH:mm"),
            issuer: this.model.get('issuer'),
            content: this.model.get('content')
        };
    }


});	
});

;require.register("views/participant", function(exports, require, module) {
var View     = require('./view');

var timeoutID = -1;

module.exports = View.extend({

	tagName: "div",

    participant: null,

    media: null,

    className: "participant",

	template: require('./templates/participant'),

	events: {
	},

	subscriptions: {

    },

    initialize: function(options) {
		this.media = options.media;
        this.participant = options.participant;
	},

	afterRender: function(){
       
	},

	getRenderData: function(){
        return {
            id: this.participant.id,
            title: this.participant.title
        };
    },

    displayVideo: function() {
        this.media.displayParticipantVideo(this.$('.participant-video')[0], this.participant.id);
    },

    displayLocalVideo: function() {
        this.media.renderLocalStream(this.$('.participant-video')[0]);
    }

});	

});

;require.register("views/stage", function(exports, require, module) {
var View     = require('./view');

var media = null;

module.exports = View.extend({

    tagName: 'span',

	template: require('./templates/stage'),

    stage: null,

	events: {
	},

	subscriptions: {

    },

    initialize: function(options) {
		media = options.media;
        this.stage = options.stage;
	},

	afterRender: function(){
	},

	getRenderData: function(){
        return {
            id: this.options.stage.id,
            title: this.options.stage.title
        };
    },

    displayVideo: function() {
    	media.displayParticipantVideo(this.$('.stage-video')[0], this.stage.id);
    },

    stopVideo: function() {
    	this.$('.stage-video')[0].src = '';
    },

    switchParticipant: function(participant) {
        this.stage = participant;
        this.updateTitle();
        this.displayVideo();
    },

    updateTitle: function() {
    	this.$('.stage-title').text(this.stage.title);
    },

    getStage: function() {
        return this.stage;
    }

});	

});

;require.register("views/templates/home", function(exports, require, module) {
var __templateData = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"container\">\n\n    <span class=\"alcatel-logo\"></span>\n\n	<div class=\"form-signin\">\n\n		<form class=\"form-horizontal\" id=\"login-form\">\n			<h2>Infinite Wall</h2>\n			<p>Face-2-Face Video Conference</p>\n			<br><br>\n			<div class=\"control-group\">\n		    	\n\n		    	<!-- Left part: image -->\n				<span class=\"login-user-avatar\" id=\"login-user-avatar-id\">\n                	<span class=\"login-user-avatar-image\" src=\"\" height=\"148\" width=\"148\" style=\"margin-left: 0px; margin-top: 0px;\"></span>\n\n        		</span>\n\n        		<!-- Right part: User settings -->\n        		<span class=\"info-user\">\n    				<label for=\"exampleInputEmail1\">Choose a nickname</label>\n        			<input type=\"text\" id=\"inputNickname\" placeholder=\"Enter a nickname\" class=\"form-control input-sm\" />\n					<br><br>\n        			<label for=\"exampleInputEmail1\">Select the media to use</label>\n        			<div class=\"btn-group filterCapability space\">\n		            	<i class=\"dropdown-arrow dropdown-arrow-inverse\"></i>\n		           	 	<button class=\"btn btn-primary btn-small filterLabel selectedCapability\" data-capabilities=\"full\">Audio + Video</button>\n		           	 	<button class=\"btn btn-primary btn-small dropdown-toggle clearfix\" data-toggle=\"dropdown\">\n		                	<span class=\"caret\"></span>\n		            	</button>\n		            	<ul class=\"dropdown-menu dropdown-inverse\">\n		                	<li class=\"l-full selected\"><a href=\"\" data-capabilities=\"full\" data-text=\"Audio + Video\" class=\"full capabilitySelector\">Audio + Video</a></li>\n		                	<li class=\"l-video\"><a href=\"\" data-capabilities=\"video\" data-text=\"Video Only\" class=\"video capabilitySelector\">Video Only</a></li>\n		            	</ul>\n		        	</div>\n        		</span>\n\n        		<br><br><hr><br>\n\n        		<!-- Bottom left part: Create a new conference -->\n        		<!-- Right part: User settings -->\n        		<span class=\"new-conference\">\n        			<label for=\"exampleInputEmail1\">Choose a conference title</label>\n        			<input type=\"text\" id=\"inputTitle\" placeholder=\"Enter a title\" class=\"form-control input-sm conferenceInput\" />\n        			<br><br>\n        			<button class=\"btn btn-info conferenceButtonCreate\" type=\"action\" id=\"joinNewButton\" disabled>Create</button>\n        		</span>\n\n        		<span class=\"existing-conference\">\n        			<label for=\"exampleInputEmail1\">Join an existing conference</label>\n        			<input type=\"text\" id=\"inputCode\" placeholder=\"Enter an access code\" class=\"form-control input-sm conferenceInput\" />\n        			<br><br>\n        			<button class=\"btn btn-inverse conferenceButtonCreate\" type=\"action\" id=\"joinExistingButton\" disabled>Join</button>\n        		</span>\n            \n		</form>\n    	\n	</div>\n\n</div>";
  });
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/local", function(exports, require, module) {
var __templateData = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<video id=\"";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "-video\" class=\"participant-video\" autoplay=\"true\"></video>\r\n<div class=\"participant-nickname\" title=";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ">";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</div>";
  return buffer;
  });
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/main", function(exports, require, module) {
var __templateData = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"wrapper\">\r\n	<div id=\"participants\" class=\"participants\"></div>\r\n	<div class=\"header\">\r\n		<span class=\"title\">Conference</span>\r\n		<span class=\"inviteButton touchButton unselectedTab\">Invite a participant</span>\r\n	</div>\r\n\r\n	\r\n</div>\r\n\r\n";
  });
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/message", function(exports, require, module) {
var __templateData = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"message-issuer\">";
  if (stack1 = helpers.issuer) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.issuer; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n<div class=\"message-time\">";
  if (stack1 = helpers.time) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.time; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n<div class=\"message-content\">";
  if (stack1 = helpers.content) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.content; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n<div class=\"clear\"></div>\r\n";
  return buffer;
  });
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/participant", function(exports, require, module) {
var __templateData = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "\r\n<video class=\"participant-video\" autoplay=\"true\">\r\n	<source class=\"participant-source\">\r\n</video>\r\n<div class=\"participant-nickname\" title=";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ">";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</div>\r\n";
  return buffer;
  });
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/templates/stage", function(exports, require, module) {
var __templateData = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<video class=\"stage-video\" autoplay=\"true\"></video>\r\n<div class=\"stage-title\" title=";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ">";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</div>";
  return buffer;
  });
if (typeof define === 'function' && define.amd) {
  define([], function() {
    return __templateData;
  });
} else if (typeof module === 'object' && module && module.exports) {
  module.exports = __templateData;
} else {
  __templateData;
}
});

;require.register("views/view", function(exports, require, module) {
require('lib/view_helper')

// Base class for all views
module.exports = Backbone.View.extend({
    
    initialize: function(){
        this.render = _.bind(this.render, this)
    },
    
    template: function(){},
    getRenderData: function(){},
    
    render: function(){
        this.$el.html(this.template(this.getRenderData()))
        this.afterRender()
        return this
    },
    
    afterRender: function(){},

    dispose: function(){
        this.remove();
        this.unbind();
    }
    
})

});

;
//@ sourceMappingURL=app.js.map
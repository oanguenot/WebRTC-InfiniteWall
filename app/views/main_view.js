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
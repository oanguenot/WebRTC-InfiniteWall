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

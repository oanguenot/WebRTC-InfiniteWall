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
